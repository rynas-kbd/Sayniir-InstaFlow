import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FEATURES, SOCIAL_PROOF, SCREENSHOTS, PRICING_TIERS } from '@/lib/marketing-content'

export default function MarketingHome() {
  const proTier = PRICING_TIERS.find((t) => t.highlighted) ?? PRICING_TIERS[1]

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-36">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              Automatisation conversationnelle multi-canal
            </div>

            <h1 className="text-4xl font-semibold text-balance leading-tight tracking-tight text-foreground md:text-6xl">
              Vos clients répondus. <span className="text-primary">Automatiquement.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Sayniir connecte Instagram, Messenger et WhatsApp à une IA qui répond, qualifie et vend —
              pendant que vous restez maître de chaque règle.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" nativeButton={false} render={<Link href="/register" />} className="h-11 cursor-pointer px-6 text-sm">
                Commencer gratuitement <ArrowRight className="ml-1.5 size-4" />
              </Button>
              <Button variant="outline" size="lg" nativeButton={false} render={<Link href="/fonctionnalites" />} className="h-11 cursor-pointer px-6 text-sm">
                Voir les fonctionnalités
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="size-3.5 text-success" />
              Aucune carte bancaire requise
              <span className="mx-1 text-border">·</span>
              <CheckCircle className="size-3.5 text-success" />
              Connexion en 2 minutes
              <span className="mx-1 text-border">·</span>
              <CheckCircle className="size-3.5 text-success" />
              Annulez à tout moment
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats bar ─── */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {SOCIAL_PROOF.map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features teaser ─── */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-medium text-primary">Fonctionnalités</p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Tout ce dont vous avez besoin
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Une plateforme complète pour automatiser vos conversations sur les trois grandes messageries de Meta.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.slice(0, 3).map(({ icon: Icon, title, description }) => (
            <div key={title} className="feature-card group cursor-default rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Icon className="size-4.5" strokeWidth={1.75} />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/fonctionnalites" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            Voir toutes les fonctionnalités <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* ─── Screenshots ─── */}
      <section className="border-t border-border bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-medium text-primary">Aperçu produit</p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Le produit, en vrai</h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Une interface claire pour piloter toutes vos conversations et automatisations.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {SCREENSHOTS.map(({ src, alt }) => (
              <div key={src} className="overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-primary/5">
                <Image src={src} alt={alt} width={640} height={420} className="h-auto w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing teaser ─── */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-medium text-primary">Tarifs</p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Un prix simple, sans surprise</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Sans engagement, annulable à tout moment.
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <div className="relative flex flex-col rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/8 via-card to-card p-8 shadow-lg shadow-primary/10">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              Populaire
            </span>
            <h3 className="text-sm font-semibold text-foreground">{proTier.name}</h3>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tracking-tight text-foreground">{proTier.price}</span>
              {proTier.period && <span className="text-sm text-muted-foreground">{proTier.period}</span>}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{proTier.description}</p>
            <ul className="mt-6 flex flex-col gap-2.5">
              {proTier.features.slice(0, 3).map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-primary" strokeWidth={2.5} />
                  {feature}
                </li>
              ))}
            </ul>
            <Button size="lg" nativeButton={false} render={<Link href="/register" />} className="mt-8 cursor-pointer">
              Commencer
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            Voir tous les tarifs <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-10 text-center md:p-16">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Prêt à automatiser vos ventes ?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
              Connectez votre premier compte Instagram, Messenger ou WhatsApp en moins de deux minutes.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" nativeButton={false} render={<Link href="/register" />} className="h-11 cursor-pointer px-8 text-sm">
                Créer un compte gratuit <ArrowRight className="ml-1.5 size-4" />
              </Button>
              <p className="text-xs text-muted-foreground">Gratuit · Sans engagement · Aucune carte requise</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
