import Link from 'next/link'
import { ArrowRight, Link2, Workflow, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/marketing/page-hero'
import { FEATURES } from '@/lib/marketing-content'

const STEPS = [
  {
    icon: Link2,
    title: '1. Connectez votre compte',
    description: 'Instagram, Messenger ou WhatsApp — connexion officielle via Meta en 2 minutes.',
  },
  {
    icon: Workflow,
    title: '2. Configurez vos flows',
    description: 'Glissez-déposez des déclencheurs, conditions, délais et réponses. Aucun code requis.',
  },
  {
    icon: Sparkles,
    title: "3. L'IA prend le relais",
    description: 'Réponses automatiques, qualification de leads, prise de commande — pendant que vous vous concentrez ailleurs.',
  },
]

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Fonctionnalités"
        title="Tout ce dont vous avez besoin"
        description="Une plateforme complète pour automatiser vos conversations sur les trois grandes messageries de Meta."
      />

      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="feature-card group cursor-default rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Icon className="size-4.5" strokeWidth={1.75} />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Comment ça marche ─── */}
      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-medium text-primary">Comment ça marche</p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Opérationnel en 3 étapes
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-5" strokeWidth={1.75} />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Prêt à essayer ?
          </h2>
          <div className="mt-6">
            <Button size="lg" nativeButton={false} render={<Link href="/register" />} className="h-11 cursor-pointer px-8 text-sm">
              Commencer gratuitement <ArrowRight className="ml-1.5 size-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
