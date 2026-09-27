# Integrate `workspace/$slug/**` with the real backend (de-mock chat)

## Context

The `workspace/$slug/**` route tree currently renders **mock** messages/calls
(`components/dashboard/mock`) even though channels, members and the channel
header already come from the real API. The goal is to replace all mock data
with live data: real message history over REST, real-time send/receive over the
existing WebSocket hub, plus create/join channel wiring. Design constraint from
the user: **shadcn/ui components only, existing color tokens, and the
`Typography` component for every piece of text.**

The blocker is WebSocket auth. Messages can be created **only** over WS
(`internal/hub` — there is no REST create-message endpoint). `/ws` is behind
`middleware.Auth`, and `extractTokenFromHeader` (`internal/middleware/auth.go`)
reads only a `token` cookie or `Authorization: Bearer` header — a browser
`WebSocket` can send neither to `:8080`. The JWT is stored in the httpOnly
`app-session` cookie (`utils/session.server.ts`), readable only server-side via
`getAuthHeader()`. Resolution: expose the token to the client with a
`createServerFn`, connect with `?token=<jwt>`, and add a small query-param
fallback to `extractTokenFromHeader`.

## Scope

- **In:** real message history, realtime send/receive (WS), typing, channel
  header/members, sidebar channel switching, create-channel, join/leave, thread
  replies. Route structure moves to a `$slug` layout + `channel/$id` view
  (matches the in-progress git changes).
- **Deferred (outlined, not built now):** WebRTC calls (`use-call.ts`,
  `CallOverlay` wiring) — large surface; recommended as a follow-up phase.
- **Excluded:** DM (`dm/$userId`) — no backend endpoints exist for it yet.

## Backend change (1 file, ~3 lines)

`internal/middleware/auth.go` — in `extractTokenFromHeader`, add a query-param
fallback so browser sockets can authenticate:

```go
// after the cookie check, before/after the Authorization header check
if q := r.URL.Query().Get("token"); q != "" {
    return q
}
```

This is the only backend edit. `ServeWs` already reads `?room_id=` and the
`CheckOrigin` allows all origins in dev, so no other change is needed.

## Frontend changes

### A. Dependency
- `bun add zustand` (the user's checklist calls for Zustand stores; not yet
  installed).

### B. Expose the socket token — new `src/lib/services/socket.service.ts`
- `getSocketToken = createServerFn({ method: 'GET' }).handler(async () => (await useAppSession()).data?.token ?? null)`.
  Returns the JWT to the client so it can build the WS URL. Reuses
  `useAppSession()` from `utils/session.server.ts`.

### C. Types — `src/lib/types/channel.type.ts`
- Fix `GetChannelMessageResponse.data` to the real shape
  `{ messages: RawMessage[]; source: 'cache' | 'db' }`.
- Add `RawMessage` union: **cache** shape (`hub.Message`:
  `{ type, sender_id, room_id, content, parent_id }` — no id/time/username) and
  **db** shape (`GetChannelMessagesRow`: `id, channel_id, sender_id, content,
  parent_id, msg_type, created_at, edited_at, sender_username, sender_avatar`).
- Add a normalized `ChatMessage` view model:
  `{ id, sender_id, content, parent_id, created_at, sender_username, sender_avatar }`.
- Add WS frame types: outbound-from-server (`message.new` chat vs `call.*`,
  `typing`, `presence`, `error`) and inbound-from-client (`message.send`,
  `typing.start`, later `call.*`).

### D. Services + schema fixes — `src/lib/services/channel.service.ts`, `src/lib/schema/channel.schema.ts`
- `getChannelMessage`: **fix path** to
  `/workspaces/${workspace_id}/channels/${id}/messages`, add
  `getAuthHeader()`, support optional `before` (RFC3339) query for pagination.
  Add `workspace_id` to `GetChannelMessageSchema`.
- Add `getThread`: `GET /workspaces/${workspace_id}/messages/${id}/thread` with
  `getAuthHeader()`; add `GetThreadSchema`.
- Add `getAuthHeader()` to `createChannel`, `joinChannel`, `leaveChannel`
  (currently missing → unauthenticated).
- Remove the `console.log('blah blah', ...)` lines in `getChannelByID`.

### E. Hooks
- `src/hooks/use-channel.ts`: add `useJoinChannel`, `useLeaveChannel`; make
  `useCreateChannel` invalidate `['workspace-channel', workspace_id]` and accept
  an `onCreated` callback (navigate to new channel / close dialog).
- `src/hooks/use-messages.ts` (**new**): `useGetMessages(workspace_id, channel_id)`
  (query key `['messages', channel_id]`, normalizes `RawMessage[] → ChatMessage[]`,
  resolving username/avatar from the members map for cache rows) and
  `useGetThread(workspace_id, parent_id)`.

### F. Zustand stores — `src/stores/`
- `websocket.store.ts` (**new**): singleton `WebSocket` + status;
  `connect(channelId, token)`, `disconnect()`, `send(frame)`. On message, parse
  and route: `message.new` **with `content`** → chat (`chat.store.appendMessage`);
  `message.new` **with `call_id`** → incoming-call (Phase 7); `typing` →
  `chat.store.setTyping`; `call.*`/`rtc.*` → call handlers (Phase 7).
  Reconnect with backoff; the server drives ping, browser auto-pongs.
- `chat.store.ts` (**new**): `messagesByChannel`, `threadsByParent`,
  `membersById`, `typingByChannel`; actions `setMessages`, `appendMessage`,
  `setMembers`, `setTyping`. `appendMessage` synthesizes `id`
  (`crypto.randomUUID()`) and `created_at` (`Date.now()`) for WS frames, resolves
  `sender_username`/`sender_avatar` from `membersById`, and **routes by
  `parent_id`**: empty → channel list, set → `threadsByParent` (thread replies
  broadcast to the whole room, so they must be filtered out of the main list).

### G. Routing refactor + layout
Aligns with the in-progress git move (old `workspace/channel/**` deleted, new
`workspace/$slug/channel/` added).
- `src/routes/workspace/$slug/route.tsx` (**new layout**): move the
  `getWorkspaceBySlug` loader here (expose via `getRouteApi('/workspace/$slug')`),
  fetch channels, seed `chat.store.membersById` from `workspace.data.members`,
  render `<Sidebar/>` + `<Outlet/>`. Channel select → navigate to
  `/workspace/$slug/channel/$id`. Keep `WorkspaceNotFound` error/notFound
  components.
- `src/routes/workspace/$slug/index.tsx`: reduce to redirect-to-first-channel
  (or an `Empty` state + create-channel CTA when there are no channels). Remove
  all mock imports and the unsafe `channels?.data[0].id!` access.

### H. Chat view — `src/routes/workspace/$slug/channel/$id/index.tsx`
- Seed `chat.store` from `useGetMessages`; connect `websocket.store` to
  `room_id=$id` using `getSocketToken` (connect on mount / channel change,
  disconnect on unmount). Render the merged `ChatMessage[]` (parent-less only).
- Compose with shadcn primitives already present: `MessageGroup/Message/
  MessageAvatar/MessageContent/MessageHeader/MessageFooter`
  (`components/ui/message.tsx`), `ScrollArea`, `Textarea`, `Button`, `Avatar`,
  `Tooltip`, `Empty`, `Spinner`/`Skeleton`, and `Typography` for all text.
- Input: Enter (no Shift) → `ws.send({ type:'message.send', content })`, clear;
  fire `typing.start` (throttled). **No optimistic append** — the hub echoes the
  sender's own message back, and the echo carries no id to reconcile against, so
  rendering from the echo (instant on localhost) avoids duplicates. (Note this;
  optimistic+reconcile is a later enhancement.)
- Header: channel name + member avatars via `useGetChannel` (reuse existing).

### I. Thread panel — `src/routes/workspace/$slug/channel/$id/thread/$threadID/index.tsx`
- Load parent + replies via `useGetThread`; render from
  `chat.store.threadsByParent[$threadID]`. Reply input sends
  `message.send` with `parent_id=$threadID`.

### J. Create-channel dialog
- Wire the sidebar `+` button (`components/dashboard/sidebar.tsx`) to a shadcn
  `Dialog` containing a TanStack Form (name + `channel_type` select:
  public/private — backend `CreateChannel` requires it and auto-joins creator),
  submitting via `useCreateChannel`. On success invalidate channels + navigate to
  the new channel.

## Deferred — Calls (Phase 7 outline)
`src/hooks/use-call.ts` (WebRTC: `getUserMedia`, one `RTCPeerConnection` per
peer, signaling via WS `rtc.offer/answer/ice` + `call.start/join/leave`,
consuming `OutboundCallEvent` frames from `websocket.store`) and wiring
`components/call/CallOverlay.tsx` to real streams/peers. Recommend building after
chat core is verified.

## Design constraints (apply throughout)
- shadcn/ui components only; keep the existing `--tc-*` color tokens / hex values
  already used in these files.
- Every text node uses `<Typography variant=... />` (`components/ui/typography.tsx`).
- Package manager is **bun**. Aliases `#/*` and `@/` both map to `./src/*`.

## Key gotchas (call out during implementation)
- `message.new` is overloaded (chat vs incoming call) — branch on `call_id`.
- Cache-sourced history lacks id/timestamp/username — normalize + resolve from
  `membersById`; treat `sender_avatar` (nullable) with a fallback.
- Thread replies broadcast to the whole room — filter by `parent_id`.
- `room_id` for the socket **must equal the channel UUID** (the hub keys history
  and rooms by it, and `GetMessages` reads the cache by the same id).
- Confirm `GetChannelMessages` ordering (likely `created_at DESC`) and reverse
  for chronological display.

## Verification (end-to-end)
1. Backend: `go run ./cmd` (needs Postgres + Redis per `config.Load()`).
2. Frontend: `bun run dev`; ensure `.env` `VITE_API_URL=http://localhost:8080/api/v1`
   and `SESSION_SECRET` set.
3. Log in, open a workspace, select a channel → history loads (no mock).
4. Two browsers/users in the same channel: a message sent in one appears live in
   the other and echoes back to the sender exactly once (no duplicate).
5. Create a channel from the sidebar `+` → it appears and is navigable.
6. Open a thread, post a reply → shows in the thread, not the main list.
7. Reload with recent activity (cache source) and after inactivity (db source) →
   both render with correct sender name/avatar.
8. Confirm WS auth: connecting without `?token=` is rejected; with it, succeeds.
