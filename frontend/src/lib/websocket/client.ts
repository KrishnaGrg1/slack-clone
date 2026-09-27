import { getAuthHeader } from '../services/helper'
import type { ClientEvent, ServerEvent } from '../types/socket.types'

type Listener = (event: ServerEvent) => void

export class ChatSocket {
  private socket: WebSocket | null = null
  private listeners = new Set<Listener>()
  constructor(private readonly channelID: string) {}

  async connect() {
    if (typeof window === 'undefined') {
      return
    }

    if (this.socket) {
      return
    }
    const baseUrl = import.meta.env.VITE_WS_URL

     const headers = await getAuthHeader()

    const url = new URL(`${baseUrl}`)
    url.searchParams.set('channel_id', this.channelID)

    if (headers?.Authorization) {
      const token = headers.Authorization.replace('Bearer ', '')
      url.searchParams.set('token', token)
    }
    this.socket = new WebSocket(url.toString())

    this.socket.onopen = () => {
      console.log('websocket connected')
    }
    this.socket.onmessage = (event) => {
      this.handleMessage(event.data)
    }
    this.socket.onerror = (error) => {
      console.error('WebSocket error', error)
    }

    this.socket.onclose = () => {
      console.log('WebSocket disconnected')
      this.socket = null
    }
  }

  private handleMessage(raw: string) {
    // Your Go writePump can batch multiple JSON objects
    // into a single WebSocket frame separated by \n.
    const messages = raw.split('\n')

    for (const message of messages) {
      if (!message.trim()) continue

      try {
        const event = JSON.parse(message) as ServerEvent

        for (const listener of this.listeners) {
          listener(event)
        }
      } catch (error) {
        console.error('Invalid WebSocket message:', error)
      }
    }
  }

  send(event: ClientEvent) {
    if (this.socket?.readyState != WebSocket.OPEN) {
      console.warn('Websocket isnot connected')
      return
    }
    this.socket.send(JSON.stringify(event))
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  close() {
    this.socket?.close()
    this.socket = null
  }
}
