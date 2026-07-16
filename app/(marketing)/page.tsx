import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MessageCircle, Zap, Users, BarChart3, Megaphone, Bot, CheckCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionItem, AccordionTrigger, AccordionPanel } from '@/components/ui/accordion'

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

const SCREENSHOTS = [
  { src: '/screenshots/dashboard.png', alt: 'Tableau de bord Sayniir' },
  { src: '/screenshots/flow-builder.png', alt: "Constructeur de flows Sayniir" },
  { src: '/screenshots/inbox.png', alt: 'Inbox unifié Sayniir' },
]

const PRICING_TIERS = [
  {
    name: 'Starter',
    price: '4 900',
    period: 'DZD/mois',
    description: 'Pour démarrer et automatiser votre premier compte.',
    features: [
      '1 compte connecté (Instagram, Messenger ou WhatsApp)',
      'Inbox unifié',
      'Flows illimités',
      'CRM basique (contacts, tags)',
    ],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '12 900',
    period: 'DZD/mois',
    description: "Pour les boutiques et créateurs actifs qui veulent l'IA.",
    features: [
      '3 comptes connectés',
      'Agents IA (Q&A, qualification, prise de commande)',
      'Campagnes de diffusion',
      'Analytics avancées',
      'Tout Starter inclus',
    ],
    highlighted: true,
  },
  {
    name: 'Business',
    price: 'Sur devis',
    period: '',
    description: 'Pour les agences et comptes multiples.',
    features: [
      'Comptes illimités',
      'Plusieurs utilisateurs',
      'Support prioritaire',
      'Intégrations sur mesure',
      'Tout Pro inclus',
    ],
    highlighted: false,
  },
]

const FAQ_ITEMS = [
  {
    question: "Est-ce autorisé par Instagram et Meta ? Je risque un ban ?",
    answer:
      "Sayniir utilise exclusivement les API officielles de Meta (Instagram Messaging API, Messenger Platform, WhatsApp Business API). Aucun scraping ni automatisation non-officielle : votre compte reste conforme aux règles de la plateforme.",
  },
  {
    question: 'Dois-je savoir coder pour créer des automatisations ?',
    answer:
      "Non. Le constructeur de flows fonctionne en glisser-déposer : déclencheurs, conditions, délais et réponses se configurent visuellement, sans une ligne de code.",
  },
  {
    question: 'Combien de temps pour être opérationnel ?',
    answer:
      'La connexion de votre premier compte prend environ 2 minutes. La plupart des utilisateurs ont leur premier flow actif le jour même.',
  },
  {
    question: "Qu'est-ce que la fenêtre de messagerie de 24h et comment Sayniir la gère ?",
    answer:
      "Meta limite l'envoi de messages hors conversation à une fenêtre de 24h après le dernier message du contact. Sayniir respecte automatiquement cette règle pour vos flows et campagnes, sans action de votre part.",
  },
  {
    question: 'Puis-je annuler à tout moment ?',
    answer:
      "Oui, sans engagement. Vous pouvez annuler votre abonnement à tout moment depuis votre espace client, sans frais ni préavis.",
  },
  {
    question: 'Quels moyens de paiement sont acceptés ?',
    answer:
      'Nous nous adaptons aux moyens de paiement disponibles en Algérie (CCP, Edahabia, virement). Contactez-nous pour organiser le règlement qui vous convient.',
  },
  {
    question: "Comment obtenir de l'aide si je suis bloqué ?",
    answer:
      'Le support est disponible par message depuis votre espace client. Les clients Business bénéficient en plus d\'un support prioritaire avec un temps de réponse garanti.',
  },
  {
    question: 'Puis-je connecter plusieurs comptes Instagram/WhatsApp ?',
    answer:
      "Oui, selon votre palier : 1 compte en Starter, 3 en Pro, illimité en Business. Chaque compte a ses propres flows, contacts et statistiques.",
  },
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

        {/* ─── Screenshots ─── */}
        <section className="border-t border-border bg-muted/20">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
            <div className="mb-14 text-center">
              <p className="mb-3 text-sm font-medium text-primary">Aperçu produit</p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Le produit, en vrai
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
                Une interface claire pour piloter toutes vos conversations et automatisations.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {SCREENSHOTS.map(({ src, alt }) => (
                <div
                  key={src}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-primary/5"
                >
                  <Image src={src} alt={alt} width={640} height={420} className="h-auto w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Pricing ─── */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mb-14 text-center">
            <p className="mb-3 text-sm font-medium text-primary">Tarifs</p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Un prix simple, sans surprise
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Choisissez le palier adapté à votre activité. Sans engagement, annulable à tout moment.
            </p>
          </div>

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

        {/* ─── FAQ ─── */}
        <section className="border-t border-border bg-muted/20">
          <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
            <div className="mb-10 text-center">
              <p className="mb-3 text-sm font-medium text-primary">FAQ</p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Questions fréquentes
              </h2>
            </div>

            <Accordion className="rounded-xl border border-border bg-card px-6">
              {FAQ_ITEMS.map((item) => (
                <AccordionItem key={item.question} value={item.question}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionPanel>{item.answer}</AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
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
