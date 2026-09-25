import { Card, CardContent, CardHeader } from '#/components/ui/card'

export function HeroDemo() {
  return (
    <Card className="w-full max-w-xl border-[#2A2A3A] bg-[#16161F] rounded-2xl overflow-hidden text-left reveal shadow-lg">
      {/* Window chrome */}
      <CardHeader className="flex flex-row items-center gap-2 px-4 py-3 bg-[#111118] border-b border-[#2A2A3A] space-y-0">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-2 text-xs text-[#7A7890]">
          ThreadCall — #backend
        </span>
      </CardHeader>

      {/* Channel header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2A2A3A]">
        <span className="text-[#7A7890] text-sm">#</span>
        <span className="text-sm font-semibold text-[#F5F0E8]">
          backend{' '}
          <span className="text-[#7A7890] font-normal">· 3 members</span>
        </span>
      </div>

      {/* Messages */}
      <CardContent className="p-4 flex flex-col gap-3">
        {/* Message 1 */}
        <div className="flex gap-2.5 items-start">
          <div className="w-7 h-7 rounded-md bg-[#E8A838] flex items-center justify-center text-xs font-bold text-[#0A0A0F] shrink-0">
            K
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs font-semibold text-[#F5F0E8]">
                krishna
              </span>
              <span className="text-[10px] text-[#7A7890]">2:14 PM</span>
            </div>
            <p className="text-xs leading-5 text-[#C8C4BE]">
              should we use Redis or Postgres for session storage?
            </p>
          </div>
        </div>

        {/* Message 2 */}
        <div className="flex gap-2.5 items-start">
          <div className="w-7 h-7 rounded-md bg-[#1D9E75] flex items-center justify-center text-xs font-bold text-[#0A0A0F] shrink-0">
            R
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs font-semibold text-[#F5F0E8]">
                rohan
              </span>
              <span className="text-[10px] text-[#7A7890]">2:17 PM</span>
            </div>
            <p className="text-xs leading-5 text-[#C8C4BE]">
              Redis for sure — TTL is built in. quick call?
            </p>

            {/* Call badge */}
            <div className="mt-2 flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#1D9E75]/25 bg-[#1D9E75]/10">
              <div className="w-7 h-7 rounded-md bg-[#1D9E75] flex items-center justify-center text-sm shrink-0">
                📞
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1D9E75]">
                  Thread call ended
                </p>
                <p className="text-[10px] text-[#7A7890] mt-0.5">
                  krishna, rohan · 6 min 42 sec
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* AI Summary */}
      <div className="mx-4 mb-4 p-3.5 rounded-xl border border-[#E8A838]/20 bg-[#E8A838]/06">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-[#E8A838]/15 flex items-center justify-center text-[10px]">
            ✦
          </div>
          <span className="text-xs font-semibold text-[#E8A838]">
            AI Summary
          </span>
          <span className="ml-auto text-[10px] text-[#7A7890]">
            GPT-4o · just now
          </span>
        </div>

        <div className="mb-2.5">
          <p className="text-[10px] font-semibold text-[#7A7890] uppercase tracking-wider mb-1.5">
            Decision
          </p>
          <div className="flex gap-2 text-[11px] leading-4 text-[#C8C4BE]">
            <span className="text-[#E8A838] shrink-0 mt-0.5">▸</span>
            <span>
              Use Redis for sessions — TTL handles expiry automatically
            </span>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-[#7A7890] uppercase tracking-wider mb-1.5">
            Action items
          </p>
          <div className="flex gap-2 text-[11px] leading-4 text-[#C8C4BE] mb-1">
            <span className="text-[#E8A838] shrink-0 mt-0.5">▸</span>
            <span>
              <span className="text-[#E8A838] font-semibold">krishna</span> —
              implement Redis session store
            </span>
          </div>
          <div className="flex gap-2 text-[11px] leading-4 text-[#C8C4BE]">
            <span className="text-[#E8A838] shrink-0 mt-0.5">▸</span>
            <span>
              <span className="text-[#E8A838] font-semibold">rohan</span> — drop
              session migration, update sqlc queries
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
