import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { ChatSocket } from '#/lib/websocket/client'
import type { ClientEvent, ServerEvent } from '#/lib/types/socket.types'
import type { Message } from '#/lib/types/channel.type'

export function useChannelSocket(channelID: string) {
  const queryClient = useQueryClient()

  const socketRef = useRef<ChatSocket | null>(null)

  useEffect(() => {
    const socket = new ChatSocket(channelID)

    socketRef.current = socket

    const unsubscribe = socket.subscribe(
      (event: ServerEvent) => {
        switch (event.msg_type) {
          case 'message.new':
            queryClient.setQueryData(
              ['messages', channelID],
              (old: Message[] | undefined) => {
                if (!old) return old

                return [...old, event]
              },
            )

            break

          case 'typing':
            // handle later

            break

          case 'call.incoming':
            // handle later

            break

          case 'error':
            console.error(event.message)

            break
        }
      },
    )

    socket.connect()

    return () => {
      unsubscribe()
      socket.close()
      socketRef.current = null
    }
  }, [channelID, queryClient])

  function send(event: ClientEvent) {
    socketRef.current?.send(event)
  }

  return {
    send,
  }
}