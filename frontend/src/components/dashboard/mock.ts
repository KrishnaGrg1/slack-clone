// ── Types ──────────────────────────────────────────────────────────────────

type MessageType = 'text' | 'call_summary'

export interface  Participant {
  id: string
  name: string
  avatar: string
  online: boolean
}

export interface  ActionItem {
  owner: string
  task: string
}

export interface  CallSummary {
  callID: string
  duration: string
  participants: string[]
  decisions: string[]
  action_items: ActionItem[]
  key_points: string[]
}

export interface  Message {
  id: string
  senderID: string
  senderName: string
  avatar: string
  content: string
  createdAt: string
  msgType: MessageType
  parentID?: string
  summary?: CallSummary
  replyCount?: number
}

export interface  Channel {
  id: string
  name: string
  unread: number
  active?: boolean
}


// ── Mock data ──────────────────────────────────────────────────────────────

export const CHANNELS: Channel[] = [
  { id: '1', name: 'general', unread: 0 },
  { id: '2', name: 'backend', unread: 3, active: true },
  { id: '3', name: 'frontend', unread: 0 },
  { id: '4', name: 'design', unread: 1 },
  { id: '5', name: 'infra', unread: 0 },
]

export const ONLINE_MEMBERS: Participant[] = [
  { id: '1', name: 'krishna', avatar: 'K', online: true },
  { id: '2', name: 'rohan', avatar: 'R', online: true },
  { id: '3', name: 'sita', avatar: 'S', online: false },
  { id: '4', name: 'amit', avatar: 'A', online: true },
]

export const MESSAGES: Message[] = [
  {
    id: '1',
    senderID: '2',
    senderName: 'rohan',
    avatar: 'R',
    content:
      'should we migrate session storage to Redis? TTL handling would be cleaner',
    createdAt: '2:14 PM',
    msgType: 'text',
    replyCount: 4,
  },
  {
    id: '2',
    senderID: '1',
    senderName: 'krishna',
    avatar: 'K',
    content: 'agreed — and we get presence for free. quick call to decide?',
    createdAt: '2:17 PM',
    msgType: 'text',
  },
  {
    id: '3',
    senderID: 'system',
    senderName: 'system',
    avatar: '',
    content: '',
    createdAt: '2:18 PM',
    msgType: 'call_summary',
    summary: {
      callID: 'call-uuid',
      duration: '6 min 42 sec',
      participants: ['krishna', 'rohan'],
      decisions: [
        'Migrate session storage to Redis',
        'Use SETEX with 30s TTL for presence keys',
      ],
      action_items: [
        {
          owner: 'krishna',
          task: 'implement Redis session store, remove Postgres fallback',
        },
        {
          owner: 'rohan',
          task: 'update sqlc queries and drop session migration',
        },
      ],
      key_points: [
        'Redis TTL handles expiry automatically — no cron job needed',
        'Presence tracking comes free with the same SETEX pattern',
      ],
    },
  },
  {
    id: '4',
    senderID: '3',
    senderName: 'sita',
    avatar: 'S',
    content:
      'nice — while you are at it, can we also add sliding window rate limiting via Redis?',
    createdAt: '2:31 PM',
    msgType: 'text',
  },
  {
    id: '5',
    senderID: '1',
    senderName: 'krishna',
    avatar: 'K',
    content: 'already on the list for Week 5 👍',
    createdAt: '2:33 PM',
    msgType: 'text',
  },
]