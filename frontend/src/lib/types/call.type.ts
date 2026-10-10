export interface Call {
  id: string
  channel_id: string | null
  dm_id: string | null
  thread_msg_id: string | null
  started_by: string | null
  status: 'active' | 'ended'
  started_at: string
  ended_at: string | null
  duration_sec: number | null

  call_participants: CallParticipant[]
  call_summary: CallSummary | null
}

export interface CallParticipant {
  call_id: string
  user_id: string
  joined_at: string
  left_at: string | null
}

export interface CallSummary {
  id: string
  call_id: string
  transcript: string | null
  summary: string | null
  msg_id: string | null
  created_at: string
}

export interface UploadCallRecordingAndTranscribeResponse {
  status: boolean
  message: string
}
