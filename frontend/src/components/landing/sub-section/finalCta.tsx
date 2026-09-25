import { Button } from '#/components/ui/button'

export function FinalCta() {
  return (
    <div
      id="cta"
      className="relative border-t border-[#2A2A3A] py-24 px-6 text-center overflow-hidden"
    >
      {/* ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[480px] h-[240px] rounded-full bg-[#E8A838]/06 blur-3xl pointer-events-none" />

      <h2 className="font-display font-light tracking-tight text-[#F5F0E8] max-w-xl mx-auto mb-4 reveal text-2xl md:text-3xl lg:text-4xl leading-tight">
        Stop losing decisions to{' '}
        <em className="not-italic text-[#E8A838]">calls nobody documented</em>
      </h2>

      <p className="text-sm text-[#7A7890] mb-10 reveal">
        Self-host in 5 minutes. MIT licensed. No credit card.
      </p>

      <div className="flex items-center justify-center gap-4 flex-wrap reveal">
        <Button className="bg-[#E8A838] hover:bg-[#F0B848] text-[#0A0A0F] font-semibold px-6 py-3 rounded-lg transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(232,168,56,0.25)] active:scale-[0.98]">
          <a
            href="https://github.com/KrishnaGrg1/slack-clone"
            target="_blank"
            rel="noopener noreferrer"
          >
            ★ Star on GitHub
          </a>
        </Button>
        <Button
          variant="outline"
          className="border-[#2A2A3A] text-[#7A7890] hover:text-[#F5F0E8] hover:border-[#7A7890] bg-transparent px-6 py-3 rounded-lg transition-all duration-500"
        >
          <a href="#">Read the docs →</a>
        </Button>
      </div>

      <p className="text-xs text-[#4A4860] mt-5 reveal">
        Built with Go · PostgreSQL · Redis · WebRTC · OpenAI
      </p>
    </div>
  )
}
