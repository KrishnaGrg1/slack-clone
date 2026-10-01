import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import {
  ArrowDown,
  AtSign,
  Bold,
  ChevronRight,
  Circle,
  Code,
  Hash,
  Italic,
  MessageSquare,
  MessageSquareText,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  Search,
  SendHorizontal,
  Smile,
  Video,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { ScrollArea } from '#/components/ui/scroll-area'
import { Textarea } from '#/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { useGetChannel, useGetChannels } from '#/hooks/use-channel'
import { useChannelMessages, channelMessagesKey } from '#/hooks/use-message'
import { useChannelSocket } from '#/hooks/use-socket'

import { parentRoute } from '#/routes/workspace/route'
import type { CallSignalEvent } from '#/lib/types/socket.types'
import { cn, uniqueId } from '#/lib/utils'
import type {
  Message,
  GetChannelMessageResponse,
} from '#/lib/types/channel.type'
import { useCall } from '#/hooks/use-call'
import VideoTile from '#/components/call/VideoTile'

export const Route = createFileRoute('/workspace/$slug/channel/$id/')({
  component: RouteComponent,
})

const routeApi = getRouteApi('/workspace/$slug')

// ── helpers ───────────────────────────────────────────────────────────────────

const GROUP_WINDOW_MS = 5 * 60 * 1000

const AVATAR_COLORS = [
  'bg-[#3B6EA5]',
  'bg-[#7C5CD6]',
  'bg-[#1D9E75]',
  'bg-[#C2547A]',
  'bg-[#B8722C]',
  'bg-[#4F8F9E]',
]

function avatarColor(name: string) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDay(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function isPending(msg: Message) {
  return msg.id.startsWith('optimistic')
}

/** Lightweight inline formatting: `code`, **bold**, _italic_, @mentions */
function renderContent(text: string): ReactNode[] {
  return text
    .split(/(`[^`\n]+`|\*\*[^*\n]+\*\*|(?<!\w)_[^_\n]+_(?!\w)|(?<!\w)@\w+)/g)
    .map((part, i) => {
      if (i % 2 === 0) return part
      if (part.startsWith('`'))
        return (
          <code
            key={i}
            className="rounded border border-[#2A2A3A] bg-[#16161F] px-1.5 py-0.5 font-mono text-[12.5px] text-[#E8A838]"
          >
            {part.slice(1, -1)}
          </code>
        )
      if (part.startsWith('**'))
        return (
          <strong key={i} className="font-semibold text-[#F5F0E8]">
            {part.slice(2, -2)}
          </strong>
        )
      if (part.startsWith('_')) return <em key={i}>{part.slice(1, -1)}</em>
      return (
        <span
          key={i}
          className="rounded bg-[#E8A838]/15 px-1 font-medium text-[#E8A838]"
        >
          {part}
        </span>
      )
    })
}

type ListItem =
  | { kind: 'divider'; key: string; label: string }
  | { kind: 'message'; key: string; msg: Message; grouped: boolean }

function buildItems(messages: Message[]): ListItem[] {
  const items: ListItem[] = []
  let prev: Message | undefined
  for (const msg of messages) {
    const newDay =
      !prev ||
      new Date(prev.created_at).toDateString() !==
        new Date(msg.created_at).toDateString()
    if (newDay) {
      items.push({
        kind: 'divider',
        key: `day-${msg.created_at}`,
        label: formatDay(msg.created_at),
      })
    }
    const grouped =
      !newDay &&
      !!prev &&
      prev.msg_type !== 'call' &&
      msg.msg_type !== 'call' &&
      prev.sender_id === msg.sender_id &&
      new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() <
        GROUP_WINDOW_MS
    items.push({ kind: 'message', key: msg.id, msg, grouped })
    prev = msg
  }
  return items
}

// ── small UI pieces ───────────────────────────────────────────────────────────

function IconButton({
  icon: Icon,
  label,
  onClick,
  side = 'top',
  className,
}: {
  icon: LucideIcon
  label: string
  onClick?: () => void
  side?: 'top' | 'bottom'
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md text-[#7A7890] transition-colors',
              'hover:bg-[#2A2A3A] hover:text-[#F5F0E8]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A838]/60',
              className,
            )}
          />
        }
      >
        <Icon className="h-4 w-4" />
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className="border-[#2A2A3A] bg-[#1C1C28] text-[11px] text-[#F5F0E8]"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

function Avatar({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  const name = msg.sender_username ?? '?'
  if (msg.sender_avatar) {
    return (
      <img
        src={msg.sender_avatar}
        alt=""
        className="h-9 w-9 shrink-0 rounded-lg object-cover"
      />
    )
  }
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
        isOwn
          ? 'bg-[#E8A838] text-[#0A0A0F]'
          : cn(avatarColor(name), 'text-white'),
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="relative my-3 flex items-center px-4" role="separator">
      <div className="h-px flex-1 bg-[#2A2A3A]" />
      <span className="mx-3 rounded-full border border-[#2A2A3A] bg-[#111118] px-3 py-0.5 text-[11px] font-medium text-[#7A7890]">
        {label}
      </span>
      <div className="h-px flex-1 bg-[#2A2A3A]" />
    </div>
  )
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  grouped,
  currentUserID,
  isThread = false,
  onReply,
}: {
  msg: Message
  grouped: boolean
  currentUserID: string
  isThread?: boolean
  onReply?: (msg: Message) => void
}) {
  const isOwn = msg.sender_id === currentUserID
  const pending = isPending(msg)

  // system message: "started a call"
  if (msg.msg_type === 'call') {
    return (
      <div className="mx-4 my-1 flex items-center gap-2.5 rounded-lg border border-[#E8A838]/15 bg-[#E8A838]/5 px-3 py-2 text-xs text-[#7A7890]">
        <Phone className="h-3.5 w-3.5 text-[#E8A838]" />
        <span>
          <span className="font-semibold text-[#F5F0E8]">
            {isOwn ? 'You' : msg.sender_username}
          </span>{' '}
          started a call
        </span>
        <span className="ml-auto text-[11px] text-[#4A4860]">
          {formatTime(msg.created_at)}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group relative flex gap-3 px-4 transition-colors hover:bg-[#111118]',
        'focus-within:bg-[#111118]',
        grouped ? 'py-0.5' : 'mt-2 pb-0.5 pt-1.5',
        isThread && 'px-3',
        pending && 'opacity-60',
      )}
    >
      {/* Gutter: avatar, or hover-time for grouped messages */}
      <div className="flex w-9 shrink-0 justify-center">
        {grouped ? (
          <span className="pt-1 text-[10px] tabular-nums text-transparent transition-colors group-hover:text-[#4A4860]">
            {formatTime(msg.created_at).replace(/\s?[AP]M/i, '')}
          </span>
        ) : (
          <Avatar msg={msg} isOwn={isOwn} />
        )}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        {!grouped && (
          <div className="mb-0.5 flex items-baseline gap-2">
            <span
              className={cn(
                'text-sm font-semibold hover:underline',
                isOwn ? 'text-[#E8A838]' : 'text-[#F5F0E8]',
              )}
            >
              {isOwn ? 'You' : msg.sender_username}
            </span>
            <time
              dateTime={msg.created_at}
              className="text-[11px] text-[#4A4860]"
            >
              {formatTime(msg.created_at)}
            </time>
          </div>
        )}

        <p className="break-words whitespace-pre-wrap text-[14.5px] leading-[1.55] text-[#D0CCC4]">
          {renderContent(msg.content)}
          {msg.edited_at && (
            <span className="ml-1.5 text-[10px] text-[#4A4860]">(edited)</span>
          )}
          {pending && (
            <span className="ml-1.5 text-[10px] text-[#4A4860]">Sending…</span>
          )}
        </p>

        {/* Thread reply count — only on top-level messages */}
        {!isThread && msg.reply_count > 0 && (
          <button
            type="button"
            onClick={() => onReply?.(msg)}
            className="group/reply mt-1.5 flex items-center gap-1.5 rounded-md border border-transparent px-1.5 py-1 text-xs font-medium text-[#E8A838] transition-colors hover:border-[#2A2A3A] hover:bg-[#16161F]"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>
              {msg.reply_count} {msg.reply_count === 1 ? 'reply' : 'replies'}
            </span>
            <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover/reply:opacity-100" />
          </button>
        )}
      </div>

      {/* Floating hover toolbar */}
      {!pending && (
        <div
          className={cn(
            'absolute -top-3.5 right-4 flex items-center gap-0.5 rounded-lg border border-[#2A2A3A] bg-[#16161F] p-0.5 shadow-lg shadow-black/40',
            'pointer-events-none opacity-0 transition-opacity',
            'group-hover:pointer-events-auto group-hover:opacity-100',
            'group-focus-within:pointer-events-auto group-focus-within:opacity-100',
          )}
        >
          <IconButton icon={Smile} label="Add reaction" />
          {!isThread && (
            <IconButton
              icon={MessageSquare}
              label="Reply in thread"
              onClick={() => onReply?.(msg)}
            />
          )}
          <IconButton icon={Phone} label="Call from here" />
          <IconButton icon={MoreHorizontal} label="More actions" />
        </div>
      )}
    </div>
  )
}

// ── Skeleton / TypingIndicator ────────────────────────────────────────────────

function MessageSkeleton() {
  return (
    <div className="space-y-5 px-4 py-4" aria-hidden>
      {[72, 48, 88, 60].map((w, i) => (
        <div key={i} className="flex animate-pulse gap-3">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-[#1C1C28]" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 w-28 rounded bg-[#1C1C28]" />
            <div
              className="h-3 rounded bg-[#16161F]"
              style={{ width: `${w}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function TypingIndicator({ names }: { names: string[] }) {
  const text =
    names.length === 0
      ? ''
      : names.length === 1
        ? `${names[0]} is typing`
        : names.length === 2
          ? `${names[0]} and ${names[1]} are typing`
          : 'Several people are typing'

  return (
    <div
      className="flex h-6 shrink-0 items-center gap-1.5 px-5 text-[11px] text-[#7A7890]"
      aria-live="polite"
    >
      {names.length > 0 && (
        <>
          <span className="flex items-center gap-0.5" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1 w-1 animate-bounce rounded-full bg-[#E8A838]"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </span>
          <span>{text}</span>
        </>
      )}
    </div>
  )
}

// ── IncomingCallBanner ─────────────────────────────────────────────────────

function IncomingCallBanner({
  onJoin,
  onDismiss,
  callerName,
}: {
  onJoin: () => void
  onDismiss: () => void
  callerName?: string
}) {
  return (
    <div className="mx-4 mt-3 flex shrink-0 items-center gap-3 rounded-xl border border-[#1D9E75]/25 bg-[#1D9E75]/10 px-3.5 py-2.5">
      <div className="flex items-center gap-2">
        <Circle className="h-2 w-2 animate-pulse fill-[#1D9E75] text-[#1D9E75]" />
        <span className="text-xs font-semibold text-[#1D9E75]">
          Incoming call
        </span>
      </div>
      <span className="text-[11px] text-[#7A7890]">
        {callerName ? `${callerName} is calling` : 'Someone is calling'}
      </span>
      <div className="ml-auto flex items-center gap-1.5">
        <button
          type="button"
          onClick={onJoin}
          className="rounded-md bg-[#1D9E75] px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#1D9E75]/80"
        >
          Join
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md px-3 py-1 text-[11px] font-semibold text-[#E05555] transition-colors hover:bg-[#E05555]/10"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

// ── RouteComponent ────────────────────────────────────────────────────────────

function RouteComponent() {
  const { id } = Route.useParams()
  const signalRef = useRef<((msg: CallSignalEvent) => void) | null>(null)
  const { workspace } = routeApi.useLoaderData()
  const { user } = parentRoute.useLoaderData()
  const queryClient = useQueryClient()
  const workspaceId = workspace.data.workspace.id

  const { data: channels } = useGetChannels(workspaceId)
  const { data: channel } = useGetChannel(workspaceId, id)
  const { data: channelMessages, isLoading } = useChannelMessages(
    id,
    workspaceId,
  )

  const messages: Message[] = useMemo(() => {
    const raw = channelMessages?.data?.messages ?? []
    return [...raw].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
  }, [channelMessages])

  const memberNameMap = useMemo(
    () =>
      Object.fromEntries(
        (workspace.data.members ?? []).map((member) => [
          member.id,
          member.username,
        ]),
      ),
    [workspace.data.members],
  )

  const callNameFor = useCallback(
    (userId: string) => memberNameMap[userId] ?? userId.slice(0, 6),
    [memberNameMap],
  )

  const items = useMemo(() => buildItems(messages), [messages])
  const currentChannel =
    channel?.data.channel ?? channels?.data.find((c) => c.id === id)

  // ── draft state ─────────────────────────────────────────────────────────────
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── typing indicator ────────────────────────────────────────────────────────
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})

  const addTyping = useCallback(
    (userID: string, username: string) => {
      if (userID === user.id) return
      setTypingUsers((prev) => ({ ...prev, [userID]: username }))
    },
    [user.id],
  )

  const removeTyping = useCallback((userID: string) => {
    setTypingUsers((prev) => {
      const next = { ...prev }
      delete next[userID]
      return next
    })
  }, [])

  // ── smart auto-scroll ───────────────────────────────────────────────────────
  // Only stick to the bottom if the reader is already there (or just sent
  // something). Otherwise show a "Jump to latest" pill instead of yanking them.
  const bottomRef = useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = useState(true)
  const prevCount = useRef(0)

  useEffect(() => {
    const el = bottomRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setAtBottom(entry.isIntersecting),
      { rootMargin: '0px 0px 96px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const last = messages.at(-1)
    const firstLoad = prevCount.current === 0 && messages.length > 0
    const sentByMe = last?.sender_id === user.id
    if (firstLoad) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' })
    } else if (messages.length > prevCount.current && (atBottom || sentByMe)) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevCount.current = messages.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length])

  // ── socket ──────────────────────────────────────────────────────────────────
  const { send } = useChannelSocket(id, workspaceId, {
    onTyping: addTyping,
    onTypingStop: removeTyping,
    onSignal: (msg) => signalRef.current?.(msg),
  })

  // ── typing debounce — only fire typing.start once per 2s ────────────────────
  const typingSentAt = useRef<number>(0)
  const handleTyping = useCallback(() => {
    const now = Date.now()
    if (now - typingSentAt.current > 2000) {
      send({ msg_type: 'typing.start' })
      typingSentAt.current = now
    }
  }, [send])

  // ── send message ─────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const content = draft.trim()
    if (!content) return

    // optimistic: append to cache immediately so sender sees it at once
    const optimistic: Message = {
      id: uniqueId('optimistic'),
      channel_id: id,
      sender_id: user.id,
      sender_username: user.username,
      sender_avatar: user.avatar_url ?? '',
      content,
      thread_id: '',
      msg_type: 'text',
      created_at: new Date().toISOString(),
      edited_at: '',
      reply_count: 0,
    }

    queryClient.setQueryData(
      channelMessagesKey(workspaceId, id),
      (old: GetChannelMessageResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: { messages: [...(old.data?.messages ?? []), optimistic] },
        }
      },
    )

    setDraft('')
    // server broadcasts message.new → useChannelSocket replaces optimistic with real
    send({ msg_type: 'message.send', content })
  }, [draft, id, workspaceId, user, queryClient, send])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  // ── composer formatting: wrap the selection with markers ─────────────────────
  const applyFormat = useCallback(
    (before: string, after = before) => {
      const el = textareaRef.current
      if (!el) return
      const { selectionStart: s, selectionEnd: e } = el
      setDraft(
        draft.slice(0, s) + before + draft.slice(s, e) + after + draft.slice(e),
      )
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(s + before.length, e + before.length)
      })
    },
    [draft],
  )

  const canSend = draft.trim().length > 0
  const channelName = currentChannel?.name ?? 'channel'

  const call = useCall({ channelId: id, userId: user.id, send })
  signalRef.current = call.handleSignal
  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delay={200}>
      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[#0A0A0F] text-[#F5F0E8]">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#2A2A3A] bg-[#0A0A0F]/95 px-5 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <Hash className="h-[18px] w-[18px] shrink-0 text-[#7A7890]" />
            <h1 className="truncate text-[15px] font-bold text-[#F5F0E8]">
              {channelName}
            </h1>
            <span className="mx-1 h-4 w-px bg-[#2A2A3A]" />
            <p className="truncate text-xs text-[#7A7890]">
              {workspace.data.workspace.name}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => call.start()}
                    className="flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-[#B8B4AC] transition-colors hover:bg-[#2A2A3A] hover:text-[#F5F0E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A838]/60"
                  />
                }
              >
                <Video className="h-4 w-4" />
                Call
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="border-[#2A2A3A] bg-[#1C1C28] text-[11px] text-[#F5F0E8]"
              >
                Start a thread call
              </TooltipContent>
            </Tooltip>
            <IconButton
              icon={Search}
              label="Search"
              side="bottom"
              className="h-8 w-8"
            />
            <IconButton
              icon={MoreHorizontal}
              label="More"
              side="bottom"
              className="h-8 w-8"
            />
          </div>
        </header>

        {call.incomingCall && (
          <IncomingCallBanner
            onJoin={call.join}
            onDismiss={call.dismiss}
            callerName={callNameFor(call.incomingCall.user_id)}
          />
        )}
        {call.mediaError && (
          <p className="mx-4 mt-3 text-xs text-[#E05555]">{call.mediaError}</p>
        )}

        {call.callId && (
          <div className="mx-4 mt-3 rounded-xl border border-[#E8A838]/25 bg-[#E8A838]/10 p-3">
            <div className="flex flex-wrap items-start gap-3">
              <VideoTile stream={call.local} label="You" muted />
              {Object.entries(call.remotes).map(([id, stream]) => (
                <VideoTile key={id} stream={stream} label={callNameFor(id)} />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-[#F5F0E8]">
              <span>In call · {call.peers.length} other(s)</span>
              <button
                type="button"
                onClick={call.toggleMute}
                className="ml-auto rounded-md px-3 py-1 hover:bg-[#2A2A3A]"
              >
                {call.muted ? 'Unmute' : 'Mute'}
              </button>
              <button
                type="button"
                onClick={call.toggleCamera}
                className="rounded-md px-3 py-1 hover:bg-[#2A2A3A]"
              >
                {call.cameraOff ? 'Camera on' : 'Camera off'}
              </button>
              <button
                type="button"
                onClick={call.leave}
                className="rounded-md px-3 py-1 font-semibold text-[#E05555] hover:bg-[#E05555]/10"
              >
                Leave
              </button>
            </div>
          </div>
        )}
        {/* {call.status === 'active' && call.local && (
          <CallPanel call={call} names={names} />
        )} */}

        {/* Messages */}
        <div className="relative min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="pb-4 pt-6">
              {/* channel intro */}
              <div className="mb-4 px-4 pb-5">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8A838]/10 text-[#E8A838] ring-1 ring-[#E8A838]/20">
                  <Hash className="h-6 w-6" />
                </div>
                <h2 className="mb-1 text-2xl font-bold tracking-tight text-[#F5F0E8]">
                  Welcome to #{channelName}
                </h2>
                <p className="max-w-md text-sm leading-6 text-[#7A7890]">
                  This is the start of the #{channelName} channel. Send a
                  message to get the conversation going.
                </p>
              </div>

              {isLoading ? (
                <MessageSkeleton />
              ) : messages.length === 0 ? (
                <div className="flex min-h-[220px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#16161F] text-[#7A7890]">
                      <MessageSquareText className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1 text-sm font-semibold text-[#F5F0E8]">
                      No messages yet
                    </h3>
                    <p className="text-xs text-[#7A7890]">
                      Send the first message to #{channelName}.
                    </p>
                  </div>
                </div>
              ) : (
                <div role="log" aria-label={`Messages in ${channelName}`}>
                  {items.map((item) =>
                    item.kind === 'divider' ? (
                      <DayDivider key={item.key} label={item.label} />
                    ) : (
                      <MessageBubble
                        key={item.key}
                        msg={item.msg}
                        grouped={item.grouped}
                        currentUserID={user.id}
                        // onReply={openThread} ← wire up when thread panel is ready
                      />
                    ),
                  )}
                </div>
              )}

              {/* auto-scroll anchor */}
              <div ref={bottomRef} className="h-px" />
            </div>
          </ScrollArea>

          {/* Jump to latest */}
          <button
            type="button"
            onClick={() =>
              bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
            className={cn(
              'absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#2A2A3A] bg-[#1C1C28] px-3.5 py-1.5 text-xs font-medium text-[#F5F0E8] shadow-lg shadow-black/50 transition-all hover:border-[#E8A838]/40 hover:text-[#E8A838]',
              atBottom
                ? 'pointer-events-none translate-y-2 opacity-0'
                : 'opacity-100',
            )}
            tabIndex={atBottom ? -1 : 0}
          >
            <ArrowDown className="h-3.5 w-3.5" />
            Jump to latest
          </button>
        </div>

        {/* Typing indicator — fixed height so the composer never jumps */}
        <TypingIndicator names={Object.values(typingUsers)} />

        {/* Composer */}
        <div className="shrink-0 px-4 pb-4">
          <div className="rounded-xl border border-[#2A2A3A] bg-[#111118] transition-colors focus-within:border-[#E8A838]/40 focus-within:ring-1 focus-within:ring-[#E8A838]/20">
            {/* formatting bar */}
            <div className="flex items-center gap-0.5 border-b border-[#2A2A3A]/70 px-2 py-1">
              <IconButton
                icon={Bold}
                label="Bold"
                onClick={() => applyFormat('**')}
              />
              <IconButton
                icon={Italic}
                label="Italic"
                onClick={() => applyFormat('_')}
              />
              <IconButton
                icon={Code}
                label="Code"
                onClick={() => applyFormat('`')}
              />
            </div>

            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value)
                handleTyping()
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={`Message #${channelName}`}
              aria-label={`Message #${channelName}`}
              className="field-sizing-content max-h-[200px] min-h-[44px] resize-none rounded-none border-0 bg-transparent px-3.5 py-3 text-[14.5px] text-[#F5F0E8] shadow-none placeholder:text-[#4A4860] focus-visible:ring-0"
            />

            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-0.5">
                <IconButton icon={Plus} label="Attach" />
                <IconButton icon={Paperclip} label="Upload file" />
                <IconButton icon={Smile} label="Emoji" />
                <IconButton icon={AtSign} label="Mention" />
              </div>

              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Send message"
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A838]/60',
                  canSend
                    ? 'bg-[#E8A838] text-[#0A0A0F] hover:bg-[#F0B848] active:scale-95'
                    : 'cursor-not-allowed bg-[#1C1C28] text-[#4A4860]',
                )}
              >
                <SendHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="mt-1.5 px-1 text-right text-[10px] text-[#4A4860]">
            <kbd className="font-mono">Shift + Enter</kbd> for a new line
          </p>
        </div>
      </main>
    </TooltipProvider>
  )
}
