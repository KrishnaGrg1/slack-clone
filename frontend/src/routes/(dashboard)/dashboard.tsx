import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Hash,
  Search,
  Phone,
  Video,
  MoreHorizontal,
  Smile,
  Paperclip,
  Send,
  ChevronRight,
  ChevronDown,
  Circle,
  Bot,
  CheckCheck,
  MessageSquare,
} from 'lucide-react'

import { createFileRoute } from '@tanstack/react-router'
import CallOverlay from '#/components/call/CallOverlay'
import {
  CHANNELS,
  MESSAGES,
  ONLINE_MEMBERS,
  type CallSummary,
  type Message,
} from '#/components/dashboard/mock'
import Sidebar from '#/components/dashboard/sidebar'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '#/components/ui/avatar'

export const Route = createFileRoute('/(dashboard)/dashboard')({
  component: Dashboard,
})

// ── Shared avatar tokens ─────────────────────────────────────────────────

const avatarColorByLetter: Record<string, 'amber' | 'teal' | 'purple'> = {
  K: 'amber',
  R: 'teal',
  S: 'purple',
  A: 'teal',
}

const avatarColorClasses = {
  amber: 'bg-[#E8A838] text-[#0A0A0F]',
  teal: 'bg-[#1D9E75] text-[#0A0A0F]',
  purple: 'bg-[#7F77DD] text-white',
} as const

const avatarSizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
} as const

// ── Call summary card ──────────────────────────────────────────────────────

function CallSummaryCard({ summary }: { summary: CallSummary }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <Card className="mt-2 gap-0 rounded-xl border-[#E8A838]/20 bg-[#E8A838]/[0.04] p-0 shadow-none">
      {/* call badge */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[#E8A838]/10">
        <div className="w-7 h-7 rounded-md bg-[#1D9E75] flex items-center justify-center shrink-0">
          <Phone className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#1D9E75]">
            Thread call ended
          </p>
          <p className="text-[10px] text-[#7A7890]">
            {summary.participants.join(', ')} · {summary.duration}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded((v) => !v)}
          className="h-6 w-6 text-[#4A4860] hover:text-[#7A7890] hover:bg-transparent"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>

      {/* AI summary */}
      {expanded && (
        <div className="p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded bg-[#E8A838]/15 flex items-center justify-center">
              <Bot className="w-3 h-3 text-[#E8A838]" />
            </div>
            <span className="text-xs font-semibold text-[#E8A838]">
              AI Summary
            </span>
            <Badge
              variant="outline"
              className="ml-auto h-4 border-[#2A2A3A] px-1.5 text-[9px] font-normal text-[#4A4860]"
            >
              GPT-4o
            </Badge>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-semibold text-[#4A4860] uppercase tracking-wider mb-1.5">
                Decisions
              </p>
              {summary.decisions.map((d, i) => (
                <div
                  key={i}
                  className="flex gap-2 text-[11px] leading-5 text-[#C8C4BE] mb-1"
                >
                  <CheckCheck className="w-3 h-3 text-[#1D9E75] shrink-0 mt-0.5" />
                  <span>{d}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[10px] font-semibold text-[#4A4860] uppercase tracking-wider mb-1.5">
                Action items
              </p>
              {summary.action_items.map((a, i) => (
                <div
                  key={i}
                  className="flex gap-2 text-[11px] leading-5 text-[#C8C4BE] mb-1"
                >
                  <span className="text-[#E8A838] shrink-0">▸</span>
                  <span>
                    <span className="text-[#E8A838] font-semibold">
                      {a.owner}
                    </span>
                    {' — '}
                    {a.task}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[10px] font-semibold text-[#4A4860] uppercase tracking-wider mb-1.5">
                Key points
              </p>
              {summary.key_points.map((k, i) => (
                <div
                  key={i}
                  className="flex gap-2 text-[11px] leading-5 text-[#C8C4BE] mb-1"
                >
                  <span className="text-[#7A7890] shrink-0">·</span>
                  <span>{k}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

// ── Message bubble ─────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isThread = false,
}: {
  msg: Message
  isThread?: boolean
}) {
  if (msg.msgType === 'call_summary' && msg.summary) {
    return (
      <div className="px-4 py-2">
        <CallSummaryCard summary={msg.summary} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group flex gap-2.5 px-4 py-1.5 hover:bg-[#111118]/60 transition-colors duration-200',
        isThread && 'px-3',
      )}
    >
      <Avatar className={cn('rounded-md shrink-0', avatarSizeClasses.md)}>
        <AvatarFallback
          className={cn(
            'rounded-full font-bold',
            avatarColorClasses[avatarColorByLetter[msg.avatar] ?? 'teal'],
          )}
        >
          {msg.avatar}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-xs font-semibold text-[#F5F0E8]">
            {msg.senderName}
          </span>
          <span className="text-[10px] text-[#4A4860]">{msg.createdAt}</span>
        </div>
        <p className="text-sm leading-6 text-[#C8C4BE] break-words">
          {msg.content}
        </p>
        {msg.replyCount && msg.replyCount > 0 && (
          <button className="mt-1 flex items-center gap-1.5 text-[11px] text-[#7A7890] hover:text-[#E8A838] transition-colors group/reply">
            <MessageSquare className="w-3 h-3" />
            <span>
              {msg.replyCount} {msg.replyCount === 1 ? 'reply' : 'replies'}
            </span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover/reply:opacity-100 transition-opacity" />
          </button>
        )}
      </div>
      {/* hover actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
        <TooltipProvider delay={200}>
          {[
            { icon: Smile, label: 'React' },
            { icon: MessageSquare, label: 'Reply in thread' },
            { icon: Phone, label: 'Call from here' },
            { icon: MoreHorizontal, label: 'More' },
          ].map(({ icon: Icon, label }) => (
            <Tooltip key={label}>
              <TooltipTrigger>
                <button className="p-1.5 rounded-md text-[#4A4860] hover:text-[#F5F0E8] hover:bg-[#2A2A3A] transition-all">
                  <Icon className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-[#1C1C28] border-[#2A2A3A] text-[11px] text-[#F5F0E8]"
              >
                {label}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  )
}

// ── Channel header ─────────────────────────────────────────────────────────

function ChannelHeader({
  channelName,
  onCallStart,
}: {
  channelName: string
  onCallStart: () => void
}) {
  const online = ONLINE_MEMBERS.filter((m) => m.online)
  const visibleOnline = online.slice(0, 4)
  const remainingOnline = online.length - visibleOnline.length

  return (
    <div className="h-12 flex items-center justify-between px-4 border-b border-[#2A2A3A] shrink-0 bg-[#16161F]">
      <div className="flex items-center gap-2.5">
        <Hash className="w-4 h-4 text-[#4A4860]" />
        <span className="text-sm font-semibold text-[#F5F0E8]">
          {channelName}
        </span>
        <div className="flex items-center gap-1.5 ml-1">
          <AvatarGroup className="-space-x-1.5">
            {visibleOnline.map((m) => (
              <Avatar
                key={m.id}
                className="h-5 w-5 rounded-full ring-2 ring-[#16161F]"
              >
                <AvatarFallback
                  className={cn(
                    'text-[8px] font-bold',
                    avatarColorClasses[avatarColorByLetter[m.avatar] ?? 'teal'],
                  )}
                >
                  {m.avatar}
                </AvatarFallback>
              </Avatar>
            ))}
            {remainingOnline > 0 && (
              <AvatarGroupCount className="h-5 w-5 text-[8px] ring-2 ring-[#16161F]">
                +{remainingOnline}
              </AvatarGroupCount>
            )}
          </AvatarGroup>
          <span className="text-[10px] text-[#4A4860]">
            {online.length} online
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <TooltipProvider delay={200}>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCallStart}
                className="h-7 px-2.5 text-[#4A4860] hover:text-[#F5F0E8] hover:bg-[#2A2A3A] gap-1.5"
              >
                <Video className="w-3.5 h-3.5" />
                <span className="text-xs">Call</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-[#1C1C28] border-[#2A2A3A] text-[11px] text-[#F5F0E8]"
            >
              Start a thread call
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-[#4A4860] hover:text-[#F5F0E8] hover:bg-[#2A2A3A]"
        >
          <Search className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-[#4A4860] hover:text-[#F5F0E8] hover:bg-[#2A2A3A]"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ── Message input ──────────────────────────────────────────────────────────

function MessageInput({ placeholder }: { placeholder: string }) {
  const [value, setValue] = useState('')

  return (
    <div className="px-4 pb-4 pt-2 shrink-0">
      <div className="flex items-end gap-2 bg-[#111118] border border-[#2A2A3A] rounded-xl px-3 py-2.5 focus-within:border-[#E8A838]/40 transition-colors">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 mb-0.5 text-[#4A4860] hover:text-[#F5F0E8] hover:bg-transparent"
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={1}
          className="min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-sm text-[#F5F0E8] placeholder:text-[#4A4860] shadow-none outline-none focus-visible:ring-0 leading-6 max-h-32 overflow-y-auto"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              setValue('')
            }
          }}
        />
        <div className="flex items-center gap-1 shrink-0 mb-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-[#4A4860] hover:text-[#F5F0E8] hover:bg-transparent"
          >
            <Smile className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={!value.trim()}
            className={cn(
              'h-7 w-7 rounded-lg transition-all duration-200',
              value.trim()
                ? 'bg-[#E8A838] text-[#0A0A0F] hover:bg-[#F0B848] hover:text-[#0A0A0F]'
                : 'text-[#4A4860] hover:bg-transparent hover:text-[#4A4860]',
            )}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Active call banner ─────────────────────────────────────────────────────

function ActiveCallBanner({ onLeave }: { onLeave: () => void }) {
  return (
    <div className="mx-4 mt-2 flex items-center gap-3 px-3 py-2.5 bg-[#1D9E75]/10 border border-[#1D9E75]/25 rounded-xl shrink-0">
      <div className="flex items-center gap-1.5">
        <Circle className="w-2 h-2 fill-[#1D9E75] text-[#1D9E75] animate-pulse" />
        <span className="text-xs font-semibold text-[#1D9E75]">
          Call in progress
        </span>
      </div>
      <span className="text-[10px] text-[#4A4860]">krishna, rohan · 0:34</span>
      <div className="ml-auto flex items-center gap-1.5">
        <button className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-[#1D9E75] text-white hover:bg-[#1D9E75]/80 transition-colors">
          Join
        </button>
        <button
          onClick={onLeave}
          className="px-2.5 py-1 rounded-md text-[10px] font-semibold text-[#E05555] hover:bg-[#E05555]/10 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeChannel, setActiveChannel] = useState('2')
  const [activeCallVisible, setActiveCallVisible] = useState(false)
  const activeChannelData = CHANNELS.find((c) => c.id === activeChannel)
  const [inCall, setInCall] = useState(false)
  return (
    <div className="h-screen flex bg-[#0A0A0F] overflow-hidden font-mono">
      <Sidebar
        activeChannel={activeChannel}
        onChannelSelect={setActiveChannel}
      />

      {/* main */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {inCall && <CallOverlay onEnd={() => setInCall(false)} />}
        <ChannelHeader
          channelName={activeChannelData?.name ?? 'general'}
          onCallStart={() => setActiveCallVisible(true)}
        />

        {activeCallVisible && (
          <ActiveCallBanner onLeave={() => setActiveCallVisible(false)} />
        )}

        {/* messages */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="py-4 space-y-0.5">
            {/* channel start marker */}
            <div className="px-4 pb-4 mb-2 border-b border-[#2A2A3A]">
              <div className="w-10 h-10 rounded-xl bg-[#E8A838]/10 border border-[#E8A838]/20 flex items-center justify-center mb-3">
                <Hash className="w-5 h-5 text-[#E8A838]" />
              </div>
              <h2
                className="text-lg font-semibold text-[#F5F0E8] mb-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                # {activeChannelData?.name}
              </h2>
              <p className="text-xs text-[#4A4860]">
                This is the beginning of #{activeChannelData?.name}. Start a
                conversation or call from any message.
              </p>
            </div>

            {MESSAGES.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </div>
        </ScrollArea>

        <MessageInput placeholder={`Message #${activeChannelData?.name}`} />
      </div>
    </div>
  )
}
