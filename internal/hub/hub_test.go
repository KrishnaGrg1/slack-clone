package hub

import (
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
)

func startHub(t *testing.T) *Hub {
	t.Helper()

	h := NewHub(redis.NewClient(&redis.Options{
		Addr: "redis://localhost:6379",
	}))
	go h.Run()

	return h
}

func TestNewHub(t *testing.T) {
	h := NewHub(redis.NewClient(&redis.Options{
		Addr: "redis://localhost:6379",
	}))

	if h == nil {
		t.Fatal("expected hub to be initialized")
	}
	if h.rooms == nil {
		t.Fatal("expected rooms map to be initialized")
	}
	if h.broadcast == nil {
		t.Fatal("expected broadcast channel to be initialized")
	}
	if h.register == nil {
		t.Fatal("expected register channel to be initialized")
	}
	if h.unregister == nil {
		t.Fatal("expected unregister channel to be initialized")
	}
}

func TestHubRunBroadcastsJSONToRegisteredClient(t *testing.T) {
	h := startHub(t)
	client := &Client{roomID: "room-1", send: make(chan []byte, 1)}

	h.register <- client
	waitForRoomClientRegistered(t, h, client)
	h.broadcast <- Message{SenderID: "alice", Content: "hello"}

	select {
	case message := <-client.send:
		got := string(message)
		want := `{"sender_id":"alice","content":"hello"}`
		if got != want {
			t.Fatalf("unexpected broadcast payload: got %s want %s", got, want)
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for broadcast payload")
	}
}

func TestHubRunUnregisterClosesClientChannel(t *testing.T) {
	h := startHub(t)
	client := &Client{roomID: "room-1", send: make(chan []byte, 1)}

	h.register <- client
	waitForRoomClientRegistered(t, h, client)
	h.unregister <- client

	select {
	case _, ok := <-client.send:
		if ok {
			t.Fatal("expected client send channel to be closed")
		}
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for client channel to close")
	}

	if _, ok := h.rooms[client.roomID][client]; ok {
		t.Fatal("expected client to be removed from room")
	}
}

func TestHubRunDropsSlowClient(t *testing.T) {
	h := startHub(t)
	client := &Client{roomID: "room-1", send: make(chan []byte, 1)}

	h.register <- client
	waitForRoomClientRegistered(t, h, client)
	client.send <- []byte("queued")
	h.broadcast <- Message{SenderID: "alice", Content: "slow"}

	if !waitForRoomClientRemoval(t, h, client) {
		t.Fatal("timed out waiting for slow client to be removed")
	}
	if room, ok := h.rooms[client.roomID]; ok {
		if _, exists := room[client]; exists {
			t.Fatal("expected slow client to be removed from room")
		}
	}
}

func waitForRoomClientRegistered(t *testing.T, h *Hub, client *Client) {
	t.Helper()

	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		if room, ok := h.rooms[client.roomID]; ok {
			if _, exists := room[client]; exists {
				return
			}
		}
		time.Sleep(time.Millisecond)
	}

	t.Fatal("timed out waiting for client to register")
}

func waitForRoomClientRemoval(t *testing.T, h *Hub, client *Client) bool {
	t.Helper()

	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		if room, ok := h.rooms[client.roomID]; !ok {
			return true
		} else if _, exists := room[client]; !exists {
			return true
		}
		time.Sleep(time.Millisecond)
	}

	return false
}
