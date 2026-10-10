// call.service.ts
import { createServerFn } from '@tanstack/react-start'
import { getAuthHeader } from './helper'
import axiosInstance from '../axios'
import type { UploadCallRecordingAndTranscribeResponse } from '../types/call.type'

export const uploadRecordingFn = createServerFn({ method: 'POST' })
  .inputValidator((data: FormData) => {
    if (!(data instanceof FormData)) throw new Error('Expected FormData')
    return data
  })
  .handler(async ({ data }) => {
    const callId = String(data.get('call_id'))
    const channelId = String(data.get('channel_id'))
    const file = data.get('audio') as File

    // File -> Buffer -> fresh FormData (reliable with axios on Node)
    const buffer = Buffer.from(await file.arrayBuffer())
    const form = new FormData()
    form.append('audio', new Blob([buffer], { type: file.type }), file.name)
    form.append('channel_id', channelId)

    const headers = await getAuthHeader()

    try {
      const res =
        await axiosInstance.post<UploadCallRecordingAndTranscribeResponse>(
          `/calls/${callId}/recording`,
          form,
          { headers }, // axios sets the multipart Content-Type + boundary itself
        )
      return res.data
    } catch (error: any) {
      console.error(
        '[upload] backend error',
        error?.response?.status,
        error?.response?.data,
      )
      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to upload and transcribe',
      )
    }
  })

// client-side wrapper: same signature, so use-call.ts needs no changes
export const uploadCallRecordingAndTranscribe = async ({
  callId,
  channelId,
  file,
}: {
  callId: string
  channelId: string
  file: File
}) => {
  const fd = new FormData()
  fd.append('audio', file)
  fd.append('channel_id', channelId)
  fd.append('call_id', callId)
  return uploadRecordingFn({ data: fd })
}
