import Link from 'next/link'
import { ArrowRight, MessageCircle, Zap, Users, BarChart3, Megaphone, Bot, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const FEATURES = [
  {
    icon: MessageCircle,
    title: 'Inbox unifié',
    description:
      'Instagram, Messenger et WhatsApp dans une seule interface. Finis les onglets, une seule inbox pour tout gérer.',
  },
  {
    icon: Zap,
    title: 'Flows visuels',
    description:
      'Glisser-déposer pour construire vos automatisations : déclencheurs, conditions, délais et tags — sans code.',
  },
  {
    icon: Users,
    title: 'CRM intégré',
    description:
      'Chaque contact centralisé avec tags, segments et historique complet pour cibler avec précision.',
  },
  {
    icon: Bot,
    title: 'Agents IA',
    description:
      'L\'IA répond, qualifie les leads et prend des commandes pendant que vous vous concentrez sur ce qui compte.',
  },
  {
    icon: Megaphone,
    title: 'Campagnes',
    description:
      'Diffusez un message à tout un segment en respectant automatiquement la fenêtre de messagerie Meta.',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description:
      'Taux de réponse, nouveaux contacts, performance des flows — mesurez ce qui compte vraiment.',
  },
]

const SOCIAL_PROOF = [
  { label: 'Messages automatisés', value: '2.4M+' },
  { label: 'Temps de réponse moyen', value: '< 1s' },
  { label: 'Comptes connectés', value: '3 200+' },
  { label: 'Satisfaction client', value: '98%' },
]

export default function MarketingHome() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary">
              <MessageCircle className="size-3.5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold tracking-tight">Sayniir</span>
          </div>
          <nav className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/login" />}
              className="cursor-pointer"
            >
              Se connecter
            </Button>
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href="/register" />}
              className="cursor-pointer"
            >
              Commencer <ArrowRight className="ml-1 size-3" />
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* ─── Hero ─── */}
        <section className="gradient-hero relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-6 py-24 md:py-36">
            <div className="max-w-3xl">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                Automatisation conversationnelle multi-canal
              </div>

              <h1 className="text-4xl font-semibold text-balance leading-tight tracking-tight text-foreground md:text-6xl">
                Vos clients répondus.{' '}
                <span className="text-primary">Automatiquement.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Sayniir connecte Instagram, Messenger et WhatsApp à une IA qui répond, qualifie et vend —
                pendant que vous restez maître de chaque règle.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  nativeButton={false}
                  render={<Link href="/register" />}
                  className="cursor-pointer h-11 px-6 text-sm"
                >
                  Commencer gratuitement <ArrowRight className="ml-1.5 size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  nativeButton={false}
                  render={<Link href="/login" />}
                  className="cursor-pointer h-11 px-6 text-sm"
                >
                  Se connecter
                </Button>
              </div>

              {/* Trust signals */}
              <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
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
                  <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features ─── */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-medium text-primary">Fonctionnalités</p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Une plateforme complète pour automatiser vos conversations
              sur les trois grandes messageries de Meta.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="feature-card group cursor-default rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="size-4.5" strokeWidth={1.75} />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
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
                Connectez votre premier compte Instagram, Messenger ou WhatsApp
                en moins de deux minutes.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  nativeButton={false}
                  render={<Link href="/register" />}
                  className="cursor-pointer h-11 px-8 text-sm"
                >
                  Créer un compte gratuit <ArrowRight className="ml-1.5 size-4" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Gratuit · Sans engagement · Aucune carte requise
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Sayniir</span>
          <span>Instagram · Messenger · WhatsApp</span>
        </div>
      </footer>
    </div>
  )
}
