'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SectionHeader } from './chrome'

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
    id: 'price-objection',
    title: '1. Question sur le Prix',
    userMessage: 'C’est trop cher pour moi votre offre...',
    oldBot: {
      reply: 'Merci de votre message ! Consultez nos tarifs sur notre-site.com/tarifs ou tapez 1 pour parler au support.',
      status: 'Prospect Perdu (Bounce)',
      time: 'Instant (Robot)',
      badge: 'Bouton pré-enregistré',
    },
    instaflow: {
      reply: 'Je comprends parfaitement ! Qu’est-ce qui vous fait le plus hésiter ? Si la tréso est serrée, on a une option de paiement en 3x sans frais. Je vous explique ?',
      status: 'Vente Conclue (Paiement 3x)',
      time: '1.2 seconde (IA)',
      badge: 'Négociation Empathique',
    },
  },
  {
    id: 'availability',
    title: '2. DM à 2h du Matin',
    userMessage: 'Salut ! Vous avez du stock sur le modèle Noir M ? Je veux commander tout de suite.',
    oldBot: {
      reply: 'Nos bureaux sont fermés. Heures d’ouverture : Lundi-Vendredi 9h-18h.',
      status: 'Abandon de Panier',
      time: '8 heures de retard',
      badge: 'Message d’absence',
    },
    instaflow: {
      reply: 'Oui ! Il en reste exactement 3 en stock en Noir M ⚡️ Voici le lien direct avec livraison offerte expédiée demain matin : instaflow.shop/checkout?sku=BLK-M',
      status: 'Paiement Effectué à 02h04',
      time: '1.4 seconde (IA)',
      badge: 'Conversion Instantanée',
    },
  },
  {
    id: 'qualification',
    title: '3. Lead Immolier / B2B',
    userMessage: 'Je cherche à faire rénover mon appartement de 80m² sur Paris.',
    oldBot: {
      reply: 'Veuillez remplir notre formulaire de contact sur notre-site.com/contact-form-long-complex',
      status: 'Formulaire Abandonné (0.2% conv)',
      time: 'Lien sortant',
      badge: 'Redirection Web',
    },
    instaflow: {
      reply: 'Projet canon ! Quel est votre budget estimé et votre délai idéal ? Je peux vous fixer un rdv de 15min directement avec notre architecte ce jeudi.',
      status: 'RDV Qualifié sur Calendly',
      time: '1.1 seconde (IA)',
      badge: 'Qualification & Closing',
    },
  },
]

const FEATURES_CHECKLIST = [
  {
    feature: 'Compréhension du contexte',
    oldBot: 'Mot-clé exact uniquement',
    instaflow: 'Compréhension du langage naturel humain',
  },
  {
    feature: 'Objectif de la conversation',
    oldBot: 'Rediriger vers un lien web',
    instaflow: 'Qualifier et conclure des ventes en DM',
  },
  {
    feature: 'Mémoire & Personnalisation',
    oldBot: 'Zéro mémoire entre 2 messages',
    instaflow: 'Se souvient de chaque client & produit',
  },
]

export function VisualDuel() {
  const [activeScenarioId, setActiveScenarioId] = useState<string>('price-objection')

  const activeScenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0]

  return (
    <section id="features" className="py-20 relative">
      <div className="mx-auto max-w-[1240px]">
        {/* Section Header */}
        <SectionHeader kicker="COMPARATIF · RUPTURE TECHNIQUE" note="BOT 2019 VS INSTAFLOW 2026" />

        <div className="mb-10 max-w-[64ch]">
          <h2
            className="font-heading text-[clamp(32px,3.8vw,50px)] font-extrabold leading-[1.15]"
            style={{ color: 'var(--organic-text)' }}
          >
            Les chatbots de 2019 font fuir vos clients. <br />
            <span className="text-metallic">Instaflow les transforme en acheteurs.</span>
          </h2>
          <p
            className="mt-4 text-base leading-relaxed"
            style={{ color: 'color-mix(in srgb, var(--organic-text) 65%, transparent)' }}
          >
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
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                style={{
                  background: isActive ? 'var(--organic-text)' : 'var(--organic-surface)',
                  color: isActive ? 'var(--organic-bg)' : 'color-mix(in srgb, var(--organic-text) 65%, transparent)',
                  border: isActive ? 'none' : '1px solid color-mix(in srgb, var(--organic-text) 12%, transparent)',
                }}
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
            <div
              className="rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden"
              style={{
                background: 'var(--organic-surface)',
                border: '1.5px solid color-mix(in srgb, var(--organic-text) 10%, transparent)',
              }}
            >
              <div>
                <div
                  className="flex items-center justify-between pb-4 mb-5"
                  style={{ borderBottom: '1px solid color-mix(in srgb, var(--organic-text) 10%, transparent)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-zinc-400" />
                    <span
                      className="font-mono text-xs font-bold uppercase tracking-wider"
                      style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}
                    >
                      CHATBOT OBSOLÈTE (2019)
                    </span>
                  </div>
                  <span
                    className="font-mono text-[11px] px-2.5 py-0.5 rounded-full"
                    style={{
                      color: 'color-mix(in srgb, var(--organic-text) 50%, transparent)',
                      background: 'color-mix(in srgb, var(--organic-text) 5%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--organic-text) 10%, transparent)',
                    }}
                  >
                    {activeScenario.oldBot.badge}
                  </span>
                </div>

                {/* Chat Simulated Bubbles */}
                <div className="space-y-4 font-sans text-xs">
                  {/* User Bubble */}
                  <div className="flex justify-end">
                    <div
                      className="px-4 py-2.5 rounded-2xl rounded-tr-xs max-w-[85%] leading-relaxed"
                      style={{
                        background: 'color-mix(in srgb, var(--organic-text) 12%, transparent)',
                        color: 'var(--organic-text)',
                      }}
                    >
                      {activeScenario.userMessage}
                    </div>
                  </div>
                  {/* Bot Bubble */}
                  <div className="flex justify-start">
                    <div
                      className="px-4 py-2.5 rounded-2xl rounded-tl-xs max-w-[85%] leading-relaxed"
                      style={{
                        background: 'color-mix(in srgb, var(--organic-text) 5%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--organic-text) 8%, transparent)',
                        color: 'color-mix(in srgb, var(--organic-text) 65%, transparent)',
                      }}
                    >
                      {activeScenario.oldBot.reply}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="mt-8 pt-4 flex items-center justify-between font-mono text-[11px]"
                style={{ borderTop: '1px solid color-mix(in srgb, var(--organic-text) 10%, transparent)' }}
              >
                <span className="text-red-400 font-bold">✕ {activeScenario.oldBot.status}</span>
                <span style={{ color: 'color-mix(in srgb, var(--organic-text) 45%, transparent)' }}>{activeScenario.oldBot.time}</span>
              </div>
            </div>

            {/* Right: Instaflow AI Closer 2026 (Metallic Premium Experience) */}
            <div
              className="rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden"
              style={{
                background: 'var(--organic-surface)',
                border: '1.5px solid color-mix(in srgb, var(--organic-text) 14%, transparent)',
              }}
            >
              <div>
                <div
                  className="flex items-center justify-between pb-4 mb-5"
                  style={{ borderBottom: '1px solid color-mix(in srgb, var(--organic-text) 10%, transparent)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-xs font-bold text-metallic uppercase tracking-wider">
                      INSTAFLOW CLOSER IA (2026)
                    </span>
                  </div>
                  <span
                    className="font-mono text-[11px] px-2.5 py-0.5 rounded-full font-bold"
                    style={{
                      color: 'var(--organic-text)',
                      background: 'color-mix(in srgb, var(--organic-text) 8%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--organic-text) 14%, transparent)',
                    }}
                  >
                    ✦ {activeScenario.instaflow.badge}
                  </span>
                </div>

                {/* Chat Simulated Bubbles */}
                <div className="space-y-4 font-sans text-xs">
                  {/* User Bubble */}
                  <div className="flex justify-end">
                    <div
                      className="px-4 py-2.5 rounded-2xl rounded-tr-xs max-w-[85%] leading-relaxed"
                      style={{
                        background: 'color-mix(in srgb, var(--organic-text) 12%, transparent)',
                        color: 'var(--organic-text)',
                      }}
                    >
                      {activeScenario.userMessage}
                    </div>
                  </div>
                  {/* Instaflow Bubble */}
                  <div className="flex justify-start">
                    <div
                      className="px-4 py-2.5 rounded-2xl rounded-tl-xs max-w-[85%] leading-relaxed"
                      style={{
                        background: 'color-mix(in srgb, var(--organic-text) 6%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--organic-text) 12%, transparent)',
                        color: 'var(--organic-text)',
                      }}
                    >
                      {activeScenario.instaflow.reply}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="mt-8 pt-4 flex items-center justify-between font-mono text-[11px]"
                style={{ borderTop: '1px solid color-mix(in srgb, var(--organic-text) 10%, transparent)' }}
              >
                <span className="text-emerald-400 font-bold">✓ {activeScenario.instaflow.status}</span>
                <span className="font-bold" style={{ color: 'var(--organic-text)' }}>{activeScenario.instaflow.time}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Feature Comparison Checklist */}
        <div
          className="mt-10 rounded-2xl p-6"
          style={{
            background: 'var(--organic-surface)',
            border: '1.5px solid color-mix(in srgb, var(--organic-text) 10%, transparent)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES_CHECKLIST.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <span
                  className="font-mono text-xs font-bold uppercase"
                  style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}
                >
                  {item.feature}
                </span>
                <div
                  className="text-xs flex items-center gap-1.5"
                  style={{ color: 'color-mix(in srgb, var(--organic-text) 45%, transparent)' }}
                >
                  <span>✕</span>
                  <span>{item.oldBot}</span>
                </div>
                <div className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--organic-text)' }}>
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
