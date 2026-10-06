// frontend/src/lib/services/recording.ts
//
// Uploads the call recording STRAIGHT to the Go API (not through the
// TanStack Start / Vite server, which was cutting the request).
//
// .env:  VITE_API_URL=http://localhost:8080/api/v1   <- your Go base URL,
//        including whatever prefix the /calls routes live under.

import axiosInstance from '#/lib/axios'
import { getWsToken } from '#/lib/services/ws-token'

const API_URL: string =
  import.meta.env.VITE_API_URL ?? axiosInstance.defaults.baseURL ?? ''

export async function uploadCallRecording(opts: {
  callId: string
  channelId: string
  threadId?: string
  blob: Blob
}) {
  const token = await getWsToken()
  if (!token) throw new Error('no auth token')

  // field names must match the Go handler: audio, channel_id, thread_id
  const form = new FormData()
  form.append('audio', opts.blob, `${opts.callId}.webm`)
  form.append('channel_id', opts.channelId)
  if (opts.threadId) form.append('thread_id', opts.threadId)

  const res = await fetch(`${API_URL}/calls/${opts.callId}/recording`, {
    method: 'POST',
    // do NOT set Content-Type: the browser adds the multipart boundary itself
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })

  if (!res.ok) {
    throw new Error(`upload failed: ${res.status} ${await res.text()}`)
  }
  return res.json().catch(() => null)
}