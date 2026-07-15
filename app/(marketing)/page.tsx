import Link from 'next/link'
import {
  Sparkles,
  ArrowRight,
  MessageSquare,
  Workflow,
  Users,
  BarChart3,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Multi-canal',
    description: 'Instagram, Messenger et WhatsApp réunis dans une seule inbox.',
  },
  {
    icon: Workflow,
    title: 'Flows visuels',
    description: 'Construisez vos automatisations par glisser-déposer, sans code.',
  },
  {
    icon: Users,
    title: 'CRM intégré',
    description: 'Contacts, tags et segments pour cibler chaque audience.',
  },
  {
    icon: BarChart3,
    title: 'Analytics réelles',
    description: 'Suivez la performance de vos automatisations en continu.',
  },
]

export default function MarketingHome() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="size-4 text-primary-foreground" strokeWidth={2.4} />
          </div>
          <span className="text-[15px] font-bold tracking-tight">Sayniir</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login" />}>
            Se connecter
          </Button>
          <Button render={<Link href="/register" />}>Essayer gratuitement</Button>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="flex flex-col items-center gap-6 py-24 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Automatisation conversationnelle pilotée par l&apos;IA
          </div>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Automatisez vos conversations,{' '}
            <span className="text-primary">gardez le contrôle</span>
          </h1>
          <p className="max-w-xl text-balance text-muted-foreground">
            Sayniir connecte Instagram, Messenger et WhatsApp à des flows IA capables de répondre,
            qualifier et vendre — pendant que vous gardez la main sur chaque règle.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href="/register" />}>
              Commencer <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/login" />}>
              Se connecter
            </Button>
          </div>
        </section>

        <section className="grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardContent className="flex flex-col gap-3 pt-6">
                <div className="flex size-9 items-center justify-center rounded-lg bg-accent">
                  <Icon className="size-4 text-accent-foreground" />
                </div>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Sayniir. Tous droits réservés.
      </footer>
    </div>
  )
}
