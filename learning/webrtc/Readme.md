# WebRTC Signaling with Go

## Overview

Your Go server acts as a **post office for signaling**. It never touches the actual video/audio streams — it only helps two browsers exchange connection metadata so they can talk directly to each other (peer-to-peer).

- **Signaling**: small metadata messages (offers, answers, ICE candidates) routed through Go
- **Media**: actual audio/video flows directly browser-to-browser, bypassing Go entirely

---

## The Big Picture

```
Browser A wants to call Browser B
  → A sends offer to Go server
  → Go looks at "deliver to: B"
  → Go delivers to B's mailbox
  → B reads offer, writes answer
  → B sends answer back through Go
  → Now A and B talk directly — Go steps out
```

> The entire signaling job: read the address, deliver the letter. Never open it.

---

## The Three Phases

### Phase 1 — Call Lifecycle (Who is in the call)

Room management, similar to your existing chat rooms but keyed by `callID` instead of `channelID`.

| Action | Message | Server Response |
|--------|---------|-----------------|
| A starts call | `{ type: "call.start", channel_id, thread_id }` | Creates `CallRoom`, notifies channel, returns `call_id` to A |
| B joins | `{ type: "call.join", call_id: "xyz" }` | Adds B to room, notifies peers |
| User leaves | `{ type: "call.leave", call_id: "xyz" }` | Removes user, notifies remaining peers |
| Room empty | — | Deletes the `CallRoom` |

The `CallRoom` is just a `map[userID]*Client`. Same concept as your chat room, different key.

---

### Phase 2 — WebRTC Handshake (How browsers find each other)

Three exchanges happen through the Go server:

#### Offer
- B joined, A introduces itself
- A creates SDP offer (browser does this automatically)
- A → Go: `{ type: "rtc.offer", target_user_id: "B", sdp: "..." }`
- Go looks up `h.users["B"]`, delivers directly to B

#### Answer
- B replies to A's introduction
- B creates SDP answer (browser does this automatically)
- B → Go: `{ type: "rtc.answer", target_user_id: "A", sdp: "..." }`
- Go looks up `h.users["A"]`, delivers directly to A

#### ICE Candidates
- Both browsers share all possible network paths
- Each candidate is a potential route: local IP, public IP (via STUN), or TURN relay
- Forwarded through Go with the same pattern:
  - A → Go → B: `{ type: "rtc.ice", target_user_id: "B", candidate: {...} }`
  - B → Go → A: `{ type: "rtc.ice", target_user_id: "A", candidate: {...} }`

Browsers try all combinations. Once a path works, P2P is established and Go steps out completely.

---

### Phase 3 — P2P Media (Go not involved)

Audio and video flow directly between browsers.
- Go server sees none of it
- Server bandwidth cost: **zero**

---

## The Critical Rule — Who Sends the Offer

This is the hardest part and the source of most WebRTC bugs.

### Wrong
- Both sides try to offer simultaneously
- Collision: each rejects the other's offer
- Call fails silently

### Correct
- **Joiner always offers**, existing peers always answer
- B joins → Go tells B: "A is already here", tells A: "B just joined"
- B creates offer → A creates answer
- One direction, no collision

Your Go server enforces this via message routing:

| Recipient | Server Message | Action |
|-----------|---------------|--------|
| Joiner (B) | `call.joined` → list of existing peers | B knows to send offers to each |
| Existing peer (A) | `call.peer_joined` → user_id of joiner | A waits for offer, does NOT initiate |

---

## The Users Map — Why It Exists

Your existing chat rooms map is `roomID → set of clients`. That works for broadcasting.

Signaling needs to find **one specific person** by their userID:

```
A wants to send offer to B
  → A sends: { target_user_id: "b-uuid", sdp: "..." }
  → Go needs to find B's connection instantly
```

| Approach | Lookup |
|----------|--------|
| Without users map | Loop through all rooms → O(n), complex |
| With users map | `h.users["b-uuid"]` → O(1) |

Maintain **two maps** in `Hub`:

```go
h.rooms["channel-id"] = { clientA, clientB }  // chat broadcast
h.users["user-id"]    = clientA               // targeted signaling
```

Both updated on register and unregister.

---

## The Signal Channel

Your broadcast channel exists for chat. Signaling needs its own channel because:

| Channel | Purpose |
|---------|---------|
| `broadcast` | Send to everyone in a room |
| `signal` | Send to one specific person |

Separating them keeps the Hub logic clean. The signal channel is **buffered (256)** so `readPump` never blocks when enqueuing a signal. Hub drains it in its `select` loop and delivers to the target.

---

## ICE Config Endpoint

The browser needs STUN/TURN server addresses before making a call.

```
Browser:  GET /api/v1/ice-config
Go:       Returns STUN servers + time-limited TURN credentials
Browser:  new RTCPeerConnection({ iceServers: [...] })
```

- **STUN**: free, uses Google's public STUN
- **TURN**: self-hosted with `coturn`; credentials are HMAC-signed and expire after 24 hours

---

## Complete Flow

```
Krishna opens thread, clicks "start call"
  ↓
WS: { type: "call.start", channel_id, thread_id }
  ↓
Go creates CallRoom "xyz", adds Krishna
  ↓
Go → all members: { type: "call.incoming", call_id: "xyz" }
Go → Krishna:   { type: "call.started", call_id: "xyz" }

Rohan sees notification, clicks "join"
  ↓
WS: { type: "call.join", call_id: "xyz" }
  ↓
Go → Rohan:    { type: "call.joined", existing_peers: ["krishna"] }
Go → Krishna:  { type: "call.peer_joined", user_id: "rohan" }
Go adds Rohan to CallRoom
  ↓
Rohan creates SDP offer → sends to Krishna through Go
  ↓
Krishna creates SDP answer → sends to Rohan through Go
  ↓
Both exchange ICE candidates through Go
  ↓
P2P connection established
Krishna ←────────────────→ Rohan
        video/audio direct
Go steps out of media path completely

Rohan hangs up
  ↓
WS: { type: "call.leave", call_id: "xyz" }
  ↓
Go removes Rohan from CallRoom
Go → Krishna: { type: "call.peer_left", user_id: "rohan" }
Krishna leaves → CallRoom empty → deleted
```

---

## What to Build

Work through these in order:

1. **CallRoom struct** — struct with `peers` map and methods: `Add`, `Remove`, `IsEmpty`, `PeerIDs`. Nothing complex.

2. **Expand message types** — add constants for all type strings. Add new structs: `SignalMsg` (for `rtc.*`), `CallEvent` (for `call.*`), `InboundCallMsg` (for `call.start/join/leave`).

3. **Expand Hub** — add `callRooms map[string]*CallRoom`, `users map[string]*Client`, and `signal chan SignalMsg`. Update `register`/`unregister` to maintain `users` map. Add `HandleCallStart`, `HandleCallJoin`, `HandleCallLeave`, `handleSignal` methods. Add `EnqueueSignal` for `readPump` to call.

4. **Update readPump** — instead of always parsing as a chat `Message`, first peek at the `type` field. Route to the correct handler.

5. **ICE config handler** — one `GET /api/v1/ice-config` endpoint returning STUN servers + HMAC-signed TURN credentials.

6. **Wire config and router** — add `TURN_SECRET` and `TURN_HOST` to config, register the ICE endpoint.
