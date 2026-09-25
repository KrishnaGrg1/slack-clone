import { HOW_STEPS } from '../data'

export function HowSection() {
  return (
    <section id="how-it-works" className="py-24 px-6 max-w-5xl mx-auto">
      <p className="text-xs font-semibold text-[#E8A838] uppercase tracking-widest mb-4 reveal">
        How it works
      </p>
      <h2 className="font-display text-4xl font-light text-[#F5F0E8] tracking-tight max-w-xl mb-4 reveal">
        Three steps. No new tools to learn.
      </h2>
      <p className="text-sm text-[#7A7890] max-w-md mb-16 leading-6 reveal">
        ThreadCall works inside the conversation. If your team can send a
        message, they can use ThreadCall.
      </p>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 reveal">
        {/* Connector line */}
        <div className="absolute top-6 left-[calc(16.66%+12px)] right-[calc(16.66%+12px)] h-px bg-gradient-to-r from-[#2A2A3A] via-[#A87820] to-[#2A2A3A] hidden md:block" />

        {HOW_STEPS.map((step) => (
          <div
            key={step.title}
            className="flex flex-col items-center text-center relative"
          >
            <div className="w-12 h-12 rounded-xl bg-[#16161F] border border-[#2A2A3A] flex items-center justify-center text-xl mb-6 relative z-10">
              {step.icon}
            </div>
            <h3 className="font-display text-xl font-normal text-[#F5F0E8] mb-2.5 tracking-tight">
              {step.title}
            </h3>
            <p className="text-xs text-[#7A7890] leading-5 max-w-56">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
