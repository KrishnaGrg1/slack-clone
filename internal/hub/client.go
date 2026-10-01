package hub

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/KrishnaGrg1/slack-clone/internal/call"
	"github.com/KrishnaGrg1/slack-clone/internal/middleware"
	"github.com/KrishnaGrg1/slack-clone/internal/store"
	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	// Must fit SDP payloads — a single WebRTC offer is typically 2-4 KB, and
	// ICE candidate batches add more, so keep headroom well above that.
	maxMessageSize = 64 * 1024
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // lock this to your frontend origin in production
	},
}

// Client is a middleman between the websocket connection and the hub.
type Client struct {
	hub        *Hub
	senderName string
	senderID   string
	channelID  string
	// The websocket connection.
	conn *websocket.Conn

	// Buffered channel of outbound messages.
	send chan []byte
}

// readPump pumps messages from the websocket connection to the hub.
//
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, data, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
		// Step 1: peek at the type field only
		var peek struct {
			Type string `json:"msg_type"`
		}
		if err := json.Unmarshal(data, &peek); err != nil {
			log.Println("invalid frame:", err)
			continue
		}
		switch peek.Type {

		// chat
		case TypeMessageSend:
			data = bytes.TrimSpace(bytes.Replace(data, newline, space, -1))
			var payload struct {
				Content  string `json:"content"`
				ThreadID string `json:"thread_id,omitempty"`
			}
			if err := json.Unmarshal(data, &payload); err != nil {
				log.Printf("invalid message format: %v", err)
				continue
			}

			c.hub.broadcast <- Message{
				Type:       "message.new",
				SenderID:   c.senderID,
				SenderName: c.senderName,
				Content:    payload.Content,
				ChannelID:  c.channelID,
				ThreadID:   payload.ThreadID,
				Created_At: time.Now().Format("2006-01-02T15:04:05.000000-07:00"),
			}

		//Typing
		case TypeTypingStart:
			payload, _ := json.Marshal(map[string]string{
				"msg_type":        TypeTypingIndicator,
				"sender_id":       c.senderID,
				"channel_id":      c.channelID,
				"sender_username": c.senderName,
			})
			//need to notify to all users who are in the room
			c.hub.NotifyRoom(c.channelID, payload)

		// start call
		case TypeCallStart:
			var msg InboundCallMsg
			if err := json.Unmarshal(data, &msg); err != nil {
				continue
			}
			//start call
			c.handleCallStart(msg)

		//join call
		case TypeCallJoin:
			var msg InboundCallMsg
			if err := json.Unmarshal(data, &msg); err != nil {
				continue
			}
			// join the call as well as notify the user who are in the call also
			c.handleCallJoin(msg)

		// leave call
		case TypeCallLeave:
			var msg InboundCallMsg
			if err := json.Unmarshal(data, &msg); err != nil {
				continue
			}
			// leave call
			c.handleCallLeave(msg)

		//-webrtc signaling-
		case TypeRTCOffer, TypeRTCIce, TypeRTCAnswer:
			var sig SignalMsg
			if err := json.Unmarshal(data, &sig); err != nil {
				continue
			}
			sig.FromUserID = c.senderID
			c.hub.EnqueueSignal(sig)
		default:
			log.Printf("unknown message type: %s", peek.Type)

		}

	}
}

// writePump pumps messages from the hub to the websocket connection.
//
// A goroutine running writePump is started for each connection. The
// application ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			if _, err := w.Write(message); err != nil {
				return
			}

			// Add queued chat messages to the current websocket message.
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write(newline)
				if _, err := w.Write(<-c.send); err != nil {
					return
				}
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// serveWs handles websocket requests from the peer.
func ServeWs(hub *Hub, store *store.Store, w http.ResponseWriter, r *http.Request) {
	userId, userName, ok := middleware.GetUserDetails(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	channelID := r.URL.Query().Get("channel_id")
	if channelID == "" {
		log.Println("missing channelID")
		http.Error(w, "missing channel_id", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	client := &Client{hub: hub, senderID: userId, senderName: userName, channelID: channelID, conn: conn, send: make(chan []byte, 256)}
	client.hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump()
	// defer conn.Close()
}

// handleCallStart creates a new call room and notifies channel members
func (c *Client) handleCallStart(msg InboundCallMsg) {
	call, existing, isCreated := c.hub.callManager.StartCall(c.senderID, c.senderName, c.channelID)

	if isCreated {
		// tell initiator: here is your call ID
		event := OutboundCallEvent{
			Type:      TypeCallStarted,
			CallID:    call.ID,
			ChannelID: c.channelID,
			ThreadID:  msg.ThreadID,
		}
		payload, _ := json.Marshal(event)
		c.hub.SendToUser(c.senderID, payload)

		// notify everyone else in the channel: incoming call

		incoming := OutboundCallEvent{
			Type:      TypeCallIncoming,
			CallID:    call.ID,
			ChannelID: c.channelID,
			ThreadID:  msg.ThreadID,
			UserID:    call.InitiatorID,
		}
		inPayload, _ := json.Marshal(incoming)
		c.hub.NotifyRoom(c.channelID, inPayload)
	} else {
		c.sendExistingPeers(call.ID, existing)
		perrJoined, _ := json.Marshal(OutboundCallEvent{
			Type:   TypeCallPeerJoined,
			CallID: call.ID,
			UserID: c.senderID,
		})
		for _, perr := range existing {
			c.hub.SendToUser(perr.ID, perrJoined)
		}
	}
}

func (c *Client) handleCallJoin(
	msg InboundCallMsg,
) {
	call, existing, ok := c.hub.callManager.JoinCall(msg.CallID, c.senderID, c.senderName)
	if !ok {
		// never Fatal: a bad call_id from one client must not kill the process
		log.Printf("failed joining call by=%s callID=%s", c.senderName, msg.CallID)
		return
	}
	// send to ownself who who are in the call
	c.sendExistingPeers(call.ID, existing)

	// also notify to all users who are in the call

	//this is the payload to be send
	peerJoined, _ := json.Marshal(OutboundCallEvent{
		Type:   TypeCallPeerJoined,
		CallID: msg.CallID,
		UserID: c.senderID,
	})
	//finally send the data:{user Have joined the call} to each users of the call
	for _, peer := range existing {
		c.hub.SendToUser(peer.ID, peerJoined)
	}
}

// handleCallLeave removes this peer and notifies remaining peers
func (c *Client) handleCallLeave(msg InboundCallMsg) {
	departure, ok := c.hub.callManager.LeaveCall(c.senderID, msg.CallID)
	if !ok {
		log.Printf("failed to leave call user=%s callID=%s", c.senderID, msg.CallID)
		return
	}

	event := OutboundCallEvent{
		Type:   TypeCallPeerLeft,
		CallID: msg.CallID,
		UserID: c.senderID,
	}
	if departure.Ended {
		event.Type = TypeCallEnded
	}
	payload, _ := json.Marshal(event)

	if departure.Ended {
		// nobody is left in the call, so tell the whole channel to clear the banner
		c.hub.NotifyRoom(departure.ChannelID, payload)
	} else {
		for _, peerID := range departure.Remaining {
			c.hub.SendToUser(peerID, payload)
		}
	}
	// for _, peerID := range departure.Remaining {
	// 	c.hub.SendToUser(peerID, payload)
	// }

}

// sendExistingPeers tells the current client who is already in the call
func (c *Client) sendExistingPeers(callID string, existing []call.Participant) {
	ids := make([]string, len(existing))

	for i, k := range existing {
		ids[i] = k.ID
	}
	payload, _ := json.Marshal(OutboundCallEvent{
		Type:          TypeCallJoined,
		CallID:        callID,
		ExistingPeers: ids,
		UserID:        c.senderID,
	})
	c.hub.SendToUser(c.senderID, payload)
}
