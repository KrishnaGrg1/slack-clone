import {
  createFileRoute,
  getRouteApi,
  useNavigate,
} from '@tanstack/react-router'
import {
  Maximize2,
  Mic,
  MicOff,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  Users,
  Video,
  VideoOff,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { Button } from '#/components/ui/button'
import { useCall } from '#/hooks/use-call'
import { useChannelSocket } from '#/hooks/use-socket'

import { cn } from '#/lib/utils'
import { parentRoute } from '#/routes/workspace/route'
import type { CallSignalEvent } from '#/lib/types/socket.types'
import { getInitials } from '#/lib/initials'

export const Route = createFileRoute('/workspace/$slug/channel/$id/huddle')({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s.mode === 'join' ? ('join' as const) : ('start' as const),
    callId: typeof s.callId === 'string' ? s.callId : undefined,
  }),
  component: RouteComponent,
})

const routeApi = getRouteApi('/workspace/$slug')

type Participant = {
  id: string
  name: string
  isSelf: boolean
  stream: MediaStream | null
  muted: boolean
  videoOn: boolean
}

function hasVisibleVideo(stream: MediaStream | null) {
  if (!stream) return false
  return stream.getVideoTracks().some((track) => track.readyState === 'live')
}

// ─────────────────────────────────────────────────────────────────────────────
// Small shared pieces (same look everywhere on this page)
// ─────────────────────────────────────────────────────────────────────────────

function Banner({
  tone,
  children,
}: {
  tone: 'info' | 'error'
  children: ReactNode
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'shrink-0 border-b px-3 py-2.5 text-xs text-foreground sm:px-4',
        tone === 'error'
          ? 'border-destructive/30 bg-destructive/10'
          : 'border-primary/30 bg-primary/10',
      )}
    >
      {children}
    </div>
  )
}

function ControlButton({
  label,
  tone = 'neutral',
  onClick,
  children,
}: {
  label: string
  tone?: 'neutral' | 'danger' | 'accent'
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'size-11 rounded-full transition-colors',
        tone === 'neutral' &&
          'bg-secondary text-secondary-foreground hover:bg-accent',
        tone === 'danger' &&
          'bg-destructive/15 text-destructive hover:bg-destructive/25',
        tone === 'accent' &&
          'bg-primary text-primary-foreground hover:bg-primary/90',
      )}
    >
      {children}
    </Button>
  )
}

/**
 * featured  → the stage tile; fills the stage area at every screen size
 * !featured → a small thumbnail in the strip (phones/tablets),
 *             a larger tile in the right rail from `lg` up
 */
function ParticipantTile({
  participant,
  featured,
  canFullscreen,
  onSelect,
  onFullscreen,
}: {
  participant: Participant
  featured?: boolean
  canFullscreen: boolean
  onSelect: () => void
  onFullscreen: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const videoOn = participant.videoOn && hasVisibleVideo(participant.stream)
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = participant.stream
  }, [participant.stream, videoOn])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onSelect()
      }
    },
    [onSelect],
  )

  const label = `${participant.name}${participant.isSelf ? ' (you)' : ''}`

  return (
    <div
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card outline-none transition-colors',
        'hover:border-muted-foreground/40 focus-visible:ring-2 focus-visible:ring-ring',
        featured ? 'h-full min-h-48' : 'aspect-video cursor-pointer',
      )}
    >
      {videoOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isSelf}
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center bg-muted">
          <div
            className={cn(
              'flex items-center justify-center rounded-xl bg-primary/15 font-semibold text-primary',
              featured
                ? 'size-16 text-xl sm:size-24 sm:text-3xl'
                : 'size-10 text-sm lg:size-14 lg:text-lg',
            )}
          >
            {getInitials(participant.name)}
          </div>
        </div>
      )}

      {/* fullscreen: always visible on touch, hover/focus-reveal on desktop.
          Thumbnails on small screens skip it: tap a thumbnail to bring it on stage. */}
      {canFullscreen && (
        <button
          type="button"
          title="Fullscreen"
          aria-label="Fullscreen"
          onClick={(event) => {
            event.stopPropagation()
            onFullscreen()
          }}
          className={cn(
            'absolute right-2 top-2 flex size-8 items-center justify-center rounded-md bg-black/60 text-white transition-opacity hover:bg-black/80',
            'lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100',
            !featured && 'max-lg:hidden',
          )}
        >
          <Maximize2 className="size-4" />
        </button>
      )}

      {/* name label */}
      <div className="absolute bottom-2 left-2 right-2 flex">
        <span className="flex max-w-full items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
          {participant.muted && (
            <MicOff className="size-3 shrink-0 text-destructive" />
          )}
          <span className="truncate">{label}</span>
        </span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function RouteComponent() {
  const { id, slug } = Route.useParams()
  const { mode, callId: joinCallId } = Route.useSearch()
  const navigate = useNavigate()
  const { workspace } = routeApi.useLoaderData()
  const { user } = parentRoute.useLoaderData()
  const workspaceId = workspace.data.workspace.id

  // Capability checks run after mount to avoid SSR mismatches.
  // iPhone Safari can't fullscreen a <div>; most mobile browsers lack getDisplayMedia.
  const [canFullscreen, setCanFullscreen] = useState(false)
  const [canScreenShare, setCanScreenShare] = useState(false)
  useEffect(() => {
    setCanFullscreen(Boolean(document.fullscreenEnabled))
    setCanScreenShare(Boolean(navigator.mediaDevices?.getDisplayMedia))
  }, [])

  // ── socket + call ───────────────────────────────────────────────────────────
  const signalRef = useRef<((msg: CallSignalEvent) => void) | null>(null)

  const { send } = useChannelSocket(id, workspaceId, {
    onTyping: () => {},
    onTypingStop: () => {},
    onSignal: (msg) => signalRef.current?.(msg),
  })

  const call = useCall({
    channelId: id,
    userId: user.id,
    send,
  })
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

  const participants = useMemo(() => {
    const list: Participant[] = [
      {
        id: user.id,
        name: user.username || 'You',
        isSelf: true,
        stream: call.local,
        muted: call.muted,
        videoOn: !call.cameraOff,
      },
    ]

    for (const peerId of call.peers) {
      if (peerId === user.id) continue
      list.push({
        id: peerId,
        name: callNameFor(peerId),
        isSelf: false,
        stream: call.remotes[peerId] ?? null,
        muted: false,
        videoOn: hasVisibleVideo(call.remotes[peerId] ?? null),
      })
    }

    return list
  }, [
    call.cameraOff,
    call.local,
    call.muted,
    call.peers,
    call.remotes,
    callNameFor,
    user.id,
    user.username,
  ])

  // ── who is on the stage ─────────────────────────────────────────────────────
  const [focusedParticipantId, setFocusedParticipantId] = useState<
    string | null
  >(null)

  useEffect(() => {
    const stillAvailable = focusedParticipantId
      ? participants.some((p) => p.id === focusedParticipantId)
      : false
    if (stillAvailable) return

    const preferred = participants.find((p) => !p.isSelf) ?? participants[0]
    setFocusedParticipantId(preferred?.id ?? null)
  }, [focusedParticipantId, participants])

  const focusedParticipant =
    participants.find((p) => p.id === focusedParticipantId) ??
    participants[0] ??
    null

  const secondaryParticipants = participants.filter(
    (p) => p.id !== focusedParticipant?.id,
  )

  const fullscreenRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const requestFullscreenFor = useCallback((participantId: string) => {
    void fullscreenRefs.current[participantId]?.requestFullscreen?.()
  }, [])

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

  // ── 2) when the call ends, close this window ───────────────────────────────
  // wait for call.finished: it turns true only AFTER the recording upload ends
  useEffect(() => {
    if (!call.finished) return

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
  }, [call.finished, id, navigate, slug])

  // ── view data ───────────────────────────────────────────────────────────────
  const micOn = !call.muted
  const camOn = !call.cameraOff

  const callLabel = call.callId
    ? `Huddle · ${call.callId.slice(0, 6)}`
    : 'Starting huddle…'

  const isWaitingForPeers = Boolean(call.callId) && participants.length <= 1

  return (
    // h-dvh (not h-screen) so mobile browser toolbars don't hide the controls
    <main className="flex h-dvh min-w-0 flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="size-2 shrink-0 rounded-full bg-success" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              {callLabel}
            </p>
            <p className="truncate text-xs leading-tight text-muted-foreground">
              {isWaitingForPeers
                ? 'Waiting for others to join'
                : `${participants.length} people`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
            <Users className="size-3.5 text-muted-foreground" />
            {participants.length}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => window.opener?.focus()}
            className="hidden sm:inline-flex"
          >
            Back to channel
          </Button>
          {/* phones use the red hang-up button in the control bar instead */}
          <Button
            type="button"
            size="sm"
            onClick={() => call.leave()}
            className="hidden bg-destructive text-white hover:bg-destructive/90 sm:inline-flex"
          >
            Leave
          </Button>
        </div>
      </header>

      {call.saving && (
        <Banner tone="info">
          Saving the call recording… keep this window open.
        </Banner>
      )}

      {call.uploadError && (
        <Banner tone="error">
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>Could not save the recording: {call.uploadError}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => void call.retryUpload()}
              >
                Retry upload
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => window.close()}
              >
                Close anyway
              </Button>
            </div>
          </div>
        </Banner>
      )}

      {call.mediaError && (
        <Banner tone="error">
          <p className="font-medium">Camera or microphone issue</p>
          <p className="text-muted-foreground">{call.mediaError}</p>
        </Banner>
      )}

      {call.summary && (
        <div className="max-h-40 shrink-0 overflow-y-auto border-b border-primary/30 bg-primary/10 px-3 py-2.5 text-xs sm:px-4">
          <p className="font-medium">Call summary ready</p>
          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
            {call.summary}
          </p>
        </div>
      )}

      {/*
        One grid, two layouts (DOM order: stage, participants, controls)
          phones : stage / thumbnail strip / controls  (single column)
          lg+    : stage + controls on the left, participants rail on the right
      */}
      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_auto_auto] lg:grid-cols-[minmax(0,1fr)_18rem] lg:grid-rows-[minmax(0,1fr)_auto]">
        {/* stage */}
        <section className="min-h-0 p-2 sm:p-4 lg:col-start-1 lg:row-start-1">
          {focusedParticipant && (
            <div
              ref={(element) => {
                fullscreenRefs.current[focusedParticipant.id] = element
              }}
              className="h-full"
            >
              <ParticipantTile
                participant={focusedParticipant}
                featured
                canFullscreen={canFullscreen}
                onSelect={() => {}}
                onFullscreen={() => requestFullscreenFor(focusedParticipant.id)}
              />
            </div>
          )}
        </section>

        {/* participants: thumbnail strip on phones, rail on lg+ */}
        <aside
          className={cn(
            'min-h-0 border-t px-2 py-2 sm:px-4',
            'lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:overflow-y-auto lg:border-l lg:border-t-0 lg:p-3',
            // alone on a phone: nothing to show in the strip
            secondaryParticipants.length === 0 && 'max-lg:hidden',
          )}
        >
          <div className="mb-3 hidden items-center justify-between lg:flex">
            <p className="text-xs font-medium text-muted-foreground">
              Participants
            </p>
            <span className="text-xs tabular-nums text-muted-foreground">
              {participants.length}
            </span>
          </div>

          {isWaitingForPeers && (
            <p className="mb-3 hidden rounded-lg border border-dashed p-3 text-xs text-muted-foreground lg:block">
              You're the only one here. When someone joins, select their tile to
              bring them on stage.
            </p>
          )}

          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-3 lg:overflow-visible">
            {secondaryParticipants.map((participant) => (
              <div
                key={participant.id}
                ref={(element) => {
                  fullscreenRefs.current[participant.id] = element
                }}
                className="w-32 shrink-0 sm:w-40 lg:w-full"
              >
                <ParticipantTile
                  participant={participant}
                  canFullscreen={canFullscreen}
                  onSelect={() => setFocusedParticipantId(participant.id)}
                  onFullscreen={() => requestFullscreenFor(participant.id)}
                />
              </div>
            ))}
          </div>
        </aside>

        {/* controls */}
        <div className="flex items-center justify-center gap-2 border-t px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:gap-3 lg:col-start-1 lg:row-start-2">
          <ControlButton
            label={micOn ? 'Mute microphone' : 'Unmute microphone'}
            tone={micOn ? 'neutral' : 'danger'}
            onClick={() => call.toggleMute()}
          >
            {micOn ? <Mic className="size-5" /> : <MicOff className="size-5" />}
          </ControlButton>

          <ControlButton
            label={camOn ? 'Turn camera off' : 'Turn camera on'}
            tone={camOn ? 'neutral' : 'danger'}
            onClick={() => call.toggleCamera()}
          >
            {camOn ? (
              <Video className="size-5" />
            ) : (
              <VideoOff className="size-5" />
            )}
          </ControlButton>

          {canScreenShare && (
            <ControlButton
              label={call.sharing ? 'Stop sharing screen' : 'Share screen'}
              tone={call.sharing ? 'accent' : 'neutral'}
              onClick={() =>
                call.sharing ? call.stopScreenShare() : call.startScreenShare()
              }
            >
              {call.sharing ? (
                <ScreenShareOff className="size-5" />
              ) : (
                <ScreenShare className="size-5" />
              )}
            </ControlButton>
          )}

          <Button
            type="button"
            title="Leave huddle"
            aria-label="Leave huddle"
            onClick={() => call.leave()}
            className="h-11 gap-2 rounded-full bg-destructive px-5 text-white hover:bg-destructive/90"
          >
            <PhoneOff className="size-5" />
            <span className="hidden sm:inline">Leave</span>
          </Button>
        </div>
      </div>
    </main>
  )
}
