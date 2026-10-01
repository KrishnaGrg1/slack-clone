import { useState } from 'react'
import { cn } from '#/lib/utils'
import { Button } from '#/components/ui/button'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Users,
  MoreHorizontal,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface CallPeer {
  id: string
  name: string
  avatar: string
  audioOn: boolean
  videoOn: boolean
  isLocal?: boolean
}

const PEERS: CallPeer[] = [
  {
    id: '1',
    name: 'krishna',
    avatar: 'K',
    audioOn: true,
    videoOn: false,
    isLocal: true,
  },
  { id: '2', name: 'rohan', avatar: 'R', audioOn: true, videoOn: false },
]

// ── Peer tile ──────────────────────────────────────────────────────────────

function PeerTile({ peer }: { peer: CallPeer }) {
  const avatarColors: Record<string, string> = {
    K: 'bg-[#E8A838] text-[#0A0A0F]',
    R: 'bg-[#1D9E75] text-[#0A0A0F]',
    S: 'bg-[#7F77DD] text-white',
  }

  return (
    <div
      className={cn(
        'relative flex-1 min-w-0 rounded-xl overflow-hidden',
        'bg-[#111118] border border-[#2A2A3A]',
        peer.isLocal && 'ring-1 ring-[#E8A838]/30',
      )}
    >
      {/* video placeholder */}
      <div className="w-full h-full min-h-48 flex items-center justify-center">
        <div
          className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold',
            avatarColors[peer.avatar] ?? 'bg-[#2A2A3A] text-[#F5F0E8]',
          )}
        >
          {peer.avatar}
        </div>
      </div>

      {/* name badge */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-[#0A0A0F]/80 backdrop-blur-sm px-2 py-1 rounded-md">
        {!peer.audioOn && <MicOff className="w-3 h-3 text-[#E05555]" />}
        <span className="text-[11px] font-medium text-[#F5F0E8]">
          {peer.name}
          {peer.isLocal ? ' (you)' : ''}
        </span>
      </div>

      {peer.isLocal && (
        <div className="absolute top-2 right-2 bg-[#E8A838]/20 border border-[#E8A838]/30 rounded px-1.5 py-0.5">
          <span className="text-[9px] font-semibold text-[#E8A838] uppercase tracking-wider">
            You
          </span>
        </div>
      )}
    </div>
  )
}

// ── Call overlay ───────────────────────────────────────────────────────────

export default function CallOverlay({ onEnd }: { onEnd: () => void }) {
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(false)
  const [screenOn, setScreenOn] = useState(false)
  const [duration, setDuration] = useState('0:34')

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0F] flex flex-col">
      {/* header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A3A] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#1D9E75] animate-pulse" />
            <span className="text-sm font-semibold text-[#F5F0E8]">
              Thread call
            </span>
          </div>
          <span className="text-xs text-[#4A4860]">
            · #backend · {duration}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#4A4860]">
            {PEERS.length} participants
          </span>
          <button className="p-1.5 rounded-md text-[#4A4860] hover:text-[#F5F0E8] hover:bg-[#2A2A3A] transition-colors">
            <Users className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-md text-[#4A4860] hover:text-[#F5F0E8] hover:bg-[#2A2A3A] transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* thread context pill */}
      <div className="px-6 pt-3 shrink-0">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#16161F] border border-[#2A2A3A] rounded-full">
          <span className="text-[10px] text-[#4A4860]">
            Started from thread:
          </span>
          <span className="text-[11px] text-[#C8C4BE] font-medium">
            "should we migrate session storage to Redis?"
          </span>
        </div>
      </div>

      {/* peer grid */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl flex gap-4">
          {PEERS.map((peer) => (
            <PeerTile key={peer.id} peer={peer} />
          ))}
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center justify-center gap-3 pb-8 shrink-0">
        <Button
          onClick={() => setMicOn((v) => !v)}
          variant="ghost"
          className={cn(
            'w-12 h-12 rounded-full p-0 transition-all duration-200',
            micOn
              ? 'bg-[#2A2A3A] text-[#F5F0E8] hover:bg-[#3A3A4A]'
              : 'bg-[#E05555]/20 text-[#E05555] hover:bg-[#E05555]/30',
          )}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        <Button
          onClick={() => setCamOn((v) => !v)}
          variant="ghost"
          className={cn(
            'w-12 h-12 rounded-full p-0 transition-all duration-200',
            camOn
              ? 'bg-[#2A2A3A] text-[#F5F0E8] hover:bg-[#3A3A4A]'
              : 'bg-[#2A2A3A] text-[#7A7890] hover:text-[#F5F0E8]',
          )}
        >
          {camOn ? (
            <Video className="w-5 h-5" />
          ) : (
            <VideoOff className="w-5 h-5" />
          )}
        </Button>

        <Button
          onClick={() => setScreenOn((v) => !v)}
          variant="ghost"
          className={cn(
            'w-12 h-12 rounded-full p-0 transition-all duration-200',
            screenOn
              ? 'bg-[#E8A838]/20 text-[#E8A838] hover:bg-[#E8A838]/30'
              : 'bg-[#2A2A3A] text-[#7A7890] hover:text-[#F5F0E8]',
          )}
        >
          <Monitor className="w-5 h-5" />
        </Button>

        {/* end call */}
        <Button
          onClick={onEnd}
          className="w-14 h-12 rounded-full bg-[#E05555] hover:bg-[#E05555]/80 text-white p-0 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <PhoneOff className="w-5 h-5" />
        </Button>
      </div>

      {/* summary generating notice */}
      <div className="flex items-center justify-center pb-6 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#E8A838]/06 border border-[#E8A838]/15 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-[#E8A838] animate-pulse" />
          <span className="text-[10px] text-[#E8A838]">
            AI summary will post to thread when call ends
          </span>
        </div>
      </div>
    </div>
  )
}
