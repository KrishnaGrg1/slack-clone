// lib/websocket/client.ts

import type { ClientEvent, ServerEvent } from '../types/socket.types'

type Listener = (event: ServerEvent) => void
type StatusListener = (status: SocketStatus) => void

export type SocketStatus = 'connecting' | 'open' | 'closed'

const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 15000

export class ChatSocket {
  private socket: WebSocket | null = null
  private listeners = new Set<Listener>()
  private statusListeners = new Set<StatusListener>()
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private generation = 0
  private outboundQueue: ClientEvent[] = []

  constructor(
    private readonly channelID: string,
    private readonly getToken: () => Promise<string | null>,
  ) {}

  async connect() {
    if (typeof window === 'undefined') return
    if (this.socket) return

    // a newer connect()/close() while the token request is in flight wins
    const generation = ++this.generation

    const token = await this.getToken()
    if (generation !== this.generation) return
    if (!token) {
      console.warn('[ws] no auth token, not connecting')
      return
    }

    const baseUrl = import.meta.env.VITE_WS_URL
    if (!baseUrl) {
      console.warn('[ws] VITE_WS_URL is not set')
      return
    }

    // Browsers cannot set headers on a WebSocket handshake, so the token
    // travels in the query string. The Go auth middleware reads it from there.
    const url = new URL(baseUrl)
    url.searchParams.set('channel_id', this.channelID)
    url.searchParams.set('token', token)

    this.emitStatus('connecting')

    const socket = new WebSocket(url.toString())
    this.socket = socket

    socket.onopen = () => {
      this.reconnectAttempts = 0
      this.emitStatus('open')
      this.flushQueue()
    }

    socket.onmessage = (e) => this.handleMessage(String(e.data))

    socket.onerror = () => {
      // onclose always follows, so reconnection is handled there
    }

    socket.onclose = () => {
      this.socket = null
      this.emitStatus('closed')
      // a stale socket (one that close() already tore down) must not reconnect
      if (generation === this.generation) this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return

    const delay = Math.min(
      RECONNECT_BASE_MS * 2 ** this.reconnectAttempts,
      RECONNECT_MAX_MS,
    )
    this.reconnectAttempts += 1

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      void this.connect()
    }, delay)
  }

private handleMessage(raw: string) {
  console.log('socket data', raw)
  console.log('[ws] listener count:', this.listeners.size)

  for (const chunk of raw.split('\n')) {
    if (!chunk.trim()) continue

    try {
      const event = JSON.parse(chunk) as ServerEvent

      console.log(
        '[ws] dispatching:',
        event.msg_type,
        'listeners:',
        this.listeners.size,
      )

      for (const listener of this.listeners) {
        listener(event)
      }
    } catch (e) {
      console.error('[ws] invalid message', e)
    }
  }
}

  private emitStatus(status: SocketStatus) {
    for (const listener of this.statusListeners) listener(status)
  }

  private flushQueue() {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return

    while (this.outboundQueue.length > 0) {
      const event = this.outboundQueue.shift()
      if (!event) continue
      this.socket.send(JSON.stringify(event))
    }
  }

  send(event: ClientEvent) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(event))
      return
    }

    this.outboundQueue.push(event)
    if (!this.socket) {
      void this.connect()
    }
  }

subscribe(listener: Listener) {
  console.log('[ws] SUBSCRIBE. listeners before:', this.listeners.size)

  this.listeners.add(listener)

  console.log('[ws] SUBSCRIBE. listeners after:', this.listeners.size)

  return () => {
    console.log('[ws] UNSUBSCRIBE. listeners before:', this.listeners.size)

    this.listeners.delete(listener)

    console.log('[ws] UNSUBSCRIBE. listeners after:', this.listeners.size)
  }
}

  subscribeStatus(listener: StatusListener) {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  close() {
    this.generation++
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.reconnectAttempts = 0
    this.socket?.close()
    this.socket = null
  }
}
