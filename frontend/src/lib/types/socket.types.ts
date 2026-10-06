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
  user_id: string // initiator ID (was sender_id — matches backend OutboundCallEvent.UserID)
}

export type CallStartedEvent = {
  msg_type: 'call.started'
  call_id: string
  channel_id: string
  thread_id?: string
  user_id?: string // not sent by backend for call.started
  existing_peers?: string[]
}

export type CallJoinedEvent = {
  msg_type: 'call.joined'
  call_id: string
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

export type CallSummaryReadyEvent = {
  msg_type: 'call.summary_ready'
  call_id: string
  channel_id: string
  summary: string
  transcript?: string
}

// rtc.* events are forwarded by the server as SignalMsg.
// The server sets from_user_id from the authenticated connection.
export type RTCOfferRelayEvent = {
  msg_type: 'rtc.offer'
  call_id: string
  from_user_id: string
  sdp: string
}

export type RTCAnswerRelayEvent = {
  msg_type: 'rtc.answer'
  call_id: string
  from_user_id: string
  sdp: string
}

export type RTCIceRelayEvent = {
  msg_type: 'rtc.ice'
  call_id: string
  from_user_id: string
  candidate: RTCIceCandidateInit
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
  | CallJoinedEvent
  | CallPeerJoinedEvent
  | CallPeerLeftEvent
  | CallEndedEvent
  | CallSummaryReadyEvent
  | RTCOfferRelayEvent
  | RTCAnswerRelayEvent
  | RTCIceRelayEvent
  | ErrorEvent

// ── Events that carry only signaling (call.* and rtc.*) ──
export type CallSignalEvent =
  | CallIncomingEvent
  | CallStartedEvent
  | CallJoinedEvent
  | CallPeerJoinedEvent
  | CallPeerLeftEvent
  | CallEndedEvent
  | CallSummaryReadyEvent
  | RTCOfferRelayEvent
  | RTCAnswerRelayEvent
  | RTCIceRelayEvent

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
  call_id?: string
}

export type CallJoinEvent = {
  msg_type: 'call.join'
  channel_id: string
  thread_id?: string
  call_id: string
}

export type CallLeaveEvent = {
  msg_type: 'call.leave'
  channel_id: string
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
