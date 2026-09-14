package hub

import (
	"context"
	"encoding/json"
	"log"
	"sync"

	"github.com/KrishnaGrg1/slack-clone/internal/call"
	"github.com/KrishnaGrg1/slack-clone/internal/db"
	"github.com/KrishnaGrg1/slack-clone/internal/dsa"
	"github.com/redis/go-redis/v9"
)

const channel = "slack:clone:checks"

// historyCapacity is the number of messages kept in memory per room.
const historyCapacity = 100

type Hub struct {
	// Registered clients grouped by room.
	rooms map[string]map[*Client]bool

	//history message
	history map[string]*dsa.RingBuffer[Message]

	users map[string]*Client // ← userID → client for signaling

	// Inbound messages from the clients.
	broadcast chan Message

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client

	signal chan SignalMsg // ← WebRTC forwarding

	redis  *redis.Client
	writer *db.DBWriter // ← add

	callManager *call.CallManager

	// historyMu guards the history map (read in GetHistory, written in Run).
	historyMu sync.RWMutex
}

func NewHub(rdb *redis.Client, writer *db.DBWriter) *Hub {

	return &Hub{
		rooms:       make(map[string]map[*Client]bool),
		history:     make(map[string]*dsa.RingBuffer[Message]),
		users:       make(map[string]*Client),
		broadcast:   make(chan Message),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		signal:      make(chan SignalMsg, 256),
		redis:       rdb,
		writer:      writer,
		callManager: call.NewCallManager(),
	}
}
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			// if _, ok := h.rooms[client.roomID]; !ok {
			// 	h.rooms[client.roomID] = make(map[*Client]bool)
			// }
			// h.rooms[client.roomID][client] = true
			if _, ok := h.rooms[client.roomID]; !ok {
				h.rooms[client.roomID] = make(map[*Client]bool)
			}
			h.rooms[client.roomID][client] = true
			h.users[client.senderID] = client
			log.Printf("%s joined room %s", client.senderName, client.roomID)

		case client := <-h.unregister:
			// if room, ok := h.rooms[client.roomID]; ok {
			// 	if _, exists := room[client]; exists {
			// 		delete(room, client)
			// 		close(client.send)
			// 		if len(room) == 0 {
			// 			delete(h.rooms, client.roomID)
			// 		}
			// 	}
			// }
			if room, ok := h.rooms[client.roomID]; ok {
				if _, exists := h.rooms[client.roomID][client]; exists {
					delete(room, client)
					close(client.send)
					if len(room) == 0 {
						delete(h.rooms, client.roomID)
					}
				}
			}
			delete(h.users, client.senderID)
		case message := <-h.broadcast:
			room, ok := h.rooms[message.RoomID]
			if !ok {
				continue
			}

			// push to ring buffer
			h.historyMu.Lock()
			buf, ok := h.history[message.RoomID]
			if !ok {
				buf = dsa.NewRingBuffer[Message](historyCapacity)
				h.history[message.RoomID] = buf
			}
			h.historyMu.Unlock()
			buf.Push(message)

			payload, err := json.Marshal(message)
			if err != nil {
				continue
			}

			// fan out to clients
			for client := range room {
				select {
				case client.send <- payload:
				default:
					close(client.send)
					delete(room, client)
					if len(room) == 0 {
						delete(h.rooms, message.RoomID)
					}
				}
			}

			// async DB write — after fan-out so latency is not affected
			h.writer.Enqueue(db.WriteJob{
				ChannelID: message.RoomID,
				SenderID:  message.SenderID,
				Content:   message.Content,
				ParentID:  message.ParentID, // add ParentID to Message struct too
			})

		case sig := <-h.signal:
			// forward to target peer — Go never reads the SDP/ICE content
			if target, ok := h.users[sig.TargetUserID]; ok {
				sig.FromUserID = sig.TargetUserID // fixed below
				payload, err := json.Marshal(sig)
				if err != nil {
					continue
				}
				select {
				case target.send <- payload:
				default:
				}
			}
		}

	}
}

func (h *Hub) Subscribe(ctx context.Context) {
	pubsub := h.redis.Subscribe(ctx, channel)
	defer pubsub.Close()

	log.Println("Hub subscribed to Redis")

	for {
		select {
		case <-ctx.Done():
			return
		case msg := <-pubsub.Channel():
			var message Message
			if err := json.Unmarshal([]byte(msg.Payload), &message); err != nil {
				log.Println("failed to unmarshal Redis message:", err)
				continue
			}

			h.broadcast <- message
		}
	}
}

func (h *Hub) Publish(ctx context.Context, payload any) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	return h.redis.Publish(ctx, channel, data).Err()
}

func (h *Hub) GetHistory(roomID string) []Message {
	h.historyMu.RLock()
	buf, ok := h.history[roomID]
	h.historyMu.RUnlock()
	if !ok {
		return nil
	}
	return buf.Slice()
}

// EnqueueSignal is called from readPump goroutine — thread safe
func (h *Hub) EnqueueSignal(signal SignalMsg) {
	select {
	case h.signal <- signal:
	default:
		log.Println("signal queue full, dropping")
	}
}

// NotifyRoom sends an event to everyone in a channel room
func (h *Hub) NotifyRoom(roomID string, payload []byte) {
	room, ok := h.rooms[roomID]
	if !ok {
		log.Fatalf("there is no room=%s", roomID)
		return
	}
	for client := range room {
		select {
		case client.send <- payload:
		default:
		}
	}
}

// SendToUser sends directly to one user by ID
func (h *Hub) SendToUser(userID string, payload []byte) {
	if client, ok := h.users[userID]; ok {
		select {
		case client.send <- payload:
		default:
		}
	}
}
