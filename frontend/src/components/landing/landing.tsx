import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'

import { Separator } from '#/components/ui/separator'

import { useScrollReveal } from '#/hooks/use-landing'

import { NavBar } from './sub-section/navbar'
import { HeroDemo } from './sub-section/heroDemo'
import { ProblemSection } from './sub-section/problemSection'
import { TaglineSection } from './sub-section/taglineSection'
import { BenefitsSection } from './sub-section/benefitsSection'
import { HowSection } from './sub-section/howSection'
import { TechSection } from './sub-section/techSection'
import { FaqSection } from './sub-section/faqSection'
import { FinalCta } from './sub-section/finalCta'
import { Footer } from './sub-section/footer'

export default function LandingPage() {
  useScrollReveal()

  return (
    <>
      {/* skip to content */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#E8A838] focus:text-[#0A0A0F] focus:rounded focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      <NavBar />

      <main id="main">
        {/* HERO */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-28 pb-20 relative">
          {/* ambient */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#E8A838]/08 blur-3xl" />
            <div className="absolute top-1/2 left-1/4 w-[400px] h-[200px] rounded-full bg-[#1D9E75]/05 blur-3xl" />
          </div>

          {/* eyebrow */}
          <Badge
            variant="outline"
            className="mb-8 gap-2 border-[#E8A838]/25 bg-[#E8A838]/06 text-[#E8A838] text-xs font-medium uppercase tracking-widest px-4 py-1.5 rounded-full reveal"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8A838] pulse-dot" />
            Open source · Built in Go
          </Badge>

          <h1
            className="font-display font-light tracking-tight mb-6 max-w-3xl reveal"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(44px, 7vw, 80px)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(160deg, #F5F0E8 0%, #7A7890 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Conversations that{' '}
            <em
              className="not-italic"
              style={{ WebkitTextFillColor: '#E8A838' }}
            >
              remember themselves
            </em>
          </h1>

          <p className="text-base text-[#7A7890] max-w-md mb-10 leading-7 reveal">
            Start a call from any message thread. When it ends, AI posts the
            decisions and action items back — automatically, to the exact
            conversation that needed them.
          </p>

          <div className="flex items-center gap-4 flex-wrap justify-center mb-16 reveal">
            <Button className="bg-[#E8A838] hover:bg-[#F0B848] text-[#0A0A0F] font-semibold px-6 py-3 rounded-lg transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(232,168,56,0.25)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#E8A838] focus-visible:ring-offset-2">
              <a href="/login">Login</a>
            </Button>
            <Button
              variant="outline"
              className="border-[#2A2A3A] text-[#7A7890] hover:text-[#F5F0E8] hover:border-[#7A7890] bg-transparent px-6 py-3 rounded-lg transition-all duration-500 focus-visible:ring-2 focus-visible:ring-[#7A7890]"
            >
              <a
                href="https://github.com/KrishnaGrg1/slack-clone"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub →
              </a>
            </Button>
          </div>

          <HeroDemo />
        </section>

        {/* LOGO STRIP */}
        <div className="border-y border-[#2A2A3A] py-12 px-6 text-center">
          <p className="text-xs text-[#7A7890] uppercase tracking-widest mb-8">
            Trusted by teams at
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            {[
              'Meridian Labs',
              'Ironclad.sh',
              'Vantaflow',
              'Archway',
              'Helios Dev',
            ].map((name) => (
              <span
                key={name}
                className="font-display text-lg font-semibold text-[#2A2A3A] hover:text-[#7A7890] transition-colors duration-500 tracking-tight cursor-default"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <ProblemSection />
        <TaglineSection />
        <BenefitsSection />
        <HowSection />

        <Separator className="bg-[#2A2A3A] max-w-5xl mx-auto" />

        <TechSection />
        <FaqSection />
        <FinalCta />
      </main>

      <Footer />
    </>
  )
}
