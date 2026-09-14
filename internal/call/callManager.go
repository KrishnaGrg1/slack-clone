package call

import (
	"sort"
	"sync"

	"github.com/google/uuid"
)

type CallManager struct {
	calls  map[string]*Call
	byRoom map[string]string
	mu     sync.Mutex // plain Mutex — most ops write
}

func NewCallManager() *CallManager {
	return &CallManager{
		calls:  make(map[string]*Call),
		byRoom: make(map[string]string),
	}
}

func (cm *CallManager) ActiveCallForRoom(roomID string) (*Call, bool) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	callID, ok := cm.byRoom[roomID]
	if !ok {
		return nil, false
	}
	call, ok := cm.calls[callID]
	return call, ok
}

func (cm *CallManager) StartCall(userID, name, roomID string) (call *Call, existing []Participant, created bool) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	// room already has a call — just join it
	if callID, ok := cm.byRoom[roomID]; ok {
		if call, ok := cm.calls[callID]; ok {
			return call, call.addAndSnapshot(userID, name), false
		}
		delete(cm.byRoom, roomID)
	}

	call = &Call{
		ID:            uuid.New().String(),
		RoomID:        roomID,
		InitiatorID:   userID,
		InitiatorName: name,
		participants: map[string]*Participant{
			userID: {ID: userID, Name: name, Audio: true, Video: true},
		},
	}
	cm.calls[call.ID] = call
	cm.byRoom[roomID] = call.ID
	return call, nil, true
}

func (cm *CallManager) JoinCall(callID, userID, name string) (call *Call, existing []Participant, ok bool) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	call, ok = cm.calls[callID]
	if !ok {
		return nil, nil, false
	}
	return call, call.addAndSnapshot(userID, name), true
}

type Departure struct {
	CallID    string
	RoomID    string
	Remaining []string
	Ended     bool
}

// removeLocked — caller must hold cm.mu
func (cm *CallManager) removeLocked(call *Call, userID string) (Departure, bool) {
	_, wasParticipant := call.participants[userID]
	if !wasParticipant {
		return Departure{}, false
	}

	delete(call.participants, userID)

	remaining := make([]string, 0, len(call.participants))
	for id := range call.participants {
		remaining = append(remaining, id)
	}
	sort.Strings(remaining)

	ended := len(remaining) == 0
	if ended {
		delete(cm.calls, call.ID)
		if id, ok := cm.byRoom[call.RoomID]; ok && id == call.ID {
			delete(cm.byRoom, call.RoomID)
		}
	}

	return Departure{
		CallID:    call.ID,
		RoomID:    call.RoomID,
		Remaining: remaining,
		Ended:     ended,
	}, true
}

func (cm *CallManager) LeaveCall(userID, callID string) (Departure, bool) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	call, ok := cm.calls[callID]
	if !ok {
		return Departure{}, false
	}
	return cm.removeLocked(call, userID)
}

func (cm *CallManager) LeaveAllCalls(userID, roomID string) (Departure, bool) {
	cm.mu.Lock()
	defer cm.mu.Unlock()
	callID, ok := cm.byRoom[roomID]
	if !ok {
		return Departure{}, false
	}
	call, ok := cm.calls[callID]
	if !ok {
		return Departure{}, false
	}
	return cm.removeLocked(call, userID)
}
