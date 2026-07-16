import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/marketing/page-hero'
import { PRICING_TIERS, FAQ_ITEMS } from '@/lib/marketing-content'

const BILLING_FAQ = FAQ_ITEMS.filter((item) => item.theme === 'Facturation')

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Tarifs"
        title="Un prix simple, sans surprise"
        description="Choisissez le palier adapté à votre activité. Sans engagement, annulable à tout moment."
      />

      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid gap-6 lg:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                tier.highlighted
                  ? 'border-primary/40 bg-gradient-to-b from-primary/8 via-card to-card shadow-lg shadow-primary/10'
                  : 'border-border bg-card'
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Populaire
                </span>
              )}

              <h3 className="text-sm font-semibold text-foreground">{tier.name}</h3>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tracking-tight text-foreground">{tier.price}</span>
                {tier.period && <span className="text-sm text-muted-foreground">{tier.period}</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>

              <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={2.5} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                variant={tier.highlighted ? 'default' : 'outline'}
                nativeButton={false}
                render={<Link href="/register" />}
                className="mt-8 cursor-pointer"
              >
                {tier.price === 'Sur devis' ? 'Nous contacter' : 'Commencer'}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Mini FAQ facturation ─── */}
      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-medium text-primary">Questions sur la facturation</p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Avant de vous décider
            </h2>
          </div>

          <div className="space-y-4">
            {BILLING_FAQ.map((item) => (
              <div key={item.question} className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground">{item.question}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/faq" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              Voir toute la FAQ <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
