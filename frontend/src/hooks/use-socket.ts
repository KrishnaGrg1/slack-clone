import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { ChatSocket } from '#/lib/websocket/client'
import { getWsToken } from '#/lib/services/ws-token'
import { uniqueId } from '#/lib/utils'
import type {
  ClientEvent,
  ServerEvent,
  CallSignalEvent,
} from '#/lib/types/socket.types'
import type {
  Message,
  GetChannelMessageResponse,
} from '#/lib/types/channel.type'

// imported from use-message so both hooks share the exact same key
import { channelMessagesKey } from '#/hooks/use-message'

// How long (ms) before we consider a user has stopped typing
const TYPING_TIMEOUT = 3000

export function useChannelSocket(
  channelID: string,
  workspaceID: string,
  // optional callbacks the component can hook into
  callbacks?: {
    onTyping?: (userID: string, username: string) => void
    onTypingStop?: (userID: string) => void
    onSignal?: (msg: CallSignalEvent) => void
  },
) {
  const queryClient = useQueryClient()
  const socketRef = useRef<ChatSocket | null>(null)
  // track per-user typing timers so we can clear them on stop
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  // keep callbacks in a ref so changing them does not tear down the socket
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    const socket = new ChatSocket(channelID, () => getWsToken())
    socketRef.current = socket

    const unsubscribe = socket.subscribe((event: ServerEvent) => {
      const cbs = callbacksRef.current
      switch (event.msg_type) {
        // ── new message ───────────────────────────────────────────────────────
        case 'message.new': {
          // Build a Message from the WS event.
          // The server sends sender_username in the event — use it directly.
          const newMsg: Message = {
            id: uniqueId('ws'), // temp ID until page refetch
            channel_id: event.channel_id,
            sender_id: event.sender_id,
            sender_username: event.sender_username,
            sender_avatar: '', // not in WS event — avatar comes from REST
            content: event.content,
            thread_id: event.thread_id ?? '',
            msg_type: 'text',
            created_at: new Date().toISOString(),
            edited_at: '',
            reply_count: 0,
          }

          queryClient.setQueryData(
            // ← use channelMessagesKey so this matches useChannelMessages
            channelMessagesKey(workspaceID, channelID),
            (old: GetChannelMessageResponse | undefined) => {
              if (!old) return old

              const existing = old.data?.messages ?? []

              // Dedup: skip if we already have an optimistic message with
              // the same sender + content sent within the last 5 seconds.
              const isDuplicate = existing.some(
                (m) =>
                  m.sender_id === newMsg.sender_id &&
                  m.content === newMsg.content &&
                  m.id.startsWith('optimistic-') &&
                  Date.now() - new Date(m.created_at).getTime() < 5000,
              )

              if (isDuplicate) {
                // Replace the optimistic message with the real one
                return {
                  ...old,
                  data: {
                    messages: existing.map((m) =>
                      m.sender_id === newMsg.sender_id &&
                      m.content === newMsg.content &&
                      m.id.startsWith('optimistic-')
                        ? newMsg
                        : m,
                    ),
                  },
                }
              }

              return {
                ...old,
                data: {
                  messages: [...existing, newMsg],
                },
              }
            },
          )
          break
        }

        // ── typing ────────────────────────────────────────────────────────────
        case 'typing': {
          const { sender_id, sender_username } = event

          // notify component so it can show the indicator
          cbs?.onTyping?.(sender_id, sender_username ?? sender_id)

          // auto-clear after timeout
          clearTimeout(typingTimers.current[sender_id])
          typingTimers.current[sender_id] = setTimeout(() => {
            cbs?.onTypingStop?.(sender_id)
            delete typingTimers.current[sender_id]
          }, TYPING_TIMEOUT)
          break
        }

        case 'error': {
          console.error('[ws] server error:', event.message)
          break
        }

        default:
          // Forward all call.* and rtc.* messages to the call hook.
          if (
            event.msg_type.startsWith('call.') ||
            event.msg_type.startsWith('rtc.')
          ) {
            cbs?.onSignal?.(event)
          }
          break
      }
    })

    void socket.connect()

    return () => {
      unsubscribe()
      socket.close()
      socketRef.current = null
      // clear all typing timers on unmount
      Object.values(typingTimers.current).forEach(clearTimeout)
      typingTimers.current = {}
    }
  }, [channelID, workspaceID, queryClient])
  // ↑ workspaceID added to deps because channelMessagesKey needs it

  function send(event: ClientEvent) {
    socketRef.current?.send(event)
  }

  return { send }
}
