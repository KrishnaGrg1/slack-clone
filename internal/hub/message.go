package hub

type MessageType string

// ── Inbound types (client → server) ──────────────────────────
const (
	TypeMessageSend = "message.send"
	TypeTypingStart = "typing.start"

	TypeCallStart = "call.start"
	TypeCallJoin  = "call.join"
	TypeCallLeave = "call.leave"

	TypeRTCOffer  = "rtc.offer"
	TypeRTCAnswer = "rtc.answer"
	TypeRTCIce    = "rtc.ice"
)

// ── Outbound types (server → client) ─────────────────────────
const (
	TypeMessageNew      = "message.new"
	TypeTypingIndicator = "typing"

	TypeCallIncoming   = "call.incoming"    // notify channel members
	TypeCallStarted    = "call.started"     // confirm to initiator
	TypeCallJoined     = "call.joined"      // confirm to joiner + existing peers
	TypeCallPeerJoined = "call.peer_joined" // tell existing peers who joined
	TypeCallPeerLeft   = "call.peer_left"   // tell remaining peers who left
	TypeCallEnded      = "call.ended"       // last peer left

	TypeSummaryReady = "call.summary_ready"
	TypePresence     = "presence"
	TypeError        = "error"
)

type Message struct {
	Type     string `json:"type"`
	SenderID string `json:"sender_id"`
	RoomID   string `json:"room_id"`
	Content  string `json:"content"`
	ParentID string `json:"parent_id,omitempty"` // ← add
}

// InboundCallMsg is what client sends for call.start / call.join / call.leave
type InboundCallMsg struct {
	Type      string `json:"type"`
	ChannelID string `json:"channel_id"`
	ThreadID  string `json:"thread_id,omitempty"`
	CallID    string `json:"call_id,omitempty"`
}

// SignalMsg carries WebRTC offer / answer / ICE candidates
type SignalMsg struct {
	Type         string `json:"type"`
	CallID       string `json:"call_id"`
	TargetUserID string `json:"target_user_id,omitempty"`
	FromUserID   string `json:"from_user_id,omitempty"`
	SDP          string `json:"sdp,omitempty"`
	Candidate    any    `json:"candidate,omitempty"`
}

// OutboundCallEvent is what server sends to clients about call state
type OutboundCallEvent struct {
	Type          string   `json:"type"`
	CallID        string   `json:"call_id"`
	ChannelID     string   `json:"channel_id,omitempty"`
	ThreadID      string   `json:"thread_id,omitempty"`
	UserID        string   `json:"user_id,omitempty"`
	ExistingPeers []string `json:"existing_peers,omitempty"`
}
