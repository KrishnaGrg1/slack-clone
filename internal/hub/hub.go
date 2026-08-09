package hub

import (
	"context"
	"encoding/json"
	"log"

	"github.com/redis/go-redis/v9"
)

const channel = "slack:clone:checks"

type Message struct {
	SenderID string `json:"sender_id"`
	RoomID   string `json:"room_id"`
	Content  string `json:"content"`
}

type Hub struct {
	// Registered clients grouped by room.
	rooms map[string]map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan Message

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
	redis      *redis.Client
}

func NewHub(rdb *redis.Client) *Hub {

	return &Hub{
		broadcast:  make(chan Message),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		rooms:      make(map[string]map[*Client]bool),
		redis:      rdb,
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
			log.Printf("%s joined room %s", client.senderID, client.roomID)

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
		case message := <-h.broadcast:
			// When a message is received on the broadcast channel,
			// marshal it to JSON and attempt to send the payload to
			// every connected client.
			// If marshaling fails for any reason, skip sending to all
			// clients for that message (continue to next client).
			// Sending to a client's send channel is non-blocking: if the
			// client's channel is full or not receiving, fall through to
			// the default case where the client is considered dead and
			// removed.
			room, ok := h.rooms[message.RoomID] // only the target room
			if !ok {
				continue
			}
			payload, err := json.Marshal(message)
			if err != nil {
				continue
			}
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
