'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpatialCard } from './spatial-card'

interface Scenario {
  id: string
  title: string
  subtitle: string
  channel: 'Instagram' | 'WhatsApp' | 'Messenger'
  channelColor: string
  badge: string
  userMessage: string
  aiResponse: string
  confidence: number
  conversionGain: string
  crmAction: string
  nodes: { id: string; label: string; tone: 'terracotta' | 'sage' }[]
}

const SCENARIOS: Scenario[] = [
  {
    id: 'sale',
    title: 'Vente Directe & Conversion',
    subtitle: 'Transforme les indécis en acheteurs en moins de 2 minutes',
    channel: 'Instagram',
    channelColor: 'var(--organic-terracotta)',
    badge: 'Vente Flash DM',
    userMessage: 'Bonjour ! Vous livrez en France métropolitaine avant vendredi ? C\'est pour un anniversaire 🎂',
    aiResponse: 'Oui absolument ! En commandant avant 16h aujourd\'hui, votre colis part en Colissimo Express et arrive jeudi matin. Je vous glisse un mot personnalisé offert ? 🎁',
    confidence: 98,
    conversionGain: '+42% de conversion',
    crmAction: 'Commande créée & Payée',
    nodes: [
      { id: '1', label: 'DM Entrant Instagram', tone: 'terracotta' },
      { id: '2', label: 'Analyse d\'Intention (Urgence)', tone: 'terracotta' },
      { id: '3', label: 'Vérification Stock & Délais', tone: 'sage' },
      { id: '4', label: 'Lien de Paiement Généré', tone: 'sage' },
    ],
  },
  {
    id: 'cart',
    title: 'Relance Panier Abandonné',
    subtitle: 'Récupère 35% des paniers sans faire de relance lourde',
    channel: 'WhatsApp',
    channelColor: '#25D366',
    badge: 'Panier WhatsApp',
    userMessage: 'J\'ai laissé mon panier de 120€ en attente, le code PROMO10 est toujours valide ?',
    aiResponse: 'Oui Thomas ! Il vous reste 3 heures pour l\'utiliser. Voici votre panier directement pré-rempli avec -10% appliqué 👇',
    confidence: 96,
    conversionGain: '35% paniers récupérés',
    crmAction: 'Panier Validé → Shopify',
    nodes: [
      { id: '1', label: 'Trigger Abandon Web', tone: 'terracotta' },
      { id: '2', label: 'Envoi DM WhatsApp Personnalisé', tone: 'terracotta' },
      { id: '3', label: 'Application Code Promo Dynamic', tone: 'sage' },
      { id: '4', label: 'Sync Client Shopify', tone: 'sage' },
    ],
  },
  {
    id: 'b2b',
    title: 'Qualification Lead VIP',
    subtitle: 'Filtre les vrais prospects et prend les RDV automatiquement',
    channel: 'Messenger',
    channelColor: '#0084FF',
    badge: 'Lead Qualification',
    userMessage: 'Bonjour, quel est le tarif pour équiper une équipe de 25 personnes chez nous ?',
    aiResponse: 'Bonjour Sarah ! Pour 25 accès, nous proposons le pack Enterprise avec accompagnement dédié. Avez-vous 15 min demain à 14h pour une démo personnalisée ?',
    confidence: 99,
    conversionGain: 'RDV qualifié en 30s',
    crmAction: 'RDV ajouté à Calendly',
    nodes: [
      { id: '1', label: 'Demande Tarif B2B', tone: 'terracotta' },
      { id: '2', label: 'Score de Qualification (> 20 salariés)', tone: 'terracotta' },
      { id: '3', label: 'Propose Creneaux Calendly', tone: 'sage' },
      { id: '4', label: 'Lead Transmis au Sales Manager', tone: 'sage' },
    ],
  },
]

export function InteractiveStudio() {
  const [activeTab, setActiveTab] = useState<string>('sale')
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [stepIndex, setStepIndex] = useState<number>(0)
  const chatRef = useRef<HTMLDivElement>(null)

  const currentScenario = SCENARIOS.find((s) => s.id === activeTab) ?? SCENARIOS[0]

  useEffect(() => {
    setIsPlaying(true)
    setStepIndex(0)

    const timer1 = setTimeout(() => setStepIndex(1), 500)
    const timer2 = setTimeout(() => setStepIndex(2), 1600)
    const timer3 = setTimeout(() => {
      setStepIndex(3)
      setIsPlaying(false)
    }, 2800)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [activeTab])

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background ambient laser glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[120px]"
        style={{ background: 'radial-gradient(circle, var(--organic-terracotta) 0%, var(--organic-sage-600) 60%, transparent 100%)' }}
      />

      <div className="mx-auto max-w-[1240px] px-4">
        {/* Section Title */}
        <div className="text-center mb-12">
          <span className="spatial-glow-badge inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-metallic mb-4">
            ✦ Studio d'Expérimentation en En Direct
          </span>
          <h2 className="font-heading text-[clamp(32px,4vw,54px)] font-extrabold leading-tight">
            Testez la voix de votre IA <br />
            <span className="text-metallic">en temps réel.</span>
          </h2>
          <p className="mt-4 text-[17px] text-zinc-400 max-w-[55ch] mx-auto">
            Cliquez sur un scénario ci-dessous pour observer comment Instaflow qualifie, répond et conclut la vente en quelques secondes.
          </p>

          {/* Scenario Tabs Switcher */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {SCENARIOS.map((scenario) => {
              const isActive = scenario.id === activeTab
              return (
                <button
                  key={scenario.id}
                  onClick={() => setActiveTab(scenario.id)}
                  className={`relative cursor-pointer rounded-full px-6 py-3 text-sm font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-zinc-900 text-white shadow-xl ring-2 ring-amber-500/50'
                      : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: scenario.channelColor }}
                    />
                    {scenario.title}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Full-width Studio Interface Container */}
        <div
          className="rounded-3xl border border-zinc-800/80 p-6 md:p-10 backdrop-blur-2xl shadow-2xl"
          style={{ background: 'linear-gradient(145deg, rgba(20, 20, 26, 0.95) 0%, rgba(10, 10, 14, 0.98) 100%)' }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Visual Node Automation Flow */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-500 font-bold">
                  Graphe de Décision IA
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  Canal : <strong className="text-zinc-200">{currentScenario.channel}</strong>
                </span>
              </div>

              <div className="flex flex-col gap-3 relative py-2">
                {currentScenario.nodes.map((node, i) => {
                  const isPassed = stepIndex >= i
                  const isCurrent = stepIndex === i
                  return (
                    <motion.div
                      key={node.id}
                      initial={false}
                      animate={{
                        scale: isCurrent ? 1.03 : 1,
                        x: isCurrent ? 6 : 0,
                        opacity: isPassed ? 1 : 0.4,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={`relative rounded-xl border p-3.5 flex items-center justify-between transition-colors duration-300 ${
                        isCurrent
                          ? 'border-amber-500/80 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                          : isPassed
                          ? 'border-zinc-700 bg-zinc-900/80'
                          : 'border-zinc-800/60 bg-zinc-950/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid size-6 place-content-center rounded-full text-xs font-bold ${
                            isPassed ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-xs font-semibold text-zinc-200">{node.label}</span>
                      </div>
                      {isPassed && (
                        <svg className="size-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              {/* Instant CRM Metric badge */}
              <div className="mt-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-emerald-400 uppercase font-bold">Résultat CRM Automatique</div>
                  <div className="text-sm font-bold text-white mt-0.5">{currentScenario.crmAction}</div>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-300 border border-emerald-500/30">
                  {currentScenario.conversionGain}
                </span>
              </div>
            </div>

            {/* Right Column: Live Chat Simulation Phone Mockup */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
                {/* Phone / Chat Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="grid size-9 place-content-center rounded-full font-bold text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        AI
                      </div>
                      <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Instaflow AI Agent</div>
                      <div className="text-[11px] text-zinc-400">Temps de réponse moyen : 1.4s</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-zinc-800 px-3 py-1 text-[11px] font-mono font-semibold text-zinc-300">
                    Confiance : {currentScenario.confidence}%
                  </span>
                </div>

                {/* Chat Messages Body */}
                <div ref={chatRef} className="flex min-h-[260px] flex-col gap-4 p-5">
                  {/* User Incoming Message */}
                  <AnimatePresence>
                    {stepIndex >= 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="max-w-[85%] self-start rounded-2xl rounded-bl-xs bg-zinc-900 border border-zinc-800 p-4 text-xs leading-relaxed text-zinc-200 shadow-md"
                      >
                        <span className="block text-[10px] font-mono font-bold text-zinc-400 mb-1 uppercase">
                          Client · DM {currentScenario.channel}
                        </span>
                        {currentScenario.userMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* AI Typing Indicator */}
                  <AnimatePresence>
                    {stepIndex === 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-1.5 self-end rounded-2xl rounded-br-xs bg-amber-500/20 border border-amber-500/30 px-4 py-3"
                      >
                        <span className="size-1.5 animate-bounce rounded-full bg-amber-400" />
                        <span className="size-1.5 animate-bounce rounded-full bg-amber-400 [animation-delay:0.2s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-amber-400 [animation-delay:0.4s]" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* AI Response Message */}
                  <AnimatePresence>
                    {stepIndex >= 2 && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className="max-w-[88%] self-end rounded-2xl rounded-br-xs bg-gradient-to-r from-amber-600 to-amber-700 p-4 text-xs leading-relaxed text-white shadow-xl shadow-amber-900/20"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-amber-200 uppercase">
                            Instaflow Closer IA · 1.4s
                          </span>
                          <span className="text-[9px] bg-black/30 px-1.5 py-0.5 rounded font-mono text-amber-100">
                            Lien sécurisé prêt
                          </span>
                        </div>
                        {currentScenario.aiResponse}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
