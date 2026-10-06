// frontend/src/hooks/use-call.ts
//
// Used ONLY by the huddle (popup) route. The channel route no longer runs calls.
// This hook owns: camera/mic, the PeerManager, and all call state.

import { useCallback, useEffect, useRef, useState } from 'react'
import { PeerManager } from '#/lib/call/peer-manager'
import type {
  CallIncomingEvent,
  CallSignalEvent,
  ClientEvent,
} from '#/lib/types/socket.types'
import axiosInstance from '#/lib/axios'
import { getWsToken } from '#/lib/services/ws-token'

export function useCall({
  channelId,
  userId,
  send,
}: {
  channelId: string
  userId: string
  send: (e: ClientEvent) => void
}) {
  // ── state ───────────────────────────────────────────────────────────────────
  const [incomingCall, setIncomingCall] = useState<CallIncomingEvent | null>(
    null,
  )
  const [callId, setCallId] = useState<string | null>(null)
  const [peers, setPeers] = useState<string[]>([])

  const [local, setLocal] = useState<MediaStream | null>(null)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [remotes, setRemotes] = useState<Record<string, MediaStream>>({})
  const [summary, setSummary] = useState<string | null>(null)
  const [recordingFinalized, setRecordingFinalized] = useState(false)

  // share screen
  const screenRef = useRef<MediaStream | null>(null)
  const [sharing, setSharing] = useState(false)

  // refs: values that must be readable inside callbacks without going stale
  const localRef = useRef<MediaStream | null>(null)
  const pmRef = useRef<PeerManager | null>(null)
  const callIdRef = useRef<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingMetaRef = useRef<{
    callId: string
    channelId: string
  } | null>(null)
  const shouldUploadRecordingRef = useRef(false)
  const uploadingRecordingRef = useRef(false)

  const recordingUploadPromiseRef = useRef<Promise<void> | null>(null)
  // ── media ───────────────────────────────────────────────────────────────────
  const stopMedia = useCallback(() => {
    localRef.current?.getTracks().forEach((t) => t.stop())
    localRef.current = null
    setLocal(null)
  }, [])

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
        // no camera, or camera busy: fall back to microphone only
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      }
      localRef.current = stream
      setLocal(stream)
      setMuted(false)
      setCameraOff(stream.getVideoTracks().length === 0)
      return true
    } catch (err) {
      console.error('[call] media failed', err)
      setMediaError('Could not access microphone. Check browser permissions.')
      return false
    }
  }, [])

  // ── peer connections ────────────────────────────────────────────────────────
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

  const uploadRecording = useCallback(async (blob: Blob) => {
    const meta = recordingMetaRef.current
    if (!meta || uploadingRecordingRef.current) return
    console.log('starting upload')
    uploadingRecordingRef.current = true
    try {
      const formData = new FormData()
      formData.append('audio', blob, `${meta.callId}.webm`)
      formData.append('channel_id', meta.channelId)
      const token = await getWsToken()
      const data = await axiosInstance.post(
        `/calls/${meta.callId}/recording`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      console.log('upload finihed', data)
    } catch (error) {
      console.error('[call] recording upload failed', error)
    } finally {
      uploadingRecordingRef.current = false
      recordingMetaRef.current = null
    }
  }, [])

  const startRecording = useCallback(
    (callId: string) => {
      console.log('[recording] startRecording called', callId)

      if (!shouldUploadRecordingRef.current) {
        console.log('[recording] upload disabled')
        return
      }

      setRecordingFinalized(false)

      if (recorderRef.current || !localRef.current) {
        console.log('[recording] recorder/local stream missing')
        return
      }

      const audioTracks = localRef.current.getAudioTracks()

      console.log('[recording] audio tracks:', audioTracks.length)

      if (audioTracks.length === 0) {
        console.log('[recording] NO AUDIO TRACK')
        return
      }

      const audioStream = new MediaStream(audioTracks)
      const recorder = new MediaRecorder(audioStream)

      recordingChunksRef.current = []

      recordingMetaRef.current = {
        callId,
        channelId,
      }

      recorder.ondataavailable = (event) => {
        console.log('[recording] data available:', event.data.size)

        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        console.log(
          '[recording] STOPPED, chunks:',
          recordingChunksRef.current.length,
        )

        const chunks = recordingChunksRef.current
        recordingChunksRef.current = []

        if (chunks.length === 0) {
          console.log('[recording] NO CHUNKS')
          recordingUploadPromiseRef.current = Promise.resolve()
          return
        }

        const blob = new Blob(chunks, {
          type: recorder.mimeType || 'audio/webm',
        })

        console.log('[recording] blob created:', {
          size: blob.size,
          type: blob.type,
        })

        recordingUploadPromiseRef.current = uploadRecording(blob)
      }

      recorder.onerror = (event) => {
        console.error('[recording] MediaRecorder error:', event)
      }

      recorderRef.current = recorder

      console.log('[recording] STARTING MEDIA RECORDER')

      recorder.start(1000)
    },
    [channelId, uploadRecording],
  )
  const stopRecording = useCallback(async () => {
    const recorder = recorderRef.current

    if (!recorder) {
      console.log('[recording] no recorder to stop')
      return
    }

    console.log('[recording] stopping recorder...', recorder.state)

    recorderRef.current = null

    if (recorder.state !== 'inactive') {
      const stopped = new Promise<void>((resolve) => {
        recorder.addEventListener(
          'stop',
          () => {
            console.log('[recording] stop event received')
            resolve()
          },
          { once: true },
        )
      })

      recorder.stop()

      await stopped
    }

    if (recordingUploadPromiseRef.current) {
      console.log('[recording] waiting for upload...')

      await recordingUploadPromiseRef.current

      console.log('[recording] upload finished')
      recordingUploadPromiseRef.current = null
    }

    setRecordingFinalized(true)
  }, [])

  // ── every call.* and rtc.* message from the server lands here ───────────────
  const handleSignal = useCallback(
    async (msg: CallSignalEvent) => {
       console.log('[call] HANDLE SIGNAL:', msg.msg_type, msg)
      switch (msg.msg_type) {
        case 'call.incoming':
          console.log('msg userId', msg)
          console.log('userId', userId)
          if (msg.user_id === userId) return
          setIncomingCall(msg)
          break

        // I started a brand-new call
        case 'call.started':
          callIdRef.current = msg.call_id
          setCallId(msg.call_id)
          setSummary(null)
          startRecording(msg.call_id)
          break

        // I joined: here is who is already in the call
        case 'call.joined': {
          callIdRef.current = msg.call_id
          setCallId(msg.call_id)
          setIncomingCall(null)
          setSummary(null)
          const existing = msg.existing_peers ?? []
          setPeers(existing)
          // I am the newcomer: I send an offer to everyone already here
          const pm = ensurePM()
          existing.forEach((id) => pm?.callPeer(id).catch(console.error))
          break
        }

        // someone joined after me: wait, they will send me an offer
        case 'call.peer_joined':
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

        case 'call.ended': {
          console.log('[call] call ended, finalizing recording')

          await stopRecording()

          console.log('[call] recording finalized')

          closePeers()
          setCallId(null)
          setPeers([])
          setIncomingCall(null)
          stopMedia()

          break
        }

        case 'call.summary_ready':
          setSummary(msg.summary)
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
    [userId, ensurePM, closePeers, stopMedia, startRecording, stopRecording],
  )

  // ── actions ─────────────────────────────────────────────────────────────────
  // RULE: get the camera/mic FIRST, then tell the server.
  const start = useCallback(async () => {
    shouldUploadRecordingRef.current = true
    if (!(await getMedia())) return
    send({ msg_type: 'call.start', channel_id: channelId })
  }, [send, channelId, getMedia])

  const join = useCallback(
    async (id?: string) => {
      shouldUploadRecordingRef.current = false
      const target = typeof id === 'string' ? id : incomingCall?.call_id
      if (!target) return
      if (!(await getMedia())) return
      send({ msg_type: 'call.join', channel_id: channelId, call_id: target })
    },
    [send, channelId, incomingCall, getMedia],
  )

  const leave = useCallback(() => {
    if (callId) {
      send({ msg_type: 'call.leave', channel_id: channelId, call_id: callId })
    }
    stopRecording()
    closePeers()
    setCallId(null)
    setPeers([])
    stopMedia()
  }, [send, channelId, callId, stopMedia, closePeers, stopRecording])

  const dismiss = useCallback(() => setIncomingCall(null), [])

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

  const setVideoTrack = useCallback(async (track: MediaStreamTrack | null) => {
    if (!pmRef.current) return

    for (const pc of pmRef.current.values()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
      if (sender) await sender.replaceTrack(track)
    }
  }, [])

  const stopScreenShare = useCallback(async () => {
    screenRef.current?.getTracks().forEach((t) => t.stop())
    screenRef.current = null
    await setVideoTrack(localRef.current?.getVideoTracks()[0] ?? null)
    setLocal(new MediaStream(localRef.current?.getTracks() ?? []))
    setSharing(false)
  }, [setVideoTrack])

  const startScreenShare = useCallback(async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      })
      const track = screen.getVideoTracks()[0]
      if (!track) return

      screenRef.current = screen
      track.onended = () => void stopScreenShare()
      await setVideoTrack(track)
      setLocal(
        new MediaStream([track, ...(localRef.current?.getAudioTracks() ?? [])]),
      )
      setSharing(true)
    } catch {
      // no-op: the user cancelled the screen-share prompt
    }
  }, [setVideoTrack, stopScreenShare])
  // ── cleanup if the page unmounts mid-call: release camera + connections ─────
  useEffect(
    () => () => {
      stopRecording()
      stopMedia()
    },
    [stopMedia, stopRecording],
  )
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
    remotes,
    muted,
    cameraOff,
    mediaError,
    summary,
    recordingFinalized,
    sharing,
    startScreenShare,
    stopScreenShare,
    toggleMute,
    toggleCamera,
  }
}
