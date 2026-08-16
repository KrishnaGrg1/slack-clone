import { Card } from '#/components/ui/card'

export function ProblemSection() {
  const steps = {
    bad: [
      'Leave Slack, open Zoom',
      'Paste link, wait for everyone',
      'Call, decide, hang up',
      'Manually type notes back in Slack',
      'Search for that decision 3 weeks later',
    ],
    good: [
      'Click call icon in the thread',
      'Thread members notified instantly',
      'Call, decide, hang up',
      'AI posts summary automatically',
      'Decision lives in the thread forever',
    ],
  }

  return (
    <section id="problem" className="py-24 px-6 max-w-5xl mx-auto">
      <p className="text-xs font-semibold text-[#E8A838] uppercase tracking-widest mb-4 reveal">
        The gap nobody fixed
      </p>
      <h2
        className="font-display text-4xl font-light text-[#F5F0E8] tracking-tight max-w-xl mb-4 reveal"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Your best decisions disappear after every call
      </h2>
      <p className="text-sm text-[#7A7890] max-w-md mb-12 leading-6 reveal">
        Slack handles text. Zoom handles video. Nobody handles the handoff.
        Decisions made in calls evaporate unless someone remembers to write them
        down.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5 bg-[#2A2A3A] rounded-2xl overflow-hidden reveal">
        {/* Before */}
        <Card className="rounded-none border-0 bg-[#16161F] p-8">
          <p className="text-xs font-semibold text-[#E05555] uppercase tracking-wider mb-5 flex items-center gap-2">
            <span>✕</span> Today with Slack + Zoom
          </p>
          <h3
            className="font-display text-xl font-normal text-[#F5F0E8] mb-3 tracking-tight leading-snug"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Leave, link, call, forget, summarize. Repeat.
          </h3>
          <p className="text-xs text-[#7A7890] leading-5 mb-6">
            Your conversation gets interrupted. You context switch to Zoom,
            paste a link, wait, call, decide — then someone has to remember what
            was said.
          </p>
          <div className="flex flex-col gap-1.5">
            {steps.bad.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-3 py-2 bg-[#111118] rounded-md"
              >
                <span className="w-5 h-5 rounded-full bg-[#E05555]/15 text-[#E05555] text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-xs text-[#7A7890]">{s}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* After */}
        <Card className="rounded-none border-0 bg-[#16161F] p-8">
          <p className="text-xs font-semibold text-[#1D9E75] uppercase tracking-wider mb-5 flex items-center gap-2">
            <span>✓</span> With ThreadCall
          </p>
          <h3
            className="font-display text-xl font-normal text-[#F5F0E8] mb-3 tracking-tight leading-snug"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Call from the thread. Summary posts itself.
          </h3>
          <p className="text-xs text-[#7A7890] leading-5 mb-6">
            The call belongs to the conversation. One click, everyone in the
            thread joins. When it ends, decisions and action items are already
            there.
          </p>
          <div className="flex flex-col gap-1.5">
            {steps.good.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-3 py-2 bg-[#111118] rounded-md"
              >
                <span className="w-5 h-5 rounded-full bg-[#1D9E75]/15 text-[#1D9E75] text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-xs text-[#7A7890]">{s}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}
