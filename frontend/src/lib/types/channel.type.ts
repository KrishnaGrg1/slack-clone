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

export interface Message {
  id: string
  channel_id: string
  sender_id: string
  content: string
  parent_id: string
  msg_type: string
  created_at: string
  edited_at: string
  sender_username: string
  sender_avatar: string
}
export interface GetChannelMessageResponse {
  success: boolean
  message: string
  data: Message[]
}
