// server
export type MessageNewEvent = {
  msg_type: 'message.new'
  sender_id: string
  channel_id: string
  content: string
  sender_username: string
  thread_id?: string
}

export type TypingEvent = {
  channel_id: string
  msg_type: 'typing'
  sender_id: string
  sender_username: string
  thread_id?: string
}

export type CallIncomingEvent = {
  msg_type: 'call.incoming'
  call_id: string
  channel_id: string
  thread_id?: string
  sender_id: string
}

export type CallStartedEvent = {
  msg_type: 'call.started'
  call_id: string
  channel_id: string
  thread_id?: string
  user_id: string
  existing_peers?: string[]
}

export type CallPeerJoinedEvent = {
  msg_type: 'call.peer_joined'
  call_id: string
  user_id: string
}

export type CallPeerLeftEvent = {
  msg_type: 'call.peer_left'
  call_id: string
  user_id: string
}

export type CallEndedEvent = {
  msg_type: 'call.ended'
  call_id: string
}

export type ErrorEvent = {
  msg_type: 'error'
  message: string
}

export type ServerEvent =
  | MessageNewEvent
  | TypingEvent
  | CallIncomingEvent
  | CallStartedEvent
  | CallPeerJoinedEvent
  | CallPeerLeftEvent
  | CallEndedEvent
  | ErrorEvent

// client

export type MessageSendEvent = {
  msg_type: 'message.send'
  content: string
  thread_id?: string
}

export type TypingStartEvent = {
  msg_type: 'typing.start'
}

export type CallStartEvent = {
  msg_type: 'call.start'
  channel_id: string
  thread_id?: string
}

export type CallJoinEvent = {
  msg_type: 'call.join'
  channel_id: string
  thread_id?: string
  call_id: string
}

export type CallLeaveEvent = {
  msg_type: 'call.leave'
  call_id: string
}

export type RTCOfferEvent = {
  msg_type: 'rtc.offer'
  call_id: string
  target_user_id: string
  sdp: string
}

export type RTCAnswerEvent = {
  msg_type: 'rtc.answer'
  call_id: string
  target_user_id: string
  sdp: string
}

export type RTCIceEvent = {
  msg_type: 'rtc.ice'
  call_id: string
  target_user_id: string
  candidate: RTCIceCandidateInit
}

export type ClientEvent =
  | MessageSendEvent
  | TypingStartEvent
  | CallStartEvent
  | CallJoinEvent
  | CallLeaveEvent
  | RTCOfferEvent
  | RTCAnswerEvent
  | RTCIceEvent
