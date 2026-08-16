# Project Roadmap

A Slack-like messaging platform with WebRTC calling, AI summaries, and DSA-powered features. Built with Go, PostgreSQL, Redis, and WebSockets.

---

## Phase 1 — Foundation ✅ Complete

| # | Milestone | Details |
|---|-----------|---------|
| 1 | Docker Compose | Dev environment with Postgres, Redis, and app services |
| 2 | Migrations | SQL schema for users, channels, messages, threads |
| 3 | JWT auth | Register + login endpoints with signed tokens |
| 4 | JWT middleware | Protected route guard for authenticated requests |
| 5 | Channel CRUD | Create, read, update, delete channels |
| 6 | Message endpoints | `GET` message history with pagination |
| 7 | Async DB writer | Messages buffered via WebSocket, persisted to Postgres asynchronously |
| 8 | Multi-room Hub | WebSocket hub broadcasting messages per room (channel-scoped) |

---

## Phase 2 — WebRTC Calling ⬜ Next

Add peer-to-peer audio/video calling to threads.

| # | Milestone | Details |
|---|-----------|---------|
| 1 | `GET /api/v1/ice-config` | Return STUN/TURN server config + short-lived HMAC-signed credentials |
| 2 | `CallRoom` in Hub | Per-call participant map (`callID → userID → client`) |
| 3 | Call lifecycle handlers | `call.start`, `call.join`, `call.leave` for room creation, join, teardown |
| 4 | Signal relay | Forward `rtc.offer`, `rtc.answer`, and `rtc.ice` between targeted peers |

### Notes
- Go only forwards signaling metadata; media flows browser-to-browser.
- Joiner always offers, existing peer always answers (avoids offer collision).
- See `learning/webrtc/Readme.md` for the full protocol breakdown.

---

## Phase 3 — AI Call Summaries ⬜ Planned

Transcribe calls and post summaries as thread messages.

| # | Milestone | Details |
|---|-----------|---------|
| 1 | `POST /api/v1/calls/:id/recording` | Accept call recording upload |
| 2 | Whisper transcription | Convert audio to text |
| 3 | GPT-4o summarization | Generate structured summary (key points, action items) |
| 4 | Thread insert | Post summary as a message in the originating thread |

---

## Phase 4 — Presence & Reconnect ⬜ Planned

Real-time presence and offline message catch-up.

| # | Milestone | Details |
|---|-----------|---------|
| 1 | Redis heartbeat | `SETEX` presence keys with TTL; expire on disconnect |
| 2 | `lastSeenMsgID` catch-up | On reconnect, send missed messages from last acknowledged ID |
| 3 | Rate limiting | Per-user WebSocket message rate limits to prevent abuse |

---

## Phase 5 — DSA Features ⬜ Planned

Data structures and search features powering the client experience.

| # | Milestone | Details |
|---|-----------|---------|
| 1 | Min-heap on reconnect | Priority queue for batched catch-up messages (most recent first) |
| 2 | Trie autocomplete | In-memory prefix tree for `/search` suggestions |
| 3 | PostgreSQL FTS | Full-text search index for message content |

---

## Phase 6 — Deploy ⬜ Planned

Production-ready infrastructure.

| # | Milestone | Details |
|---|-----------|---------|
| 1 | Redis pub/sub | Multi-instance Hub coordination across processes |
| 2 | GitHub Actions | CI pipeline: lint, test, build, deploy |
| 3 | DigitalOcean + Caddy | App droplet with Caddy reverse proxy + TLS |
