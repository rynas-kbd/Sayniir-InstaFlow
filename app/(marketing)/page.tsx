import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FEATURES = [
  {
    title: 'Multi-canal',
    description:
      'Instagram, Messenger et WhatsApp réunis dans une seule inbox. Un seul endroit pour toutes vos conversations clients.',
  },
  {
    title: 'Flows visuels',
    description:
      'Construisez vos automatisations par glisser-déposer : déclencheurs, conditions, délais, tags — sans écrire une ligne de code.',
  },
  {
    title: 'CRM intégré',
    description:
      'Chaque personne qui vous écrit devient un contact. Tags, segments et historique complet pour cibler juste.',
  },
  {
    title: 'Agents IA',
    description:
      'Réponses aux questions, prise de commande, qualification de leads — l’IA travaille pendant que vous dormez.',
  },
  {
    title: 'Campagnes',
    description:
      'Diffusez un message à un segment entier, en respectant automatiquement la fenêtre de messagerie de Meta.',
  },
  {
    title: 'Analytics',
    description:
      'Messages, taux de réponse, nouveaux contacts : la performance de vos automatisations, mesurée en continu.',
  },
]

export default function MarketingHome() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="text-[13px] font-semibold tracking-tight">Sayniir</span>
          <nav className="flex items-center gap-1">
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              Se connecter
            </Button>
            <Button size="sm" render={<Link href="/register" />}>
              Commencer
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-24 md:py-32">
          <div className="max-w-2xl">
            <p className="mb-4 text-[13px] font-medium text-primary">Automatisation conversationnelle</p>
            <h1 className="text-4xl font-semibold tracking-tighter text-balance md:text-5xl">
              Vos conversations clients, en pilote automatique.
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Sayniir connecte Instagram, Messenger et WhatsApp à des flows pilotés par l’IA — capables de
              répondre, qualifier et vendre pendant que vous gardez la main sur chaque règle.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Button render={<Link href="/register" />}>
                Commencer gratuitement <ArrowRight className="size-3.5" />
              </Button>
              <Button variant="ghost" render={<Link href="/login" />}>
                Se connecter
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t border-border py-20">
          <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ title, description }) => (
              <div key={title}>
                <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border py-20">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Prêt à automatiser ?</h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Connectez votre premier compte en moins de deux minutes.
              </p>
            </div>
            <Button render={<Link href="/register" />}>
              Créer un compte <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Sayniir</span>
          <span>Instagram · Messenger · WhatsApp</span>
        </div>
      </footer>
    </div>
  )
}
