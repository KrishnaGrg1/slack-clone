import { Card } from '#/components/ui/card'
import { BENEFITS } from '../data'
export function BenefitsSection() {
  return (
    <section id="benefits" className="py-24 px-6 max-w-5xl mx-auto">
      <p className="text-xs font-semibold text-[#E8A838] uppercase tracking-widest mb-4 reveal">
        Why ThreadCall
      </p>
      <h2
        className="font-display text-4xl font-light text-[#F5F0E8] tracking-tight max-w-xl mb-16 reveal"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Everything your team needs. Nothing you don't.
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 bg-[#2A2A3A] rounded-2xl overflow-hidden reveal">
        {BENEFITS.map((b) => (
          <Card
            key={b.title}
            className="rounded-none border-0 bg-[#16161F] hover:bg-[#1C1C28] transition-colors duration-500 p-8 cursor-default"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E8A838]/10 border border-[#E8A838]/20 flex items-center justify-center text-lg mb-5">
              {b.icon}
            </div>
            <h3
              className="font-display text-lg font-normal text-[#F5F0E8] mb-2.5 tracking-tight leading-snug"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {b.title}
            </h3>
            <p className="text-xs text-[#7A7890] leading-5">{b.body}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
