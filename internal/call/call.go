package call

import (
	"sort"
	"sync"
)

type Participant struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Audio  bool   `json:"audio"`
	Video  bool   `json:"video"`
	Screen bool   `json:"screen"`
}

type Call struct {
	ID            string
	channelID     string
	InitiatorID   string
	InitiatorName string
	participants  map[string]*Participant
	mu            sync.RWMutex
}

// Participants returns a stable sorted snapshot — safe for concurrent reads
func (c *Call) Participants() []Participant {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.snapshotLocked()
}

func (c *Call) snapshotLocked() []Participant {
	out := make([]Participant, 0, len(c.participants))
	for _, p := range c.participants {
		out = append(out, *p)
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i].ID < out[j].ID
	})
	return out
}

func (c *Call) ParticipantIDs() []string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	ids := make([]string, 0, len(c.participants))
	for id := range c.participants {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids
}

// addAndSnapshot adds userID and returns the roster as it was BEFORE insert.
// Existing peers use this list to know who to send WebRTC offers to.
func (c *Call) addAndSnapshot(userID, name string) []Participant {
	c.mu.Lock()
	defer c.mu.Unlock()

	// snapshot before adding
	before := make([]Participant, 0, len(c.participants))
	for _, p := range c.participants {
		if p.ID == userID {
			continue // skip if already in call
		}
		before = append(before, *p)
	}

	c.participants[userID] = &Participant{
		ID:    userID,
		Name:  name,
		Audio: true,
		Video: true,
	}
	return before
}
