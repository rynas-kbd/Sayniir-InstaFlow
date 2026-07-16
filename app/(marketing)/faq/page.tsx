import { PageHero } from '@/components/marketing/page-hero'
import { Accordion, AccordionItem, AccordionTrigger, AccordionPanel } from '@/components/ui/accordion'
import { FAQ_ITEMS, FAQ_THEMES } from '@/lib/marketing-content'

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Questions fréquentes"
        description="Tout ce qu'il faut savoir avant de commencer, organisé par thème."
      />

      <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="space-y-10">
          {FAQ_THEMES.map((theme) => {
            const items = FAQ_ITEMS.filter((item) => item.theme === theme)
            if (items.length === 0) return null
            return (
              <div key={theme} id={theme.toLowerCase()}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">{theme}</h2>
                <Accordion className="rounded-xl border border-border bg-card px-6">
                  {items.map((item) => (
                    <AccordionItem key={item.question} value={item.question}>
                      <AccordionTrigger>{item.question}</AccordionTrigger>
                      <AccordionPanel>{item.answer}</AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}
