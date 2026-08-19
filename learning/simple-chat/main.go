package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

//
// =========================
// WebSocket message
// =========================
//

type WSMessage struct {
	Type      string          `json:"type"`
	RequestID string          `json:"request_id,omitempty"`
	RoomID    string          `json:"room_id,omitempty"`
	From      string          `json:"from,omitempty"`
	To        string          `json:"to,omitempty"`
	Payload   json.RawMessage `json:"payload,omitempty"`
}

//
// =========================
// Payloads
// =========================
//

type ChatMessagePayload struct {
	Content string `json:"content"`
}

type CallPayload struct {
	CallID string `json:"call_id"`
}

type RTCOfferPayload struct {
	SDP string `json:"sdp"`
}

type RTCAnswerPayload struct {
	SDP string `json:"sdp"`
}

type RTCIcePayload struct {
	Candidate     string  `json:"candidate"`
	SDPMid        *string `json:"sdp_mid,omitempty"`
	SDPMLineIndex *uint16 `json:"sdp_mline_index,omitempty"`
}

//
// =========================
// Client
// =========================
//

type Client struct {
	ID     string
	RoomID string

	conn *websocket.Conn
	hub  *Hub

	send chan WSMessage

	writeMu sync.Mutex
}

func (c *Client) sendMessage(msg WSMessage) {
	select {
	case c.send <- msg:
	default:
		log.Printf(
			"client %s send buffer full",
			c.ID,
		)
	}
}

//
// =========================
// Hub
// =========================
//

type Hub struct {
	rooms map[string]map[string]*Client
	users map[string]*Client

	register   chan *Client
	unregister chan *Client

	mu sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		rooms: make(map[string]map[string]*Client),
		users: make(map[string]*Client),

		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {

		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
			h.unregisterClient(client)
		}
	}
}

func (h *Hub) registerClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Prevent duplicate user connection.
	if old, exists := h.users[client.ID]; exists {
		log.Printf(
			"user %s already connected, closing old connection",
			client.ID,
		)

		delete(h.users, old.ID)
	}

	h.users[client.ID] = client

	if _, exists := h.rooms[client.RoomID]; !exists {
		h.rooms[client.RoomID] = make(map[string]*Client)
	}

	h.rooms[client.RoomID][client.ID] = client

	log.Printf(
		"user %s joined room %s",
		client.ID,
		client.RoomID,
	)
}

func (h *Hub) unregisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Remove from users map only if this
	// is still the active connection.
	if current, exists := h.users[client.ID]; exists &&
		current == client {

		delete(h.users, client.ID)
	}

	if room, exists := h.rooms[client.RoomID]; exists {

		delete(room, client.ID)

		if len(room) == 0 {
			delete(h.rooms, client.RoomID)
		}
	}

	log.Printf(
		"user %s left room %s",
		client.ID,
		client.RoomID,
	)
}

func (h *Hub) GetUser(userID string) (*Client, bool) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	client, ok := h.users[userID]

	return client, ok
}

func (h *Hub) GetRoom(roomID string) map[string]*Client {
	h.mu.RLock()
	defer h.mu.RUnlock()

	room := h.rooms[roomID]

	result := make(map[string]*Client)

	for id, client := range room {
		result[id] = client
	}

	return result
}

//
// =========================
// Chat
// =========================
//

func (h *Hub) BroadcastChat(
	msg WSMessage,
) {
	room := h.GetRoom(msg.RoomID)

	for _, client := range room {

		client.sendMessage(msg)
	}
}

//
// =========================
// Signaling
// =========================
//

func (h *Hub) ForwardSignal(msg WSMessage) {
	target, ok := h.GetUser(msg.To)

	if !ok {
		log.Printf(
			"signal target %s not found",
			msg.To,
		)

		return
	}

	target.sendMessage(msg)
}

//
// =========================
// Call Manager
// =========================
//

type Call struct {
	ID     string
	RoomID string

	Participants map[string]bool

	mu sync.RWMutex
}

type CallManager struct {
	calls map[string]*Call

	mu sync.RWMutex
}

func NewCallManager() *CallManager {
	return &CallManager{
		calls: make(map[string]*Call),
	}
}

func (cm *CallManager) CreateCall(
	callID string,
	roomID string,
	userID string,
) *Call {

	call := &Call{
		ID:     callID,
		RoomID: roomID,

		Participants: map[string]bool{
			userID: true,
		},
	}
	fmt.Println("Call-id", callID)
	cm.mu.Lock()
	cm.calls[callID] = call
	cm.mu.Unlock()

	return call
}

func (cm *CallManager) GetCall(
	callID string,
) (*Call, bool) {

	cm.mu.RLock()
	defer cm.mu.RUnlock()

	call, ok := cm.calls[callID]

	return call, ok
}

func (cm *CallManager) JoinCall(
	callID string,
	userID string,
) (*Call, bool) {

	cm.mu.RLock()

	call, ok := cm.calls[callID]

	cm.mu.RUnlock()

	if !ok {
		return nil, false
	}

	call.mu.Lock()
	call.Participants[userID] = true
	call.mu.Unlock()

	return call, true
}

func (cm *CallManager) LeaveCall(
	callID string,
	userID string,
) {

	cm.mu.Lock()
	defer cm.mu.Unlock()

	call, ok := cm.calls[callID]

	if !ok {
		return
	}

	call.mu.Lock()

	delete(call.Participants, userID)

	empty := len(call.Participants) == 0

	call.mu.Unlock()

	if empty {
		delete(cm.calls, callID)
	}
}

//
// =========================
// Message routing
// =========================
//

func (h *Hub) HandleMessage(
	client *Client,
	msg WSMessage,
	callManager *CallManager,
) {

	switch msg.Type {

	//
	// =====================
	// CHAT
	// =====================
	//

	case "message.send":

		var payload ChatMessagePayload

		if err := json.Unmarshal(
			msg.Payload,
			&payload,
		); err != nil {

			log.Println("invalid chat payload:", err)
			return
		}

		msg.From = client.ID
		msg.RoomID = client.RoomID

		log.Printf(
			"message from=%s content=%s",
			client.ID,
			payload.Content,
		)

		h.BroadcastChat(msg)

	//
	// =====================
	// CALL START
	// =====================
	//

	case "call.start":

		var payload CallPayload

		if err := json.Unmarshal(
			msg.Payload,
			&payload,
		); err != nil {

			log.Println("invalid call payload:", err)
			return
		}

		callID := payload.CallID

		call := callManager.CreateCall(
			callID,
			client.RoomID,
			client.ID,
		)

		log.Printf(
			"call started call=%s user=%s",
			call.ID,
			client.ID,
		)

		// Tell the caller that the call exists.
		client.sendMessage(WSMessage{
			Type:   "call.started",
			RoomID: client.RoomID,
			From:   "server",
			Payload: mustJSON(CallPayload{
				CallID: call.ID,
			}),
		})

	//
	// =====================
	// CALL JOIN
	// =====================
	//

	case "call.join":

		var payload CallPayload

		if err := json.Unmarshal(
			msg.Payload,
			&payload,
		); err != nil {
			return
		}

		call, ok := callManager.JoinCall(
			payload.CallID,
			client.ID,
		)

		if !ok {
			client.sendMessage(WSMessage{
				Type: "error",
				Payload: mustJSON(map[string]string{
					"message": "call not found",
				}),
			})

			return
		}

		log.Printf(
			"user=%s joined call=%s",
			client.ID,
			call.ID,
		)

		// Notify everyone else in the call.
		call.mu.RLock()

		for participantID := range call.Participants {

			if participantID == client.ID {
				continue
			}

			participant, ok := h.GetUser(participantID)

			if !ok {
				continue
			}

			participant.sendMessage(WSMessage{
				Type:   "call.user_joined",
				RoomID: client.RoomID,
				From:   client.ID,
				Payload: mustJSON(
					CallPayload{
						CallID: call.ID,
					},
				),
			})
		}

		call.mu.RUnlock()

	//
	// =====================
	// CALL LEAVE
	// =====================
	//

	case "call.leave":

		var payload CallPayload

		if err := json.Unmarshal(
			msg.Payload,
			&payload,
		); err != nil {
			return
		}

		callManager.LeaveCall(
			payload.CallID,
			client.ID,
		)

		log.Printf(
			"user=%s left call=%s",
			client.ID,
			payload.CallID,
		)

		// Notify room participants.
		call, exists := callManager.GetCall(
			payload.CallID,
		)

		if !exists {
			return
		}

		call.mu.RLock()

		for participantID := range call.Participants {

			participant, ok := h.GetUser(participantID)

			if !ok {
				continue
			}

			participant.sendMessage(WSMessage{
				Type: "call.user_left",
				From: client.ID,
				Payload: mustJSON(
					CallPayload{
						CallID: payload.CallID,
					},
				),
			})
		}

		call.mu.RUnlock()

	//
	// =====================
	// WEBRTC OFFER
	// =====================
	//

	case "rtc.offer":

		msg.From = client.ID

		log.Printf(
			"offer from=%s to=%s",
			client.ID,
			msg.To,
		)

		h.ForwardSignal(msg)

	//
	// =====================
	// WEBRTC ANSWER
	// =====================
	//

	case "rtc.answer":

		msg.From = client.ID

		log.Printf(
			"answer from=%s to=%s",
			client.ID,
			msg.To,
		)

		h.ForwardSignal(msg)

	//
	// =====================
	// ICE
	// =====================
	//

	case "rtc.ice":

		msg.From = client.ID

		h.ForwardSignal(msg)

	default:

		log.Printf(
			"unknown message type=%s",
			msg.Type,
		)
	}
}

//
// =========================
// Helpers
// =========================
//

func mustJSON(v any) json.RawMessage {
	data, err := json.Marshal(v)

	if err != nil {
		panic(err)
	}

	return data
}

//
// =========================
// WebSocket pumps
// =========================
//

func (c *Client) readPump(
	callManager *CallManager,
) {

	defer func() {

		c.hub.unregister <- c

		close(c.send)

		_ = c.conn.Close()
	}()

	for {

		var msg WSMessage

		err := c.conn.ReadJSON(&msg)

		if err != nil {

			if websocket.IsUnexpectedCloseError(
				err,
				websocket.CloseGoingAway,
				websocket.CloseNormalClosure,
			) {
				log.Println(
					"websocket read error:",
					err,
				)
			}

			return
		}

		c.hub.HandleMessage(
			c,
			msg,
			callManager,
		)
	}
}

func (c *Client) writePump() {

	defer c.conn.Close()

	for msg := range c.send {

		c.writeMu.Lock()

		err := c.conn.WriteJSON(msg)

		c.writeMu.Unlock()

		if err != nil {

			log.Println(
				"websocket write error:",
				err,
			)

			return
		}
	}
}

//
// =========================
// HTTP
// =========================
//

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Development only.
		return true
	},
}

func serveWS(
	hub *Hub,
	callManager *CallManager,
	w http.ResponseWriter,
	r *http.Request,
) {

	roomID := r.URL.Query().Get("roomId")
	userID := r.URL.Query().Get("userId")

	if roomID == "" {
		http.Error(
			w,
			"roomId required",
			http.StatusBadRequest,
		)
		return
	}

	if userID == "" {
		http.Error(
			w,
			"userId required",
			http.StatusBadRequest,
		)
		return
	}

	conn, err := upgrader.Upgrade(
		w,
		r,
		nil,
	)

	if err != nil {
		log.Println(
			"upgrade error:",
			err,
		)

		return
	}

	client := &Client{
		ID:     userID,
		RoomID: roomID,

		conn: conn,
		hub:  hub,

		send: make(chan WSMessage, 256),
	}

	hub.register <- client

	go client.writePump()

	go client.readPump(callManager)
}

//
// =========================
// MAIN
// =========================
//

func main() {

	hub := NewHub()

	callManager := NewCallManager()

	go hub.Run()

	http.HandleFunc(
		"/ws",
		func(w http.ResponseWriter, r *http.Request) {

			serveWS(
				hub,
				callManager,
				w,
				r,
			)
		},
	)

	http.Handle(
		"/",
		http.FileServer(
			http.Dir("./public"),
		),
	)

	log.Println(
		"server running on :8080",
	)

	if err := http.ListenAndServe(
		":8080",
		nil,
	); err != nil {

		log.Fatal(err)
	}
}
