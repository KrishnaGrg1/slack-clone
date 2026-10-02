import type { ClientEvent } from '#/lib/types/socket.types'

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  // Step 6 (later): add your TURN server here so calls work across strict networks
}

export class PeerManager {
  private peers = new Map<string, RTCPeerConnection>()
  private pendingIce = new Map<string, RTCIceCandidateInit[]>()

  constructor(
    private callId: string,
    private local: MediaStream,
    private send: (e: ClientEvent) => void,
    private onRemoteStream: (userId: string, s: MediaStream) => void,
  ) {}

  // get or create the connection for one person
  private get(userId: string): RTCPeerConnection {
    const existing = this.peers.get(userId)
    if (existing) return existing

    const pc = new RTCPeerConnection(RTC_CONFIG)

    // hand our camera/mic tracks to this connection so they get sent
    this.local.getTracks().forEach((t) => pc.addTrack(t, this.local))

    // the browser found a possible route: pass it to the other person
    pc.onicecandidate = (e) => {
      if (!e.candidate) return
      this.send({
        msg_type: 'rtc.ice',
        call_id: this.callId,
        target_user_id: userId,
        candidate: e.candidate.toJSON(),
      })
    }

    // their video/audio arrived
    pc.ontrack = (e) => this.onRemoteStream(userId, e.streams[0])

    pc.onconnectionstatechange = () =>
      console.log('[pc]', userId.slice(0, 6), pc.connectionState)

    this.peers.set(userId, pc)
    return pc
  }

  // the joiner calls this for each person already in the call
  async callPeer(userId: string) {
    const pc = this.get(userId)
    await pc.setLocalDescription(await pc.createOffer())
    this.send({
      msg_type: 'rtc.offer',
      call_id: this.callId,
      target_user_id: userId,
      sdp: pc.localDescription!.sdp,
    })
  }

  async onOffer(from: string, sdp: string) {
    const pc = this.get(from)
    await pc.setRemoteDescription({ type: 'offer', sdp })
    await this.flushIce(from, pc)
    await pc.setLocalDescription(await pc.createAnswer())
    this.send({
      msg_type: 'rtc.answer',
      call_id: this.callId,
      target_user_id: from,
      sdp: pc.localDescription!.sdp,
    })
  }

  async onAnswer(from: string, sdp: string) {
    const pc = this.peers.get(from)
    if (!pc) return
    await pc.setRemoteDescription({ type: 'answer', sdp })
    await this.flushIce(from, pc)
  }

  async onIce(from: string, candidate: RTCIceCandidateInit) {
    const pc = this.get(from)
    // a route can arrive before the offer/answer is applied: hold it until then
    if (!pc.remoteDescription) {
      this.pendingIce.set(from, [
        ...(this.pendingIce.get(from) ?? []),
        candidate,
      ])
      return
    }
    await pc.addIceCandidate(candidate)
  }

  private async flushIce(from: string, pc: RTCPeerConnection) {
    for (const c of this.pendingIce.get(from) ?? []) await pc.addIceCandidate(c)
    this.pendingIce.delete(from)
  }

  removePeer(userId: string) {
    this.peers.get(userId)?.close()
    this.peers.delete(userId)
    this.pendingIce.delete(userId)
  }

  closeAll() {
    for (const id of [...this.peers.keys()]) this.removePeer(id)
  }
}