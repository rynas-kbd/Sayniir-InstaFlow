'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Scenario {
  id: string
  title: string
  userMessage: string
  oldBot: {
    reply: string
    status: string
    time: string
    badge: string
  }
  instaflow: {
    reply: string
    status: string
    time: string
    badge: string
  }
}

const SCENARIOS: Scenario[] = [
  {
    id: 'stock',
    title: '1. Demande de Stock',
    userMessage: 'Bonjour ! Est-ce que le manteau noir existe encore en Taille M ?',
    oldBot: {
      reply: '⚠️ Désolé, commande non reconnue. Tapez 1 pour suivre un colis, Tapez 2 pour voir la FAQ.',
      status: 'Prospect bloqué · Conversion 0%',
      time: 'Après 4 min',
      badge: 'Robot Rigide',
    },
    instaflow: {
      reply: 'Bonjour ! Oui, il nous reste exactement 2 pièces en Taille M ! Je vous prépare votre panier avec la livraison offerte ? 🎁',
      status: 'Lead qualifié · Lien d\'achat envoyé',
      time: '< 1.2s',
      badge: 'Closer IA Vente Directe',
    },
  },
  {
    id: 'abandon',
    title: '2. Panier Abandonné',
    userMessage: 'J\'ai hésité au moment de valider ma commande tout à l\'heure...',
    oldBot: {
      reply: 'Vos articles restent enregistrés dans votre navigateur pendant 24h.',
      status: 'Message passif sans relance',
      time: 'Le lendemain',
      badge: 'Message Automatique',
    },
    instaflow: {
      reply: 'Je comprends parfaitement ! Si c\'est la livraison qui vous fait hésiter, je peux vous offrir un code de -10% valable les 30 prochaines minutes : FLASH10 😉',
      status: 'Relance ciblée · Vente conclue',
      time: '< 1.4s',
      badge: 'Relance Intelligente',
    },
  },
  {
    id: 'pricing',
    title: '3. Objection Tarif',
    userMessage: 'C\'est un peu cher par rapport aux autres marques non ?',
    oldBot: {
      reply: 'Nos prix sont fermes et calculés au plus juste selon nos coûts de fabrication.',
      status: 'Réponse froide défensive',
      time: 'Après 2h',
      badge: 'Réponse Type',
    },
    instaflow: {
      reply: 'Je comprends votre réaction ! La différence vient du cuir italien garanti 5 ans et de la confection artisanale. Voulez-vous voir notre vidéo de fabrication ?',
      status: 'Valeur démontrée · Confiance établie',
      time: '< 1.1s',
      badge: 'Traiteur d\'Objection',
    },
  },
]

const FEATURES_CHECKLIST = [
  {
    feature: 'Temps de réponse',
    oldBot: 'Plusieurs minutes (ou réponse différée)',
    instaflow: 'Instantané (< 1.4 seconde 24/7)',
  },
  {
    feature: 'Intelligence contextuelle',
    oldBot: 'Boutons fixes & mots-clés stricts',
    instaflow: 'Compréhension du langage naturel humain',
  },
  {
    feature: 'Objectif final',
    oldBot: 'Décharger le support client',
    instaflow: 'Qualifier et conclure des ventes en DM',
  },
]

export function VisualDuel() {
  const [activeScenarioId, setActiveScenarioId] = useState<string>('stock')
  const activeScenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0]

  return (
    <section id="features" className="py-20 relative">
      <div className="mx-auto max-w-[1240px]">
        {/* Section Header */}
        <div className="mb-10 flex items-center gap-4">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-300 bg-zinc-800/80 border border-zinc-700/60 px-3 py-1 rounded-md shrink-0">
            [ COMPARATIF · RUPTURE TECHNIQUE ]
          </span>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-zinc-700/60 via-zinc-800 to-transparent" />
          <span className="font-mono text-xs text-zinc-500 hidden sm:inline-block shrink-0">
            // BOT 2019 VS INSTAFLOW 2026
          </span>
        </div>

        <div className="mb-10 max-w-[64ch]">
          <h2 className="font-heading text-[clamp(32px,3.8vw,50px)] font-extrabold leading-[1.15] text-zinc-100">
            Les chatbots de 2019 font fuir vos clients. <br />
            <span className="text-metallic">Instaflow les transforme en acheteurs.</span>
          </h2>
          <p className="mt-4 text-base text-zinc-400 leading-relaxed">
            Testez la différence entre un arbre de décision rigide et une IA conversationnelle entraînée pour vendre.
          </p>
        </div>

        {/* Interactive Scenario Selector Tabs */}
        <div className="mb-8 flex flex-wrap items-center gap-2.5">
          {SCENARIOS.map((s) => {
            const isActive = s.id === activeScenarioId
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveScenarioId(s.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 shadow-lg scale-[1.02]'
                    : 'bg-zinc-900/90 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {s.title}
              </button>
            )
          })}
        </div>

        {/* Live DM Side-by-Side Duel Playground */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScenario.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch"
          >
            {/* Left: 2019 Bot (Muted Mismatched Legacy Experience) */}
            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/90 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-zinc-600" />
                    <span className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      CHATBOT OBSOLÈTE (2019)
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-400 border border-zinc-800 px-2.5 py-0.5 rounded-full bg-zinc-900">
                    {activeScenario.oldBot.badge}
                  </span>
                </div>

                {/* Chat Simulated Bubbles */}
                <div className="space-y-4 font-sans text-xs">
                  {/* User Bubble */}
                  <div className="flex justify-end">
                    <div className="bg-zinc-800 text-zinc-200 px-4 py-2.5 rounded-2xl rounded-tr-xs max-w-[85%] leading-relaxed">
                      {activeScenario.userMessage}
                    </div>
                  </div>
                  {/* Bot Bubble */}
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-4 py-2.5 rounded-2xl rounded-tl-xs max-w-[85%] leading-relaxed">
                      {activeScenario.oldBot.reply}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-800/80 flex items-center justify-between font-mono text-[11px]">
                <span className="text-zinc-500 font-bold">✕ {activeScenario.oldBot.status}</span>
                <span className="text-zinc-500">{activeScenario.oldBot.time}</span>
              </div>
            </div>

            {/* Right: Instaflow AI Closer 2026 (Metallic Premium Experience) */}
            <div className="rounded-3xl border border-zinc-700 bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-zinc-950 p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-xs font-bold text-metallic uppercase tracking-wider">
                      INSTAFLOW CLOSER IA (2026)
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-200 border border-zinc-700 px-2.5 py-0.5 rounded-full bg-zinc-800 font-bold">
                    ✦ {activeScenario.instaflow.badge}
                  </span>
                </div>

                {/* Chat Simulated Bubbles */}
                <div className="space-y-4 font-sans text-xs">
                  {/* User Bubble */}
                  <div className="flex justify-end">
                    <div className="bg-zinc-800 text-zinc-200 px-4 py-2.5 rounded-2xl rounded-tr-xs max-w-[85%] leading-relaxed">
                      {activeScenario.userMessage}
                    </div>
                  </div>
                  {/* Instaflow Bubble */}
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 border border-zinc-700 text-zinc-100 px-4 py-2.5 rounded-2xl rounded-tl-xs max-w-[85%] leading-relaxed">
                      {activeScenario.instaflow.reply}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-zinc-800 flex items-center justify-between font-mono text-[11px]">
                <span className="text-emerald-400 font-bold">✓ {activeScenario.instaflow.status}</span>
                <span className="text-zinc-300 font-bold">{activeScenario.instaflow.time}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Feature Comparison Checklist */}
        <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES_CHECKLIST.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <span className="font-mono text-xs font-bold uppercase text-zinc-400">
                  {item.feature}
                </span>
                <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <span>✕</span>
                  <span>{item.oldBot}</span>
                </div>
                <div className="text-xs text-zinc-200 font-bold flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span>{item.instaflow}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
