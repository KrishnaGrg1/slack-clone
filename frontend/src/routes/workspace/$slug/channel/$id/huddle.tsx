// frontend/src/routes/workspace/$slug/channel/$id/huddle.tsx
//
// The call popup. It OWNS the call: its own WebSocket, camera/mic, peer connections.
// Opened from the channel page with:
//   ?mode=start                 -> start a new call (or join if one already exists)
//   ?mode=join&callId=<id>      -> join that call

import {
  createFileRoute,
  getRouteApi,
  useNavigate,
} from '@tanstack/react-router'
import {
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  UserRound,
  Users,
  Video,
  VideoOff,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import VideoTile from '#/components/call/VideoTile'
import { Button } from '#/components/ui/button'
import { useCall } from '#/hooks/use-call'
import { useChannelSocket } from '#/hooks/use-socket'
import { parentRoute } from '#/routes/workspace/route'
import type { CallSignalEvent } from '#/lib/types/socket.types'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/workspace/$slug/channel/$id/huddle')({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s.mode === 'join' ? ('join' as const) : ('start' as const),
    callId: typeof s.callId === 'string' ? s.callId : undefined,
  }),
  component: RouteComponent,
})

const routeApi = getRouteApi('/workspace/$slug')

function RouteComponent() {
  const { id, slug } = Route.useParams()
  const { mode, callId: joinCallId } = Route.useSearch()
  const navigate = useNavigate()
  const { workspace } = routeApi.useLoaderData()
  const { user } = parentRoute.useLoaderData()
  const workspaceId = workspace.data.workspace.id

  // ── socket + call ───────────────────────────────────────────────────────────
  const signalRef = useRef<((msg: CallSignalEvent) => void) | null>(null)

  const { send } = useChannelSocket(id, workspaceId, {
    onTyping: () => {},
    onTypingStop: () => {},
    onSignal: (msg) => signalRef.current?.(msg),
  })

  const call = useCall({ channelId: id, userId: user.id, send })
  signalRef.current = call.handleSignal

  // ── names ───────────────────────────────────────────────────────────────────
  const memberNameMap = useMemo(
    () =>
      Object.fromEntries(
        (workspace.data.members ?? []).map((m) => [m.id, m.username]),
      ),
    [workspace.data.members],
  )

  const callNameFor = useCallback(
    (userId: string) => memberNameMap[userId] ?? userId.slice(0, 6),
    [memberNameMap],
  )

  // ── 1) start or join automatically, once ───────────────────────────────────
  // TEMPORARY: the 700ms wait gives the WebSocket time to open.
  // Replace with a real "socket is open" signal once ChatSocket exposes one.
  const startedRef = useRef(false)
  useEffect(() => {
    const t = setTimeout(() => {
      if (startedRef.current) return
      startedRef.current = true
      if (mode === 'join' && joinCallId) void call.join(joinCallId)
      else void call.start()
    }, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 2) when the call ends (leave, or everyone left), close this window ──────
  const wasInCall = useRef(false)
  useEffect(() => {
    if (call.callId) {
      wasInCall.current = true
      return
    }
    if (!wasInCall.current) return
    window.close()
    // fallback if the browser refuses to close it (e.g. opened by typing the URL)
    setTimeout(
      () =>
        navigate({
          to: '/workspace/$slug/channel/$id',
          params: { slug, id },
          replace: true,
        }),
      300,
    )
  }, [call.callId, id, navigate, slug])

  // ── view data ───────────────────────────────────────────────────────────────
  const micOn = !call.muted
  const camOn = !call.cameraOff

  const callLabel = call.callId
    ? `Call · ${call.callId.slice(0, 6)}`
    : 'Starting call...'

  const participants = useMemo(() => {
    const list = [{ id: user.id, name: user.username || 'You', isSelf: true }]
    for (const peerId of call.peers) {
      if (peerId === user.id) continue
      list.push({ id: peerId, name: callNameFor(peerId), isSelf: false })
    }
    return list
  }, [call.peers, callNameFor, user.id, user.username])

  const isWaitingForPeers = Boolean(call.callId) && participants.length <= 1

  return (
    <main className="flex h-screen flex-col bg-[#0A0A0F] text-[#F5F0E8]">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-[#2A2A3A] bg-[#0A0A0F]/95 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1D9E75] shadow-[0_0_12px_rgba(29,158,117,0.9)]" />
            <span className="text-sm font-semibold text-[#F5F0E8]">
              {callLabel}
            </span>
          </div>
          <span className="text-xs text-[#4A4860]">
            {isWaitingForPeers
              ? 'Waiting for others to join'
              : `${participants.length} in call`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.opener?.focus()}
            className="rounded-md border border-[#2A2A3A] bg-[#111118] px-3 py-1.5 text-xs font-medium text-[#F5F0E8] hover:bg-[#1C1C28]"
          >
            Back to channel
          </button>
          <Button
            type="button"
            onClick={() => call.leave()}
            className="bg-[#E05555] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#E05555]/80"
          >
            Leave
          </Button>
        </div>
      </header>

      {call.mediaError && (
        <p className="mx-4 mt-3 text-xs text-[#E05555]">{call.mediaError}</p>
      )}

      {/* Participants */}
      <div className="border-b border-[#2A2A3A] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {participants.map((person) => (
            <div
              key={person.id}
              className="flex items-center gap-2 rounded-full border border-[#2A2A3A] bg-[#111118] px-2.5 py-1 text-[11px] text-[#E0DDD7]"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8A838]/15 text-[9px] font-medium text-[#E8A838]">
                {person.name?.slice(0, 1).toUpperCase() || 'U'}
              </span>
              <span>
                {person.isSelf ? `${person.name} (you)` : person.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Video grid */}
      <div className="flex flex-1 flex-col px-4 py-4">
        <div className="flex flex-1 items-center justify-center">
          <div
            className={cn(
              'grid w-full max-w-6xl gap-4',
              participants.length <= 1 && 'grid-cols-1',
              participants.length === 2 && 'md:grid-cols-2',
              participants.length >= 3 && 'md:grid-cols-2 xl:grid-cols-3',
            )}
          >
            {isWaitingForPeers && (
              <div className="col-span-full flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-[#2A2A3A] bg-[#111118]/70 text-center">
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-[#F5F0E8]">
                    <UserRound className="h-4 w-4 text-[#E8A838]" />
                    <span className="text-sm font-medium">
                      Waiting for others to join
                    </span>
                  </div>
                  <p className="text-xs text-[#7A7890]">
                    Keep this window open for your teammates.
                  </p>
                </div>
              </div>
            )}

            <VideoTile
              stream={call.local}
              label={user.username || 'You'}
              muted
            />
            {Object.entries(call.remotes).map(([peerId, stream]) => (
              <VideoTile
                key={peerId}
                stream={stream}
                label={callNameFor(peerId)}
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex items-center justify-center gap-3 pb-2">
          <Button
            type="button"
            onClick={() => call.toggleMute()}
            variant="ghost"
            className={cn(
              'h-12 w-12 rounded-full p-0 transition-all duration-200',
              micOn
                ? 'bg-[#2A2A3A] text-[#F5F0E8] hover:bg-[#3A3A4A]'
                : 'bg-[#E05555]/20 text-[#E05555] hover:bg-[#E05555]/30',
            )}
          >
            {micOn ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </Button>

          <Button
            type="button"
            onClick={() => call.toggleCamera()}
            variant="ghost"
            className={cn(
              'h-12 w-12 rounded-full p-0 transition-all duration-200',
              camOn
                ? 'bg-[#2A2A3A] text-[#F5F0E8] hover:bg-[#3A3A4A]'
                : 'bg-[#2A2A3A] text-[#7A7890] hover:text-[#F5F0E8]',
            )}
          >
            {camOn ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="h-12 w-12 rounded-full bg-[#2A2A3A] p-0 text-[#7A7890] hover:text-[#F5F0E8]"
          >
            <Monitor className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2 rounded-full border border-[#2A2A3A] bg-[#111118] px-3 py-1.5 text-[10px] text-[#7A7890]">
            <Users className="h-3.5 w-3.5" />
            <span>{participants.length} live</span>
          </div>

          <Button
            type="button"
            onClick={() => call.leave()}
            className="h-12 w-14 rounded-full bg-[#E05555] p-0 text-white hover:bg-[#E05555]/80"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </main>
  )
}
