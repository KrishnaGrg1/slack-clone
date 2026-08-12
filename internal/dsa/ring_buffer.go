package dsa

import "sync"

type RingBuffer[T any] struct {
	buf  []T
	head int
	size int
	cap  int
	mu   sync.RWMutex
}

func NewRingBuffer[T any](capacity int) *RingBuffer[T] {
	return &RingBuffer[T]{
		buf: make([]T, capacity),
		cap: capacity,
	}
}

func (r *RingBuffer[T]) Push(item T) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.buf[r.head%r.cap] = item
	r.head++
	if r.size < r.cap {
		r.size++
	}
}

// Slice returns items in chronological order (oldest first)
func (r *RingBuffer[T]) Slice() []T {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if r.size == 0 {
		return nil
	}

	result := make([]T, r.size)
	start := (r.head - r.size + r.cap*2) % r.cap
	for i := 0; i < r.size; i++ {
		result[i] = r.buf[(start+i)%r.cap]
	}
	return result
}
