export interface Channel {
  id: string
  workspace_id: string
  name: string
  channel_type: string
  created_by: string
  created_at: string
}
export interface Channel_Members {
  id: string
  username: string
  email: string
  avatar_url: string
}

export interface CreateChannelInput {
  name: string
}

export interface CreateChannelResponse {
  success: boolean
  message: string
  data: Channel
}

export interface GetAllChannelResponse {
  success: boolean
  message: string
  data: Channel[]
}

export interface GetChannelByIDInput {
  id: string
}
export interface GetChannelResponse {
  success: boolean
  message: string
  data: {
    channel: Channel
    channel_members: Channel_Members[]
  }
}

export interface JoinChannelInput {
  id: string
}
export interface JoinChannelResponse {
  success: boolean
  message: string
  data: Channel
}

export interface LeaveChannelInput {
  id: string
}
export interface LeaveChannelResponse {
  success: boolean
  message: string
}

export interface GetChannelMessageInput {
  id: string
}
// lib/types/channel.type.ts

export interface Message {
  id: string
  channel_id: string
  sender_id: string
  sender_username: string
  sender_avatar: string
  content: string
  thread_id: string // renamed from parent_id — empty string = top-level
  msg_type: 'text' | 'call' | 'call_summary'
  created_at: string
  edited_at: string
  reply_count: number // 0 for new messages / thread replies
}

export interface GetChannelMessageResponse {
  success: boolean
  message: string
  data: {
    messages: Message[]
  }
}
