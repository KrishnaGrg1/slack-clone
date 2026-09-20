// ── Data ─────────────────────────────────────────────────────────────────────

export const BENEFITS: BenefitItem[] = [
  {
    icon: '🧵',
    title: 'Calls that know their context',
    body: 'Every call is born from a thread and returns to it. No disconnected Zoom rooms. No copy-pasting links. The context travels with you.',
  },
  {
    icon: '✦',
    title: "AI summaries you don't write",
    body: 'When the call ends, Whisper transcribes and GPT-4o extracts decisions and action items with owners. Posted to the thread in under 15 seconds.',
  },
  {
    icon: '⚡',
    title: 'Real-time at any scale',
    body: 'Go handles 10,000+ concurrent WebSocket connections on a single binary. Sub-100ms message delivery. Redis pub/sub for horizontal scaling.',
  },
  {
    icon: '🔍',
    title: 'Searchable decisions',
    body: 'Every decision is a structured message in the thread. Full-text search across all channels. Find what was decided six months ago in seconds.',
  },
  {
    icon: '🔒',
    title: 'Private by design',
    body: 'WebRTC P2P — audio and video never touch our servers. Audio is deleted after transcription. You own your data.',
  },
  {
    icon: '🛠',
    title: 'Open source Go backend',
    body: 'Self-host the entire stack. PostgreSQL, Redis, coturn. Docker Compose gets you running in under 5 minutes. MIT licensed.',
  },
]

export const HOW_STEPS: HowStep[] = [
  {
    icon: '📩',
    title: 'Start from the thread',
    body: 'Click the call icon on any message. Everyone in that thread gets an in-app notification — no link to paste, no app to open.',
  },
  {
    icon: '📞',
    title: 'Talk like normal',
    body: 'WebRTC P2P video and audio, right in the browser. Camera, mic, screen share. The call badge appears inside the thread while you speak.',
  },
  {
    icon: '✦',
    title: 'Summary appears automatically',
    body: 'When the last person leaves, the AI summary posts to the thread within 15 seconds. Decisions, action items with owners, key points. Done.',
  },
]

export const TECH_CARDS: TechCard[] = [
  {
    tag: 'Concurrency',
    title: 'Hub pattern in Go',
    body: 'One goroutine owns all room state. No locks on the hot path. 10,000+ concurrent WebSocket connections on a single binary with 2KB goroutine stacks.',
    code: 'rooms: map[roomID]map[*Client]bool\nbroadcast: chan Message',
  },
  {
    tag: 'Data structures',
    title: 'DSA in production',
    body: 'Ring buffer for O(1) message history per channel. Min-heap for timestamp ordering on reconnect. Trie for O(k) @mention autocomplete.',
    code: 'RingBuffer[T any] — cap 50\nMessageHeap — container/heap',
  },
  {
    tag: 'Real-time',
    title: 'WebRTC signaling',
    body: 'Go forwards SDP offers, answers, and ICE candidates between peers. Media is P2P — the Go server is never in the audio/video path.',
    code: 'rtc.offer → hub → target peer\nSTUN: stun.l.google.com',
  },
  {
    tag: 'AI pipeline',
    title: 'Async worker pool',
    body: 'Audio upload returns 202 immediately. 3 bounded goroutines drain a job channel. Whisper → GPT-4o → DB insert → WS broadcast.',
    code: 'chan AIJob (buffered: 32)\nWhisper-1 · GPT-4o · $0.01/call',
  },
]

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'Why not just use Slack Huddles?',
    a: 'Slack Huddles are attached to a channel, not a thread. They are not summarized, and nothing is posted back when they end. ThreadCall ties the call to the exact message that prompted it and posts a structured summary automatically when you hang up.',
  },
  {
    q: 'How much does the AI summary cost?',
    a: 'About $0.01 per call using Groq Whisper and GPT-4o-mini. A team of 20 people making 10 calls per day spends roughly $3 per month on AI. You bring your own OpenAI key, so you pay OpenAI directly.',
  },
  {
    q: 'Is my audio stored anywhere?',
    a: 'Audio is captured in the browser via MediaRecorder, uploaded once for transcription, and deleted from the server immediately after Whisper processes it. Video is P2P via WebRTC — it never passes through our servers at all.',
  },
  {
    q: 'Can I self-host ThreadCall?',
    a: 'Yes. ThreadCall is open source and ships with a Docker Compose file. Run postgres, redis, and the Go binary — everything is up in under 5 minutes. You bring your own OpenAI API key and a coturn TURN server for WebRTC relay.',
  },
  {
    q: 'How many people can join a thread call?',
    a: 'Up to 4 people in the MVP with P2P WebRTC mesh. For larger calls, the architecture supports swapping in an SFU like LiveKit without changing the Hub or signaling protocol. Planned for a future release.',
  },
  {
    q: 'What happens if the AI summary fails?',
    a: 'The worker retries 3 times with exponential backoff. If Whisper succeeds but GPT fails, the raw transcript is posted instead. If both fail, the call record still exists in the database — you can request a retry from the call detail view.',
  },
]
