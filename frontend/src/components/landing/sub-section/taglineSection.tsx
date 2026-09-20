import { useTaglineReveal } from '#/hooks/use-landing'
import { useRef } from 'react'

export function TaglineSection() {
  const ref = useRef<HTMLDivElement>(null)
  useTaglineReveal(ref)

  const line1 = [
    'Team',
    'knowledge',
    "shouldn't",
    'live',
    'in',
    "someone's",
    'memory.',
  ]
  const line2 = [
    'It',
    'should',
    'live',
    'in',
    'the',
    'thread',
    'that',
    'created',
    'it.',
  ]

  return (
    <div className="border-y border-[#2A2A3A] py-24 px-6 text-center overflow-hidden">
      <div ref={ref} id="tagline" className="max-w-3xl mx-auto">
        <p
          className="font-display font-light tracking-tight leading-tight"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 4.5vw, 56px)',
          }}
        >
          {line1.map((w, i) => (
            <span key={i} className="tagline-word">
              {w}{' '}
            </span>
          ))}
          <br />
          {line2.map((w, i) => (
            <span key={i} className="tagline-word">
              {w}{' '}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}
