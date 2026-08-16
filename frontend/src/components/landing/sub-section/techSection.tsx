import { Card } from '#/components/ui/card'
import { TECH_CARDS } from '../data'

export function TechSection() {
  return (
    <section id="tech" className="py-24 px-6 max-w-5xl mx-auto">
      <p className="text-xs font-semibold text-[#E8A838] uppercase tracking-widest mb-4 reveal">
        Under the hood
      </p>
      <h2
        className="font-display text-4xl font-light text-[#F5F0E8] tracking-tight max-w-xl mb-4 reveal"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Built on Go, not glue
      </h2>
      <p className="text-sm text-[#7A7890] max-w-md mb-12 leading-6 reveal">
        ThreadCall is not a wrapper around existing tools. Every layer is chosen
        for correctness and performance.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 reveal">
        {TECH_CARDS.map((c) => (
          <Card
            key={c.title}
            className="border-[#2A2A3A] bg-[#16161F] hover:border-[#E8A838]/30 hover:bg-[#1C1C28] transition-all duration-500 p-7"
          >
            <p className="text-xs font-semibold text-[#1D9E75] uppercase tracking-wider mb-3">
              {c.tag}
            </p>
            <h3
              className="font-display text-xl font-normal text-[#F5F0E8] mb-2 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {c.title}
            </h3>
            <p className="text-xs text-[#7A7890] leading-5 mb-4">{c.body}</p>
            <div className="px-3 py-2.5 rounded-md bg-[#E8A838]/06 border border-[#E8A838]/12">
              <pre className="text-xs text-[#E8A838] whitespace-pre-wrap leading-5 font-mono">
                {c.code}
              </pre>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
