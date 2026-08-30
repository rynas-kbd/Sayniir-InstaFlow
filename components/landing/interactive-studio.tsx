'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StudioScenario {
  id: string
  title: string
  channel: string
  channelColor: string
  userMessage: string
  confidence: number
  nodes: {
    id: string
    label: string
    status: string
    description: string
  }[]
  aiResponse: string
  extractedData: { key: string; value: string }[]
}

const SCENARIOS: StudioScenario[] = [
  {
    id: 'ecom-closing',
    title: 'E-commerce (Panier Elevé)',
    channel: 'Instagram DM',
    channelColor: '#E1306C',
    userMessage: 'Salut ! Je veux le manteau en laine Camel mais j’hésite sur la taille. Je fais 1m75.',
    confidence: 98,
    nodes: [
      {
        id: 'n1',
        label: '1. Identification Intent & Taille',
        status: 'IA Comprise',
        description: 'Manteau Camel · Hauteur 1m75 → Match Taille M/L',
      },
      {
        id: 'n2',
        label: '2. Vérification Stock & Recommandation',
        status: 'Stock OK (3 restants)',
        description: 'Recommande M pour coupe ajustée, L pour oversize',
      },
      {
        id: 'n3',
        label: '3. Offre & Lien de Checkout Direct',
        status: 'Lien Généré',
        description: 'Code promo VIP -10% + Checkout Stripe DM instantané',
      },
    ],
    aiResponse:
      'Hello ! Pour 1m75, la taille M sera parfaite pour une coupe élégante ajustée. Si tu aimes l’effet oversize tendance, prends du L ! Il n’en reste plus que 3 en stock Camel M. Je te mets le code VIP10 (-10%) direct ici : Raddlly.shop/pay?item=camel-m&code=VIP10 ⚡️',
    extractedData: [
      { key: 'Produit', value: 'Manteau Laine Camel' },
      { key: 'Taille Recommandée', value: 'M (1m75)' },
      { key: 'Statut', value: 'Checkout généré' },
    ],
  },
  {
    id: 'b2b-lead',
    title: 'Lead B2B / Agence',
    channel: 'WhatsApp',
    channelColor: '#25D366',
    userMessage: 'Bonjour, nous cherchons une solution pour automatiser le SAV de notre marque de cosmétique (45k abonnés).',
    confidence: 96,
    nodes: [
      {
        id: 'n1',
        label: '1. Qualification Taille de Marque',
        status: 'Lead Chaud (>10k abonnés)',
        description: 'Cosmétique · 45k followers · Volume élevé estimé',
      },
      {
        id: 'n2',
        label: '2. Scoring & Matching Solution',
        status: 'Plan Scale Recommandé',
        description: 'Détection besoin API WhatsApp Multi-Agents',
      },
      {
        id: 'n3',
        label: '3. Prise de RDV Automatique',
        status: 'Calendly Invoqué',
        description: 'Propose créneau avec Account Executive dédie',
      },
    ],
    aiResponse:
      'Bonjour ! Très belle marque ! Avec 45k abonnés, l’IA va vous faire gagner environ 18h de SAV par semaine. Quel est votre volume de DM par jour ? Je peux vous caler une démo sur-mesure de 15min avec notre Head of Sales ce jeudi.',
    extractedData: [
      { key: 'Industrie', value: 'Cosmétique B2C' },
      { key: 'Volume Estimé', value: '~150 DM/jour' },
      { key: 'Action', value: 'Prise de RDV Démo' },
    ],
  },
  {
    id: 'infoproduit',
    title: 'Coaching & Infoproduit',
    channel: 'Messenger',
    channelColor: '#0084FF',
    userMessage: 'Est-ce que votre programme de formation est adapté si je pars de zéro en e-commerce ?',
    confidence: 99,
    nodes: [
      {
        id: 'n1',
        label: '1. Analyse Objection Débutant',
        status: 'Empathie Détectée',
        description: 'Niveau: Débutant complet · Besoin réassurance',
      },
      {
        id: 'n2',
        label: '2. Preuve Sociale & Témoignage',
        status: 'Case Study Matché',
        description: 'Envoie le cas d’un élève parti de 0 qui a fait 5k€/m',
      },
      {
        id: 'n3',
        label: '3. Proposition d’Accès Immédiat',
        status: 'Offre Présentée',
        description: 'Module 1 offert ou inscription directe',
      },
    ],
    aiResponse:
      'Exactement ! 65% de nos membres ont commencé sans aucune expérience préalable. Le Module 1 est conçu pas-à-pas pour les vrais débutants. Veux-tu que je t’envoie l’accès gratuit à la 1ère vidéo de démonstration ?',
    extractedData: [
      { key: 'Niveau Client', value: 'Débutant complet' },
      { key: 'Objection', value: 'Peur de la complexité' },
      { key: 'Action', value: 'Envoi Lead Magnet' },
    ],
  },
]

export function InteractiveStudio() {
  const [activeTab, setActiveTab] = useState<string>('ecom-closing')
  const [stepIndex, setStepIndex] = useState<number>(0)
  const chatRef = useRef<HTMLDivElement>(null)

  const currentScenario = SCENARIOS.find((s) => s.id === activeTab) || SCENARIOS[0]

  // Auto-play node execution simulation when tab changes
  useEffect(() => {
    setStepIndex(0)
    const t1 = setTimeout(() => setStepIndex(1), 600)
    const t2 = setTimeout(() => setStepIndex(2), 1400)
    const t3 = setTimeout(() => setStepIndex(3), 2200)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [activeTab])

  // Scroll chat down when messages appear
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [stepIndex])

  return (
    <section className="py-20 relative">
      <div className="mx-auto max-w-[1240px]">
        {/* Section Title */}
        <div className="mb-12 text-center">
          <span
            className="font-mono text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-md inline-block mb-3"
            style={{
              color: 'var(--organic-text)',
              background: 'color-mix(in srgb, var(--organic-text) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--organic-text) 14%, transparent)',
            }}
          >
            ✦ Studio d'Expérimentation en Direct
          </span>
          <h2
            className="font-heading text-[clamp(32px,4vw,54px)] font-extrabold leading-tight"
            style={{ color: 'var(--organic-text)' }}
          >
            Testez la voix de votre IA <br />
            <span className="text-metallic">en temps réel.</span>
          </h2>
          <p
            className="mt-4 text-[17px] max-w-[55ch] mx-auto"
            style={{ color: 'color-mix(in srgb, var(--organic-text) 65%, transparent)' }}
          >
            Cliquez sur un scénario ci-dessous pour observer comment Raddlly qualifie, répond et conclut la vente en quelques secondes.
          </p>

          {/* Scenario Tabs Switcher */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {SCENARIOS.map((scenario) => {
              const isActive = scenario.id === activeTab
              return (
                <button
                  key={scenario.id}
                  onClick={() => setActiveTab(scenario.id)}
                  className="relative cursor-pointer rounded-full px-6 py-3 text-sm font-bold transition-all duration-300"
                  style={{
                    background: isActive ? 'var(--organic-text)' : 'var(--organic-surface)',
                    color: isActive ? 'var(--organic-bg)' : 'color-mix(in srgb, var(--organic-text) 65%, transparent)',
                    border: isActive ? 'none' : '1px solid color-mix(in srgb, var(--organic-text) 12%, transparent)',
                    boxShadow: isActive ? '0 4px 14px rgba(0,0,0,0.15)' : 'none',
                  }}
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
          className="rounded-3xl p-6 md:p-10 backdrop-blur-2xl shadow-2xl"
          style={{
            background: 'var(--organic-surface)',
            border: '1.5px solid color-mix(in srgb, var(--organic-text) 12%, transparent)',
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Visual Node Automation Flow */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div
                className="flex items-center justify-between pb-3"
                style={{ borderBottom: '1px solid color-mix(in srgb, var(--organic-text) 10%, transparent)' }}
              >
                <span className="text-xs font-mono uppercase tracking-widest font-bold text-amber-500">
                  Graphe de Décision IA
                </span>
                <span
                  className="text-xs font-mono"
                  style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}
                >
                  Canal : <strong style={{ color: 'var(--organic-text)' }}>{currentScenario.channel}</strong>
                </span>
              </div>

              <div className="flex flex-col gap-3 relative py-2">
                {currentScenario.nodes.map((node, i) => {
                  const isPassed = stepIndex >= i
                  const isCurrent = stepIndex === i
                  return (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-xl p-4 transition-all duration-300 flex items-start gap-3"
                      style={{
                        background: isCurrent
                          ? 'color-mix(in srgb, var(--organic-text) 8%, transparent)'
                          : 'color-mix(in srgb, var(--organic-text) 3%, transparent)',
                        border: isCurrent
                          ? '1px solid color-mix(in srgb, var(--organic-text) 20%, transparent)'
                          : '1px solid color-mix(in srgb, var(--organic-text) 8%, transparent)',
                      }}
                    >
                      <span
                        className="mt-0.5 grid size-6 place-content-center rounded-full text-[11px] font-bold font-mono shrink-0"
                        style={{
                          background: isPassed ? '#f59e0b' : 'color-mix(in srgb, var(--organic-text) 10%, transparent)',
                          color: isPassed ? '#000' : 'color-mix(in srgb, var(--organic-text) 50%, transparent)',
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold" style={{ color: 'var(--organic-text)' }}>{node.label}</span>
                          <span
                            className="font-mono text-[10px] px-2 py-0.5 rounded"
                            style={{
                              color: isPassed ? '#10b981' : 'color-mix(in srgb, var(--organic-text) 45%, transparent)',
                              background: 'color-mix(in srgb, var(--organic-text) 5%, transparent)',
                            }}
                          >
                            {isPassed ? node.status : 'En attente...'}
                          </span>
                        </div>
                        <p
                          className="mt-1 text-[11px] leading-relaxed"
                          style={{ color: 'color-mix(in srgb, var(--organic-text) 60%, transparent)' }}
                        >
                          {node.description}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Data Extracted Box */}
              <div
                className="mt-2 rounded-xl p-4"
                style={{
                  background: 'color-mix(in srgb, var(--organic-text) 4%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--organic-text) 8%, transparent)',
                }}
              >
                <span
                  className="block text-[10px] font-mono font-bold uppercase tracking-wider mb-2"
                  style={{ color: 'color-mix(in srgb, var(--organic-text) 50%, transparent)' }}
                >
                  ⚡️ Données Structurées Extraites en Temps Réel
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {currentScenario.extractedData.map((data) => (
                    <div key={data.key} className="flex flex-col">
                      <span
                        className="text-[9.5px] font-mono"
                        style={{ color: 'color-mix(in srgb, var(--organic-text) 45%, transparent)' }}
                      >
                        {data.key}
                      </span>
                      <span className="text-[11px] font-bold truncate" style={{ color: 'var(--organic-text)' }}>
                        {data.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Live Simulated Instagram / WhatsApp DM Window */}
            <div className="lg:col-span-7">
              <div
                className="rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  background: 'var(--organic-surface)',
                  border: '1.5px solid color-mix(in srgb, var(--organic-text) 12%, transparent)',
                }}
              >
                {/* Phone / Chat Header */}
                <div
                  className="flex items-center justify-between px-5 py-3.5"
                  style={{ borderBottom: '1px solid color-mix(in srgb, var(--organic-text) 10%, transparent)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="grid size-9 place-content-center rounded-full font-bold text-xs bg-amber-500/20 text-amber-500 border border-amber-500/30">
                        AI
                      </div>
                      <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500" />
                    </div>
                    <div>
                      <div className="text-xs font-bold" style={{ color: 'var(--organic-text)' }}>Raddlly AI Agent</div>
                      <div className="text-[11px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>Temps de réponse moyen : 1.4s</div>
                    </div>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-mono font-semibold"
                    style={{
                      color: 'var(--organic-text)',
                      background: 'color-mix(in srgb, var(--organic-text) 8%, transparent)',
                    }}
                  >
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
                        className="max-w-[85%] self-start rounded-2xl rounded-bl-xs p-4 text-xs leading-relaxed shadow-md"
                        style={{
                          background: 'color-mix(in srgb, var(--organic-text) 8%, transparent)',
                          border: '1px solid color-mix(in srgb, var(--organic-text) 12%, transparent)',
                          color: 'var(--organic-text)',
                        }}
                      >
                        <span
                          className="block text-[10px] font-mono font-bold mb-1 uppercase"
                          style={{ color: 'color-mix(in srgb, var(--organic-text) 50%, transparent)' }}
                        >
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
                        <span className="size-1.5 animate-bounce rounded-full bg-amber-500" />
                        <span className="size-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:0.2s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:0.4s]" />
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
                        className="max-w-[88%] self-end rounded-2xl rounded-br-xs p-4 text-xs leading-relaxed text-white shadow-xl bg-gradient-to-r from-amber-600 to-amber-700"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-amber-200 uppercase">
                            Raddlly Closer IA · 1.4s
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
