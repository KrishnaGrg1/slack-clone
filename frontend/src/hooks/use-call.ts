import type {
  CallIncomingEvent,
  CallSignalEvent,
  ClientEvent,
} from '#/lib/types/socket.types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PeerManager } from '#/lib/call/peer-manager'

export function useCall({
  channelId,
  userId,
  send,
}: {
  channelId: string
  userId: string
  send: (e: ClientEvent) => void
}) {
  const [incomingCall, setIncomingCall] = useState<CallIncomingEvent | null>(
    null,
  )
  const [callId, setCallId] = useState<string | null>(null)
  const [peers, setPeers] = useState<string[]>([])

  const [local, setLocal] = useState<MediaStream | null>(null)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const localRef = useRef<MediaStream | null>(null)

  const [remotes, setRemotes] = useState<Record<string, MediaStream>>({})
  const pmRef = useRef<PeerManager | null>(null)
  const callIdRef = useRef<string | null>(null)

  // create the PeerManager the first time we need it
  const ensurePM = useCallback(() => {
    if (pmRef.current) return pmRef.current
    if (!localRef.current || !callIdRef.current) return null
    pmRef.current = new PeerManager(
      callIdRef.current,
      localRef.current,
      send,
      (id, stream) => setRemotes((r) => ({ ...r, [id]: stream })),
    )
    return pmRef.current
  }, [send])

  const closePeers = useCallback(() => {
    pmRef.current?.closeAll()
    pmRef.current = null
    callIdRef.current = null
    setRemotes({})
  }, [])

  const handleSignal = useCallback(
    (msg: CallSignalEvent) => {
      switch (msg.msg_type) {
        case 'call.incoming':
          if (msg.user_id === userId) return
          setIncomingCall(msg)
          break

        case 'call.started':
          callIdRef.current = msg.call_id
          setCallId(msg.call_id)
          break

        case 'call.joined': {
          callIdRef.current = msg.call_id
          setCallId(msg.call_id)
          setIncomingCall(null)
          const existing = msg.existing_peers ?? []
          setPeers(existing)
          // I am the newcomer: I send an offer to everyone already here
          const pm = ensurePM()
          existing.forEach((id) => pm?.callPeer(id).catch(console.error))
          break
        }

        case 'call.peer_joined':
          // wait: the newcomer will send me an offer
          setPeers((p) => (p.includes(msg.user_id) ? p : [...p, msg.user_id]))
          break

        case 'call.peer_left':
          pmRef.current?.removePeer(msg.user_id)
          setPeers((p) => p.filter((id) => id !== msg.user_id))
          setRemotes((r) => {
            const { [msg.user_id]: _gone, ...rest } = r
            return rest
          })
          break

        case 'call.ended':
          closePeers()
          setCallId(null)
          setPeers([])
          setIncomingCall(null)
          stopMedia()
          break

        case 'rtc.offer':
          ensurePM()?.onOffer(msg.from_user_id, msg.sdp).catch(console.error)
          break
        case 'rtc.answer':
          pmRef.current
            ?.onAnswer(msg.from_user_id, msg.sdp)
            .catch(console.error)
          break
        case 'rtc.ice':
          ensurePM()
            ?.onIce(msg.from_user_id, msg.candidate)
            .catch(console.error)
          break
      }
    },
    [userId],
  )

  const getMedia = useCallback(async (): Promise<boolean> => {
    setMediaError(null)
    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: true,
        })
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      }
      localRef.current = stream
      setLocal(stream)
      setMuted(false)
      setCameraOff(stream.getVideoTracks().length == 0)
      return true
    } catch (err) {
      console.error('[call] media failed', err)
      setMediaError('Couldnot access microphone. Check browser permission')
      return false
    }
  }, [])

  const stopMedia = useCallback(() => {
    localRef.current?.getTracks().forEach((t) => t.stop())
    localRef.current = null
    setLocal(null)
  }, [])

  // safety net: if the component unmounts mid-call, release the camera
  useEffect(() => stopMedia, [stopMedia])

  const start = useCallback(async () => {
    if (!(await getMedia())) return
    send({ msg_type: 'call.start', channel_id: channelId })
  }, [send, channelId, getMedia])

  const join = useCallback(async () => {
    if (!incomingCall) return
    if (!(await getMedia())) return
    send({
      msg_type: 'call.join',
      channel_id: channelId,
      call_id: incomingCall.call_id,
    })
  }, [send, channelId, incomingCall, getMedia])
  const leave = useCallback(() => {
    if (callId) {
      send({ msg_type: 'call.leave', channel_id: channelId, call_id: callId })
    }
    closePeers()
    setCallId(null)
    setPeers([])
    stopMedia()
  }, [send, channelId, callId, stopMedia, closePeers])

  const dismiss = useCallback(() => {
    setIncomingCall(null)
  }, [])

  const toggleMute = useCallback(() => {
    const next = !muted
    localRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next))
    setMuted(next)
  }, [muted])

  const toggleCamera = useCallback(() => {
    const next = !cameraOff
    localRef.current?.getVideoTracks().forEach((t) => (t.enabled = !next))
    setCameraOff(next)
  }, [cameraOff])
  useEffect(() => () => pmRef.current?.closeAll(), [])
  return {
    handleSignal,
    start,
    join,
    leave,
    dismiss,
    incomingCall,
    callId,
    peers,
    local,
    muted,
    cameraOff,
    mediaError,
    toggleMute,
    toggleCamera,
    remotes,
  }
}
