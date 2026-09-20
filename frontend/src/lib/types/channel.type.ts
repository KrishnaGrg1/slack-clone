export interface Channels {
  id: string
  name: string
  is_private: boolean
  created_by: string
  created_at: string
}
export interface Channel_Members {
  channel_id: string
  user_id: string
  joined_at: string
  last_read: string
}

export interface CreateChannelInput {
  name: string
}

export interface CreateChannelResponse {
  success: boolean
  message: string
  data: Channels
}

export interface GetAllChannelResponse {
  success: boolean
  message: string
  data: Channels[]
}

export interface GetChannelByIDInput{
    id:string
}
export interface GetChannelResponse {
  success: boolean
  message: string
  data: Channels
}

export interface JoinChannelInput{
    id:string
}
export interface JoinChannelResponse {
  success: boolean
  message: string
  data: Channels
}


export interface LeaveChannelInput{
    id:string
}
export interface LeaveChannelResponse {
  success: boolean
  message: string
}


export interface GetChannelMessageInput{
    id:string
}

export interface Message{
  id:string
  channel_id:string
  sender_id:string
  content:string
  parent_id:string
  msg_type:string
  created_at:string
  edited_at:string
  sender_username:string
  sender_avatar:string
}
export interface GetChannelMessageResponse {
  success: boolean
  message: string
  data: Message[]
}

