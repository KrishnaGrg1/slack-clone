import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#/components/ui/accordion'
import { FAQ_ITEMS } from '../data'

export function FaqSection() {
  return (
    <section id="faq" className="py-24 px-6 max-w-3xl mx-auto">
      <p className="text-xs font-semibold text-[#E8A838] uppercase tracking-widest mb-4 reveal">
        Common questions
      </p>
      <h2 className="font-display text-4xl font-light text-[#F5F0E8] tracking-tight mb-12 reveal">
        Everything you want to know
      </h2>

      <Accordion className="reveal">
        {FAQ_ITEMS.map((item, i) => (
          <AccordionItem
            key={i}
            value={`item-${i}`}
            className="border-[#2A2A3A] border-x-0 first:border-t last:border-b-0"
          >
            <AccordionTrigger className="text-sm font-medium text-[#F5F0E8] hover:text-[#E8A838] hover:no-underline py-5 text-left transition-colors duration-300">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-[#7A7890] leading-6 pb-5">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
