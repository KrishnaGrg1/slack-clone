// // frontend/src/routes/workspace/$slug/channel/$id/huddle.tsx
// //
// // The call popup. It OWNS the call: its own WebSocket, camera/mic, peer connections.
// // Opened from the channel page with:
// //   ?mode=start                 -> start a new call (or join if one already exists)
// //   ?mode=join&callId=<id>      -> join that call

// import {
//   createFileRoute,
//   getRouteApi,
//   useNavigate,
// } from '@tanstack/react-router'
// import {
//   Mic,
//   MicOff,
//   PhoneOff,
//   Pin,
//   PinOff,
//   Maximize2,
//   UserRound,
//   Users,
//   Video,
//   VideoOff,
//   ScreenShareOff,
//   ScreenShare,
// } from 'lucide-react'
// import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// import { Button } from '#/components/ui/button'
// import { useCall } from '#/hooks/use-call'
// import { useChannelSocket } from '#/hooks/use-socket'
// import { parentRoute } from '#/routes/workspace/route'
// import type { CallSignalEvent } from '#/lib/types/socket.types'
// import { cn } from '#/lib/utils'

// export const Route = createFileRoute('/workspace/$slug/channel/$id/huddle')({
//   validateSearch: (s: Record<string, unknown>) => ({
//     mode: s.mode === 'join' ? ('join' as const) : ('start' as const),
//     callId: typeof s.callId === 'string' ? s.callId : undefined,
//   }),
//   component: RouteComponent,
// })

// const routeApi = getRouteApi('/workspace/$slug')

// type Participant = {
//   id: string
//   name: string
//   isSelf: boolean
//   stream: MediaStream | null
//   muted: boolean
//   videoOn: boolean
// }

// function getInitials(name: string) {
//   const parts = name.trim().split(/\s+/).filter(Boolean)
//   if (parts.length === 0) return 'U'
//   if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
//   return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
// }

// function hasVisibleVideo(stream: MediaStream | null) {
//   if (!stream) return false
//   return stream.getVideoTracks().some((track) => track.readyState === 'live')
// }

// function ParticipantTile({
//   participant,
//   active,
//   featured,
//   onSelect,
//   onPin,
//   onFullscreen,
// }: {
//   participant: Participant
//   active: boolean
//   featured?: boolean
//   onSelect: () => void
//   onPin: () => void
//   onFullscreen: () => void
// }) {
//   const videoRef = useRef<HTMLVideoElement>(null)

//   const videoOn = participant.videoOn && hasVisibleVideo(participant.stream)
//   useEffect(() => {
//     if (videoRef.current) videoRef.current.srcObject = participant.stream
//   }, [participant.stream, videoOn])

//   const handleKeyDown = useCallback(
//     (event: React.KeyboardEvent<HTMLDivElement>) => {
//       if (event.key === 'Enter' || event.key === ' ') {
//         event.preventDefault()
//         onSelect()
//       }
//     },
//     [onSelect],
//   )

//   return (
//     <div
//       tabIndex={0}
//       onClick={onSelect}
//       onKeyDown={handleKeyDown}
//       className={cn(
//         'group relative overflow-hidden rounded-3xl border transition-all duration-200',
//         featured ? 'min-h-105' : 'min-h-40',
//         active
//           ? 'border-[#E8A838]/50 ring-1 ring-[#E8A838]/30'
//           : 'border-[#242431] bg-[#111118]/80 hover:border-[#3A3A4A]',
//       )}
//     >
//       <div
//         className={cn(
//           'relative h-full min-h-inherit',
//           featured ? 'aspect-16/10' : 'aspect-video',
//         )}
//       >
//         {videoOn ? (
//           <video
//             ref={videoRef}
//             autoPlay
//             playsInline
//             muted={participant.isSelf}
//             className="h-full w-full object-cover"
//           />
//         ) : (
//           <div className="flex h-full min-h-[inherit] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(232,168,56,0.14),transparent_48%),linear-gradient(180deg,rgba(17,17,24,0.98),rgba(10,10,15,0.95))]">
//             <div className="flex flex-col items-center gap-4 text-center">
//               <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-[#2A2A3A] bg-[#0A0A0F] text-2xl font-semibold text-[#F5F0E8] shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
//                 {getInitials(participant.name)}
//               </div>
//               <div className="space-y-1">
//                 <p className="text-sm font-semibold text-[#F5F0E8]">
//                   {participant.name}
//                   {participant.isSelf ? ' (you)' : ''}
//                 </p>
//                 <p className="text-xs text-[#7A7890]">
//                   {participant.isSelf
//                     ? 'Camera off or waiting for preview'
//                     : 'Video unavailable, showing avatar'}
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}

//         <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,15,0)_35%,rgba(10,10,15,0.65)_100%)]" />

//         <div className="absolute left-3 top-3 flex items-center gap-2">
//           <span className="rounded-full border border-[#2A2A3A] bg-[#0A0A0F]/75 px-2.5 py-1 text-[10px] font-medium text-[#F5F0E8] backdrop-blur">
//             {participant.isSelf ? 'You' : 'Guest'}
//           </span>
//           {active && (
//             <span className="rounded-full border border-[#E8A838]/25 bg-[#E8A838]/12 px-2.5 py-1 text-[10px] font-semibold text-[#E8A838] backdrop-blur">
//               Pinned
//             </span>
//           )}
//         </div>

//         <div className="absolute right-3 top-3 flex items-center gap-2 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
//           {/* video pin */}
//           <button
//             type="button"
//             onClick={(event) => {
//               event.stopPropagation()
//               onPin()
//             }}
//             className={cn(
//               'rounded-full border px-2.5 py-1.5 text-[11px] font-medium backdrop-blur transition-colors',
//               active
//                 ? 'border-[#E8A838]/30 bg-[#E8A838]/15 text-[#E8A838]'
//                 : 'border-[#2A2A3A] bg-[#0A0A0F]/70 text-[#F5F0E8] hover:bg-[#16161F]',
//             )}
//           >
//             {active ? (
//               <span className="flex items-center gap-1">
//                 <PinOff className="h-3.5 w-3.5" />
//                 Focused
//               </span>
//             ) : (
//               <span className="flex items-center gap-1">
//                 <Pin className="h-3.5 w-3.5" />
//                 Pin
//               </span>
//             )}
//           </button>
//           {/* full screen */}
//           <button
//             type="button"
//             onClick={(event) => {
//               event.stopPropagation()
//               onFullscreen()
//             }}
//             className="rounded-full border border-[#2A2A3A] bg-[#0A0A0F]/70 px-2.5 py-1.5 text-[11px] font-medium text-[#F5F0E8] backdrop-blur transition-colors hover:bg-[#16161F]"
//           >
//             <span className="flex items-center gap-1">
//               <Maximize2 className="h-3.5 w-3.5" />
//               Fullscreen
//             </span>
//           </button>
//         </div>

//         <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
//           <div className="min-w-0 rounded-2xl border border-[#2A2A3A] bg-[#0A0A0F]/75 px-3 py-2 backdrop-blur">
//             <p className="truncate text-sm font-semibold text-[#F5F0E8]">
//               {participant.name}
//               {participant.isSelf ? ' (you)' : ''}
//             </p>
//             <div className="mt-1 flex items-center gap-2 text-[11px] text-[#C8C4BE]">
//               <span className="flex items-center gap-1.5">
//                 {participant.muted ? (
//                   <MicOff className="h-3.5 w-3.5 text-[#E05555]" />
//                 ) : (
//                   <Mic className="h-3.5 w-3.5 text-[#1D9E75]" />
//                 )}
//                 <span>{participant.muted ? 'Muted' : 'Audio on'}</span>
//               </span>
//               <span className="h-1 w-1 rounded-full bg-[#4A4860]" />
//               <span className="flex items-center gap-1.5">
//                 {videoOn ? (
//                   <Video className="h-3.5 w-3.5 text-[#1D9E75]" />
//                 ) : (
//                   <VideoOff className="h-3.5 w-3.5 text-[#7A7890]" />
//                 )}
//                 <span>{videoOn ? 'Video on' : 'Video off'}</span>
//               </span>
//             </div>
//           </div>

//           {participant.isSelf && (
//             <div className="rounded-2xl border border-[#E8A838]/25 bg-[#E8A838]/12 px-3 py-2 text-right text-[11px] font-medium text-[#E8A838] backdrop-blur">
//               <p>Local preview</p>
//               <p className="text-[#E8A838]/80">
//                 Keep this visible to confirm your feed
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }

// function RouteComponent() {
//   const { id, slug } = Route.useParams()
//   const { mode, callId: joinCallId } = Route.useSearch()
//   const navigate = useNavigate()
//   const { workspace } = routeApi.useLoaderData()
//   const { user } = parentRoute.useLoaderData()
//   const workspaceId = workspace.data.workspace.id

//   // ── socket + call ───────────────────────────────────────────────────────────
//   const signalRef = useRef<((msg: CallSignalEvent) => void) | null>(null)

//   const { send } = useChannelSocket(id, workspaceId, {
//     onTyping: () => {},
//     onTypingStop: () => {},
//     onSignal: (msg) => signalRef.current?.(msg),
//   })

//   const call = useCall({
//     channelId: id,
//     userId: user.id,
//     send,
//   })
//   signalRef.current = call.handleSignal

//   // ── names ───────────────────────────────────────────────────────────────────
//   const memberNameMap = useMemo(
//     () =>
//       Object.fromEntries(
//         (workspace.data.members ?? []).map((m) => [m.id, m.username]),
//       ),
//     [workspace.data.members],
//   )

//   const callNameFor = useCallback(
//     (userId: string) => memberNameMap[userId] ?? userId.slice(0, 6),
//     [memberNameMap],
//   )

//   const participants = useMemo(() => {
//     const list: Participant[] = [
//       {
//         id: user.id,
//         name: user.username || 'You',
//         isSelf: true,
//         stream: call.local,
//         muted: call.muted,
//         videoOn: !call.cameraOff,
//       },
//     ]

//     for (const peerId of call.peers) {
//       if (peerId === user.id) continue
//       list.push({
//         id: peerId,
//         name: callNameFor(peerId),
//         isSelf: false,
//         stream: call.remotes[peerId] ?? null,
//         muted: false,
//         videoOn: hasVisibleVideo(call.remotes[peerId] ?? null),
//       })
//     }

//     return list
//   }, [
//     call.cameraOff,
//     call.local,
//     call.muted,
//     call.peers,
//     call.remotes,
//     callNameFor,
//     user.id,
//     user.username,
//   ])

//   const [focusedParticipantId, setFocusedParticipantId] = useState<
//     string | null
//   >(null)

//   useEffect(() => {
//     const stillAvailable = focusedParticipantId
//       ? participants.some(
//           (participant) => participant.id === focusedParticipantId,
//         )
//       : false

//     if (stillAvailable) return

//     const preferredParticipant =
//       participants.find((participant) => !participant.isSelf) ??
//       participants[0] ??
//       null

//     setFocusedParticipantId(preferredParticipant?.id ?? null)
//   }, [focusedParticipantId, participants])

//   const focusedParticipant =
//     participants.find(
//       (participant) => participant.id === focusedParticipantId,
//     ) ??
//     participants[0] ??
//     null

//   const secondaryParticipants = participants.filter(
//     (participant) => participant.id !== focusedParticipant?.id,
//   )

//   const focusParticipant = useCallback((participantId: string) => {
//     setFocusedParticipantId(participantId)
//   }, [])

//   const fullscreenRefs = useRef<Record<string, HTMLDivElement | null>>({})

//   const requestFullscreenFor = useCallback((participantId: string) => {
//     const element = fullscreenRefs.current[participantId]
//     void element?.requestFullscreen?.()
//   }, [])

//   // ── 1) start or join automatically, once ───────────────────────────────────
//   // TEMPORARY: the 700ms wait gives the WebSocket time to open.
//   // Replace with a real "socket is open" signal once ChatSocket exposes one.
//   const startedRef = useRef(false)
//   useEffect(() => {
//     const t = setTimeout(() => {
//       if (startedRef.current) return
//       startedRef.current = true
//       if (mode === 'join' && joinCallId) void call.join(joinCallId)
//       else void call.start()
//     }, 700)
//     return () => clearTimeout(t)
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

//   // ── 2) when the call ends (leave, or everyone left), close this window ──────
//   const wasInCall = useRef(false)
//   useEffect(() => {
//     if (call.callId) {
//       wasInCall.current = true
//       return
//     }
//     if (!wasInCall.current) return

//     window.close()
//     // fallback if the browser refuses to close it (e.g. opened by typing the URL)
//     setTimeout(
//       () =>
//         navigate({
//           to: '/workspace/$slug/channel/$id',
//           params: { slug, id },
//           replace: true,
//         }),
//       300,
//     )
//   }, [call.callId, id, navigate, slug])

//   // ── view data ───────────────────────────────────────────────────────────────
//   const micOn = !call.muted
//   const camOn = !call.cameraOff

//   const callLabel = call.callId
//     ? `Call · ${call.callId.slice(0, 6)}`
//     : 'Starting call...'

//   const isWaitingForPeers = Boolean(call.callId) && participants.length <= 1

//   return (
//     <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[#0A0A0F] text-[#F5F0E8]">
//       <header className="flex shrink-0 items-center justify-between border-b border-[#232330] bg-[#09090D]/90 px-5 py-3 backdrop-blur-xl">
//         <div className="flex min-w-0 items-center gap-3">
//           <div className="flex items-center gap-2">
//             <span className="h-2.5 w-2.5 rounded-full bg-[#1D9E75] shadow-[0_0_14px_rgba(29,158,117,0.85)]" />
//             <div className="min-w-0">
//               <p className="truncate text-sm font-semibold text-[#F5F0E8]">
//                 {callLabel}
//               </p>
//               <p className="text-[11px] text-[#7A7890]">
//                 {isWaitingForPeers
//                   ? 'Waiting for others to join'
//                   : `${participants.length} people in the huddle`}
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           <div className="hidden items-center gap-2 rounded-full border border-[#2A2A3A] bg-[#111118]/80 px-3 py-1.5 text-[11px] text-[#C8C4BE] md:flex">
//             <Users className="h-3.5 w-3.5 text-[#7A7890]" />
//             <span>{participants.length} live</span>
//           </div>
//           <button
//             type="button"
//             onClick={() => window.opener?.focus()}
//             className="rounded-full border border-[#2A2A3A] bg-[#111118] px-3 py-1.5 text-xs font-medium text-[#F5F0E8] transition-colors hover:bg-[#1C1C28]"
//           >
//             Back to channel
//           </button>
//           <Button
//             type="button"
//             onClick={() => call.leave()}
//             className="rounded-full bg-[#E05555] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#E05555]/80"
//           >
//             Leave
//           </Button>
//         </div>
//       </header>

//       {call.mediaError && (
//         <div className="border-b border-[#40242A] bg-[#E05555]/10 px-5 py-3 text-xs text-[#FFB2B2]">
//           <p className="font-medium text-[#FFCDCD]">
//             Camera or microphone issue
//           </p>
//           <p>{call.mediaError}</p>
//         </div>
//       )}

//       {call.summary && (
//         <div className="border-b border-[#2F2A16] bg-[#E8A838]/10 px-5 py-3 text-xs text-[#F4D58B]">
//           <p className="font-medium text-[#F8E7B5]">Call summary ready</p>
//           <p className="mt-1 whitespace-pre-wrap text-[#F4D58B]/90">
//             {call.summary}
//           </p>
//         </div>
//       )}

//       <div className="flex-1 overflow-hidden px-4 py-4 lg:px-5">
//         <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_336px]">
//           <section className="flex min-h-0 flex-col gap-4">
//             <div className="flex items-center justify-between rounded-3xl border border-[#232330] bg-[#111118]/85 px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur">
//               <div className="min-w-0">
//                 <p className="text-xs uppercase tracking-[0.22em] text-[#7A7890]">
//                   Stage
//                 </p>
//                 <p className="truncate text-sm font-semibold text-[#F5F0E8]">
//                   {focusedParticipant
//                     ? `${focusedParticipant.name}${focusedParticipant.isSelf ? ' (you)' : ''}`
//                     : 'No participant selected'}
//                 </p>
//               </div>
//               <div className="flex items-center gap-2">
//                 {focusedParticipant && (
//                   <span className="rounded-full border border-[#2A2A3A] bg-[#09090D] px-3 py-1 text-[11px] text-[#C8C4BE]">
//                     {focusedParticipant.videoOn ? 'Video on' : 'Avatar mode'}
//                   </span>
//                 )}
//                 <span className="rounded-full border border-[#2A2A3A] bg-[#09090D] px-3 py-1 text-[11px] text-[#C8C4BE]">
//                   Click a tile to pin it
//                 </span>
//               </div>
//             </div>

//             <div className="min-h-0 flex-1">
//               {focusedParticipant ? (
//                 <div
//                   ref={(element) => {
//                     fullscreenRefs.current[focusedParticipant.id] = element
//                   }}
//                   className="h-full"
//                 >
//                   <ParticipantTile
//                     participant={focusedParticipant}
//                     active
//                     featured
//                     onSelect={() => focusParticipant(focusedParticipant.id)}
//                     onPin={() => focusParticipant(focusedParticipant.id)}
//                     onFullscreen={() =>
//                       requestFullscreenFor(focusedParticipant.id)
//                     }
//                   />
//                 </div>
//               ) : (
//                 <div className="flex h-full min-h-80 items-center justify-center rounded-3xl border border-dashed border-[#2A2A3A] bg-[#111118]/70 text-center">
//                   <div className="space-y-2 px-6">
//                     <div className="flex items-center justify-center gap-2 text-[#F5F0E8]">
//                       <UserRound className="h-4 w-4 text-[#E8A838]" />
//                       <span className="text-sm font-medium">
//                         Waiting for others to join
//                       </span>
//                     </div>
//                     <p className="text-xs text-[#7A7890]">
//                       Keep this window open. The first remote participant will
//                       appear here as the main stage.
//                     </p>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <div className="rounded-3xl border border-[#232330] bg-[#111118]/85 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur">
//               <div className="flex flex-wrap items-center justify-center gap-3">
//                 <Button
//                   type="button"
//                   onClick={() => call.toggleMute()}
//                   variant="ghost"
//                   className={cn(
//                     'h-12 w-12 rounded-full p-0 transition-all duration-200',
//                     micOn
//                       ? 'bg-[#2A2A3A] text-[#F5F0E8] hover:bg-[#3A3A4A]'
//                       : 'bg-[#E05555]/20 text-[#E05555] hover:bg-[#E05555]/30',
//                   )}
//                 >
//                   {micOn ? (
//                     <Mic className="h-5 w-5" />
//                   ) : (
//                     <MicOff className="h-5 w-5" />
//                   )}
//                 </Button>

//                 <Button
//                   type="button"
//                   onClick={() => call.toggleCamera()}
//                   variant="ghost"
//                   className={cn(
//                     'h-12 w-12 rounded-full p-0 transition-all duration-200',
//                     camOn
//                       ? 'bg-[#2A2A3A] text-[#F5F0E8] hover:bg-[#3A3A4A]'
//                       : 'bg-[#2A2A3A] text-[#7A7890] hover:text-[#F5F0E8]',
//                   )}
//                 >
//                   {camOn ? (
//                     <Video className="h-5 w-5" />
//                   ) : (
//                     <VideoOff className="h-5 w-5" />
//                   )}
//                 </Button>

//                 <Button
//                   type="button"
//                   onClick={() =>
//                     call.sharing
//                       ? call.stopScreenShare()
//                       : call.startScreenShare()
//                   }
//                   variant="ghost"
//                   className={cn(
//                     'h-12 w-12 rounded-full p-0 transition-all duration-200',
//                     call.sharing
//                       ? 'bg-[#2A2A3A] text-[#F5F0E8] hover:bg-[#3A3A4A]'
//                       : 'bg-[#2A2A3A] text-[#7A7890] hover:text-[#F5F0E8]',
//                   )}
//                 >
//                   {call.sharing ? (
//                     <ScreenShareOff className="h-5 w-5" />
//                   ) : (
//                     <ScreenShare className="h-5 w-5" />
//                   )}
//                 </Button>

//                 <div className="flex items-center gap-2 rounded-full border border-[#2A2A3A] bg-[#0A0A0F] px-4 py-2 text-[11px] text-[#C8C4BE]">
//                   <Users className="h-3.5 w-3.5 text-[#7A7890]" />
//                   <span>{participants.length} live</span>
//                 </div>

//                 <Button
//                   type="button"
//                   onClick={() => call.leave()}
//                   className="h-12 w-14 rounded-full bg-[#E05555] p-0 text-white hover:bg-[#E05555]/80"
//                 >
//                   <PhoneOff className="h-5 w-5" />
//                 </Button>
//               </div>
//             </div>
//           </section>

//           <aside className="flex min-h-0 flex-col gap-3 rounded-3xl border border-[#232330] bg-[#0E0E15]/80 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.2)] backdrop-blur">
//             <div className="flex items-center justify-between px-1 py-1">
//               <div>
//                 <p className="text-xs uppercase tracking-[0.22em] text-[#7A7890]">
//                   Participants
//                 </p>
//                 <p className="text-sm text-[#C8C4BE]">
//                   Pick a tile to pin it to the stage
//                 </p>
//               </div>
//               <span className="rounded-full border border-[#2A2A3A] bg-[#111118] px-3 py-1 text-[11px] text-[#C8C4BE]">
//                 {participants.length}
//               </span>
//             </div>

//             {isWaitingForPeers && (
//               <div className="rounded-2xl border border-dashed border-[#2A2A3A] bg-[#111118]/70 px-4 py-3 text-xs text-[#7A7890]">
//                 You are the only person here right now. When someone joins,
//                 their video will appear in this rail and you can pin them to the
//                 main stage.
//               </div>
//             )}

//             <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
//               {secondaryParticipants.map((participant) => (
//                 <div
//                   key={participant.id}
//                   ref={(element) => {
//                     fullscreenRefs.current[participant.id] = element
//                   }}
//                 >
//                   <ParticipantTile
//                     participant={participant}
//                     active={participant.id === focusedParticipant?.id}
//                     onSelect={() => focusParticipant(participant.id)}
//                     onPin={() => focusParticipant(participant.id)}
//                     onFullscreen={() => requestFullscreenFor(participant.id)}
//                   />
//                 </div>
//               ))}
//             </div>
//           </aside>
//         </div>
//       </div>
//     </main>
//   )
// }
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
  PhoneOff,
  Pin,
  PinOff,
  Maximize2,
  UserRound,
  Users,
  Video,
  VideoOff,
  ScreenShareOff,
  ScreenShare,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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

type Participant = {
  id: string
  name: string
  isSelf: boolean
  stream: MediaStream | null
  muted: boolean
  videoOn: boolean
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function hasVisibleVideo(stream: MediaStream | null) {
  if (!stream) return false
  return stream.getVideoTracks().some((track) => track.readyState === 'live')
}

function ParticipantTile({
  participant,
  active,
  featured,
  onSelect,
  onPin,
  onFullscreen,
}: {
  participant: Participant
  active: boolean
  featured?: boolean
  onSelect: () => void
  onPin: () => void
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

  return (
    <div
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative overflow-hidden rounded-3xl border transition-all duration-200',
        featured ? 'min-h-105' : 'min-h-40',
        active
          ? 'border-[#E8A838]/50 ring-1 ring-[#E8A838]/30'
          : 'border-[#242431] bg-[#111118]/80 hover:border-[#3A3A4A]',
      )}
    >
      <div
        className={cn(
          'relative h-full min-h-inherit',
          featured ? 'aspect-16/10' : 'aspect-video',
        )}
      >
        {videoOn ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={participant.isSelf}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full min-h-[inherit] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(232,168,56,0.14),transparent_48%),linear-gradient(180deg,rgba(17,17,24,0.98),rgba(10,10,15,0.95))]">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-[#2A2A3A] bg-[#0A0A0F] text-2xl font-semibold text-[#F5F0E8] shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
                {getInitials(participant.name)}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#F5F0E8]">
                  {participant.name}
                  {participant.isSelf ? ' (you)' : ''}
                </p>
                <p className="text-xs text-[#7A7890]">
                  {participant.isSelf
                    ? 'Camera off or waiting for preview'
                    : 'Video unavailable, showing avatar'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,15,0)_35%,rgba(10,10,15,0.65)_100%)]" />

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-full border border-[#2A2A3A] bg-[#0A0A0F]/75 px-2.5 py-1 text-[10px] font-medium text-[#F5F0E8] backdrop-blur">
            {participant.isSelf ? 'You' : 'Guest'}
          </span>
          {active && (
            <span className="rounded-full border border-[#E8A838]/25 bg-[#E8A838]/12 px-2.5 py-1 text-[10px] font-semibold text-[#E8A838] backdrop-blur">
              Pinned
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-2 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
          {/* video pin */}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onPin()
            }}
            className={cn(
              'rounded-full border px-2.5 py-1.5 text-[11px] font-medium backdrop-blur transition-colors',
              active
                ? 'border-[#E8A838]/30 bg-[#E8A838]/15 text-[#E8A838]'
                : 'border-[#2A2A3A] bg-[#0A0A0F]/70 text-[#F5F0E8] hover:bg-[#16161F]',
            )}
          >
            {active ? (
              <span className="flex items-center gap-1">
                <PinOff className="h-3.5 w-3.5" />
                Focused
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Pin className="h-3.5 w-3.5" />
                Pin
              </span>
            )}
          </button>
          {/* full screen */}
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onFullscreen()
            }}
            className="rounded-full border border-[#2A2A3A] bg-[#0A0A0F]/70 px-2.5 py-1.5 text-[11px] font-medium text-[#F5F0E8] backdrop-blur transition-colors hover:bg-[#16161F]"
          >
            <span className="flex items-center gap-1">
              <Maximize2 className="h-3.5 w-3.5" />
              Fullscreen
            </span>
          </button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <div className="min-w-0 rounded-2xl border border-[#2A2A3A] bg-[#0A0A0F]/75 px-3 py-2 backdrop-blur">
            <p className="truncate text-sm font-semibold text-[#F5F0E8]">
              {participant.name}
              {participant.isSelf ? ' (you)' : ''}
            </p>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-[#C8C4BE]">
              <span className="flex items-center gap-1.5">
                {participant.muted ? (
                  <MicOff className="h-3.5 w-3.5 text-[#E05555]" />
                ) : (
                  <Mic className="h-3.5 w-3.5 text-[#1D9E75]" />
                )}
                <span>{participant.muted ? 'Muted' : 'Audio on'}</span>
              </span>
              <span className="h-1 w-1 rounded-full bg-[#4A4860]" />
              <span className="flex items-center gap-1.5">
                {videoOn ? (
                  <Video className="h-3.5 w-3.5 text-[#1D9E75]" />
                ) : (
                  <VideoOff className="h-3.5 w-3.5 text-[#7A7890]" />
                )}
                <span>{videoOn ? 'Video on' : 'Video off'}</span>
              </span>
            </div>
          </div>

          {participant.isSelf && (
            <div className="rounded-2xl border border-[#E8A838]/25 bg-[#E8A838]/12 px-3 py-2 text-right text-[11px] font-medium text-[#E8A838] backdrop-blur">
              <p>Local preview</p>
              <p className="text-[#E8A838]/80">
                Keep this visible to confirm your feed
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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

  const [focusedParticipantId, setFocusedParticipantId] = useState<
    string | null
  >(null)

  useEffect(() => {
    const stillAvailable = focusedParticipantId
      ? participants.some(
          (participant) => participant.id === focusedParticipantId,
        )
      : false

    if (stillAvailable) return

    const preferredParticipant =
      participants.find((participant) => !participant.isSelf) ??
      participants[0] ??
      null

    setFocusedParticipantId(preferredParticipant?.id ?? null)
  }, [focusedParticipantId, participants])

  const focusedParticipant =
    participants.find(
      (participant) => participant.id === focusedParticipantId,
    ) ??
    participants[0] ??
    null

  const secondaryParticipants = participants.filter(
    (participant) => participant.id !== focusedParticipant?.id,
  )

  const focusParticipant = useCallback((participantId: string) => {
    setFocusedParticipantId(participantId)
  }, [])

  const fullscreenRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const requestFullscreenFor = useCallback((participantId: string) => {
    const element = fullscreenRefs.current[participantId]
    void element?.requestFullscreen?.()
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

  // ── 2) when the call ends (leave, or everyone left), close this window ──────
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
    ? `Call · ${call.callId.slice(0, 6)}`
    : 'Starting call...'

  const isWaitingForPeers = Boolean(call.callId) && participants.length <= 1

  return (
    <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden bg-[#0A0A0F] text-[#F5F0E8]">
      <header className="flex shrink-0 items-center justify-between border-b border-[#232330] bg-[#09090D]/90 px-5 py-3 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1D9E75] shadow-[0_0_14px_rgba(29,158,117,0.85)]" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#F5F0E8]">
                {callLabel}
              </p>
              <p className="text-[11px] text-[#7A7890]">
                {isWaitingForPeers
                  ? 'Waiting for others to join'
                  : `${participants.length} people in the huddle`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-[#2A2A3A] bg-[#111118]/80 px-3 py-1.5 text-[11px] text-[#C8C4BE] md:flex">
            <Users className="h-3.5 w-3.5 text-[#7A7890]" />
            <span>{participants.length} live</span>
          </div>
          <button
            type="button"
            onClick={() => window.opener?.focus()}
            className="rounded-full border border-[#2A2A3A] bg-[#111118] px-3 py-1.5 text-xs font-medium text-[#F5F0E8] transition-colors hover:bg-[#1C1C28]"
          >
            Back to channel
          </button>
          <Button
            type="button"
            onClick={() => call.leave()}
            className="rounded-full bg-[#E05555] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#E05555]/80"
          >
            Leave
          </Button>
        </div>
      </header>

      {call.saving && (
        <div className="border-b border-[#2F2A16] bg-[#E8A838]/10 px-5 py-3 text-xs text-[#F4D58B]">
          Saving the call recording… keep this window open.
        </div>
      )}

      {call.uploadError && (
        <div className="flex items-center justify-between gap-3 border-b border-[#40242A] bg-[#E05555]/10 px-5 py-3 text-xs text-[#FFB2B2]">
          <p>Could not save the recording: {call.uploadError}</p>
          <div className="flex gap-2">
            <Button type="button" onClick={() => void call.retryUpload()}>
              Retry upload
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => window.close()}
            >
              Close anyway
            </Button>
          </div>
        </div>
      )}

      {call.mediaError && (
        <div className="border-b border-[#40242A] bg-[#E05555]/10 px-5 py-3 text-xs text-[#FFB2B2]">
          <p className="font-medium text-[#FFCDCD]">
            Camera or microphone issue
          </p>
          <p>{call.mediaError}</p>
        </div>
      )}

      {call.summary && (
        <div className="border-b border-[#2F2A16] bg-[#E8A838]/10 px-5 py-3 text-xs text-[#F4D58B]">
          <p className="font-medium text-[#F8E7B5]">Call summary ready</p>
          <p className="mt-1 whitespace-pre-wrap text-[#F4D58B]/90">
            {call.summary}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-hidden px-4 py-4 lg:px-5">
        <div className="grid h-full gap-4 lg:grid-cols-[minmax(0,1fr)_336px]">
          <section className="flex min-h-0 flex-col gap-4">
            <div className="flex items-center justify-between rounded-3xl border border-[#232330] bg-[#111118]/85 px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.22em] text-[#7A7890]">
                  Stage
                </p>
                <p className="truncate text-sm font-semibold text-[#F5F0E8]">
                  {focusedParticipant
                    ? `${focusedParticipant.name}${focusedParticipant.isSelf ? ' (you)' : ''}`
                    : 'No participant selected'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {focusedParticipant && (
                  <span className="rounded-full border border-[#2A2A3A] bg-[#09090D] px-3 py-1 text-[11px] text-[#C8C4BE]">
                    {focusedParticipant.videoOn ? 'Video on' : 'Avatar mode'}
                  </span>
                )}
                <span className="rounded-full border border-[#2A2A3A] bg-[#09090D] px-3 py-1 text-[11px] text-[#C8C4BE]">
                  Click a tile to pin it
                </span>
              </div>
            </div>

            <div className="min-h-0 flex-1">
              {focusedParticipant ? (
                <div
                  ref={(element) => {
                    fullscreenRefs.current[focusedParticipant.id] = element
                  }}
                  className="h-full"
                >
                  <ParticipantTile
                    participant={focusedParticipant}
                    active
                    featured
                    onSelect={() => focusParticipant(focusedParticipant.id)}
                    onPin={() => focusParticipant(focusedParticipant.id)}
                    onFullscreen={() =>
                      requestFullscreenFor(focusedParticipant.id)
                    }
                  />
                </div>
              ) : (
                <div className="flex h-full min-h-80 items-center justify-center rounded-3xl border border-dashed border-[#2A2A3A] bg-[#111118]/70 text-center">
                  <div className="space-y-2 px-6">
                    <div className="flex items-center justify-center gap-2 text-[#F5F0E8]">
                      <UserRound className="h-4 w-4 text-[#E8A838]" />
                      <span className="text-sm font-medium">
                        Waiting for others to join
                      </span>
                    </div>
                    <p className="text-xs text-[#7A7890]">
                      Keep this window open. The first remote participant will
                      appear here as the main stage.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-[#232330] bg-[#111118]/85 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur">
              <div className="flex flex-wrap items-center justify-center gap-3">
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
                  onClick={() =>
                    call.sharing
                      ? call.stopScreenShare()
                      : call.startScreenShare()
                  }
                  variant="ghost"
                  className={cn(
                    'h-12 w-12 rounded-full p-0 transition-all duration-200',
                    call.sharing
                      ? 'bg-[#2A2A3A] text-[#F5F0E8] hover:bg-[#3A3A4A]'
                      : 'bg-[#2A2A3A] text-[#7A7890] hover:text-[#F5F0E8]',
                  )}
                >
                  {call.sharing ? (
                    <ScreenShareOff className="h-5 w-5" />
                  ) : (
                    <ScreenShare className="h-5 w-5" />
                  )}
                </Button>

                <div className="flex items-center gap-2 rounded-full border border-[#2A2A3A] bg-[#0A0A0F] px-4 py-2 text-[11px] text-[#C8C4BE]">
                  <Users className="h-3.5 w-3.5 text-[#7A7890]" />
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
          </section>

          <aside className="flex min-h-0 flex-col gap-3 rounded-3xl border border-[#232330] bg-[#0E0E15]/80 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.2)] backdrop-blur">
            <div className="flex items-center justify-between px-1 py-1">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#7A7890]">
                  Participants
                </p>
                <p className="text-sm text-[#C8C4BE]">
                  Pick a tile to pin it to the stage
                </p>
              </div>
              <span className="rounded-full border border-[#2A2A3A] bg-[#111118] px-3 py-1 text-[11px] text-[#C8C4BE]">
                {participants.length}
              </span>
            </div>

            {isWaitingForPeers && (
              <div className="rounded-2xl border border-dashed border-[#2A2A3A] bg-[#111118]/70 px-4 py-3 text-xs text-[#7A7890]">
                You are the only person here right now. When someone joins,
                their video will appear in this rail and you can pin them to the
                main stage.
              </div>
            )}

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {secondaryParticipants.map((participant) => (
                <div
                  key={participant.id}
                  ref={(element) => {
                    fullscreenRefs.current[participant.id] = element
                  }}
                >
                  <ParticipantTile
                    participant={participant}
                    active={participant.id === focusedParticipant?.id}
                    onSelect={() => focusParticipant(participant.id)}
                    onPin={() => focusParticipant(participant.id)}
                    onFullscreen={() => requestFullscreenFor(participant.id)}
                  />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
