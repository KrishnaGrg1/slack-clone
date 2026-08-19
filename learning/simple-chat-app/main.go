package main

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type Client struct {
	RoomID   string
	SenderID string
	conn     *websocket.Conn
	Hub      *Hub
	send     chan Message
}

type Message struct {
	RoomID   string `json:"room_id"`
	SenderID string `json:"sender_id"`
	Content  string `json:"content"`
}

type Hub struct {
	rooms      map[string][]*Client
	mutex      sync.Mutex
	unregister chan *Client
	register   chan *Client
	broadcast  chan Message
}

func NewHub() *Hub {
	return &Hub{
		rooms:      make(map[string][]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Message),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()

			if _, ok := h.rooms[client.RoomID]; !ok {
				h.rooms[client.RoomID] = []*Client{}
			}

			h.rooms[client.RoomID] = append(
				h.rooms[client.RoomID],
				client,
			)

			h.mutex.Unlock()

		case client := <-h.unregister:
			h.mutex.Lock()

			room := h.rooms[client.RoomID]

			for i, c := range room {
				if c == client {
					room = append(room[:i], room[i+1:]...)
					break
				}
			}

			if len(room) == 0 {
				delete(h.rooms, client.RoomID)
			} else {
				h.rooms[client.RoomID] = room
			}

			h.mutex.Unlock()

		case msg := <-h.broadcast:
			h.mutex.Lock()

			room := h.rooms[msg.RoomID]

			for _, client := range room {
				if client.SenderID == msg.SenderID {
					continue
				}

				client.send <- msg
			}

			h.mutex.Unlock()
		}
	}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (c *Client) Read() {
	defer func() {
		c.Hub.unregister <- c
	}()
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			log.Fatal(err)
			return
		}
		c.Hub.broadcast <- Message{
			SenderID: c.SenderID,
			RoomID:   c.RoomID,
			Content:  string(message),
		}
	}
}

func (c *Client) writePump() {
	defer c.conn.Close()

	for {
		select {
		case msg, ok := <-c.send:
			if !ok {
				return
			}

			if err := c.conn.WriteJSON(msg); err != nil {
				log.Println("write error:", err)
				return
			}
		}
	}
}

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	roomID, ok := r.URL.Query()["roomId"]
	if !ok {
		log.Println("roomID missing in URL Parameters")
		return
	}

	senderID, ok := r.URL.Query()["senderId"]
	if !ok {
		log.Println("senderID missing in URL Parameters")
		return
	}
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
		return
	}
	client := &Client{conn: conn, RoomID: string(roomID[0]), SenderID: senderID[0], Hub: hub, send: make(chan Message)}
	hub.register <- client
	go client.Read()
	go client.writePump()

}

func main() {
	h := NewHub()
	go h.Run()
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ServeWs(h, w, r)
	})
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
