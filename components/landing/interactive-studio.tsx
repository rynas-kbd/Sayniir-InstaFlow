'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useT } from '@/components/i18n-provider'

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

export function InteractiveStudio() {
  const [activeTab, setActiveTab] = useState<string>('ecommerce')
  const [stepIndex, setStepIndex] = useState<number>(0)
  const chatRef = useRef<HTMLDivElement>(null)
  const t = useT()

  // Build scenarios from translations
  const SCENARIOS: StudioScenario[] = [
    {
      id: 'ecommerce',
      title: t('landing.scenarios.ecommerce.label'),
      channel: 'Instagram DM',
      channelColor: '#E1306C',
      userMessage: t('landing.scenarios.ecommerce.userMessage'),
      confidence: 98,
      nodes: [
        {
          id: 'n1',
          label: t('landing.scenarios.ecommerce.nodes.intentDetection.label'),
          status: t('landing.scenarios.ecommerce.nodes.intentDetection.status'),
          description: t('landing.scenarios.ecommerce.nodes.intentDetection.hint'),
        },
        {
          id: 'n2',
          label: t('landing.scenarios.ecommerce.nodes.productSearch.label'),
          status: t('landing.scenarios.ecommerce.nodes.productSearch.status'),
          description: t('landing.scenarios.ecommerce.nodes.productSearch.hint'),
        },
        {
          id: 'n3',
          label: t('landing.scenarios.ecommerce.nodes.stockCheck.label'),
          status: t('landing.scenarios.ecommerce.nodes.stockCheck.status'),
          description: t('landing.scenarios.ecommerce.nodes.stockCheck.hint'),
        },
        {
          id: 'n4',
          label: t('landing.scenarios.ecommerce.nodes.orderCreation.label'),
          status: t('landing.scenarios.ecommerce.nodes.orderCreation.status'),
          description: t('landing.scenarios.ecommerce.nodes.orderCreation.hint'),
        },
      ],
      aiResponse: t('landing.scenarios.ecommerce.aiResponse'),
      extractedData: [
        {
          key: t('landing.scenarios.ecommerce.extractedData.product.key'),
          value: t('landing.scenarios.ecommerce.extractedData.product.value'),
        },
        {
          key: t('landing.scenarios.ecommerce.extractedData.size.key'),
          value: t('landing.scenarios.ecommerce.extractedData.size.value'),
        },
        {
          key: t('landing.scenarios.ecommerce.extractedData.quantity.key'),
          value: t('landing.scenarios.ecommerce.extractedData.quantity.value'),
        },
      ],
    },
    {
      id: 'appointment',
      title: t('landing.scenarios.appointment.label'),
      channel: 'WhatsApp',
      channelColor: '#25D366',
      userMessage: t('landing.scenarios.appointment.userMessage'),
      confidence: 96,
      nodes: [
        {
          id: 'n1',
          label: t('landing.scenarios.appointment.nodes.intentDetection.label'),
          status: t('landing.scenarios.appointment.nodes.intentDetection.status'),
          description: t('landing.scenarios.appointment.nodes.intentDetection.hint'),
        },
        {
          id: 'n2',
          label: t('landing.scenarios.appointment.nodes.availabilityCheck.label'),
          status: t('landing.scenarios.appointment.nodes.availabilityCheck.status'),
          description: t('landing.scenarios.appointment.nodes.availabilityCheck.hint'),
        },
        {
          id: 'n3',
          label: t('landing.scenarios.appointment.nodes.slotProposal.label'),
          status: t('landing.scenarios.appointment.nodes.slotProposal.status'),
          description: t('landing.scenarios.appointment.nodes.slotProposal.hint'),
        },
        {
          id: 'n4',
          label: t('landing.scenarios.appointment.nodes.bookingConfirmation.label'),
          status: t('landing.scenarios.appointment.nodes.bookingConfirmation.status'),
          description: t('landing.scenarios.appointment.nodes.bookingConfirmation.hint'),
        },
      ],
      aiResponse: t('landing.scenarios.appointment.aiResponse'),
      extractedData: [
        {
          key: t('landing.scenarios.appointment.extractedData.type.key'),
          value: t('landing.scenarios.appointment.extractedData.type.value'),
        },
        {
          key: t('landing.scenarios.appointment.extractedData.timeframe.key'),
          value: t('landing.scenarios.appointment.extractedData.timeframe.value'),
        },
        {
          key: t('landing.scenarios.appointment.extractedData.contact.key'),
          value: t('landing.scenarios.appointment.extractedData.contact.value'),
        },
      ],
    },
    {
      id: 'leadQualification',
      title: t('landing.scenarios.leadQualification.label'),
      channel: 'Messenger',
      channelColor: '#0084FF',
      userMessage: t('landing.scenarios.leadQualification.userMessage'),
      confidence: 99,
      nodes: [
        {
          id: 'n1',
          label: t('landing.scenarios.leadQualification.nodes.intentDetection.label'),
          status: t('landing.scenarios.leadQualification.nodes.intentDetection.status'),
          description: t('landing.scenarios.leadQualification.nodes.intentDetection.hint'),
        },
        {
          id: 'n2',
          label: t('landing.scenarios.leadQualification.nodes.leadScoring.label'),
          status: t('landing.scenarios.leadQualification.nodes.leadScoring.status'),
          description: t('landing.scenarios.leadQualification.nodes.leadScoring.hint'),
        },
        {
          id: 'n3',
          label: t('landing.scenarios.leadQualification.nodes.infoCollection.label'),
          status: t('landing.scenarios.leadQualification.nodes.infoCollection.status'),
          description: t('landing.scenarios.leadQualification.nodes.infoCollection.hint'),
        },
        {
          id: 'n4',
          label: t('landing.scenarios.leadQualification.nodes.handoff.label'),
          status: t('landing.scenarios.leadQualification.nodes.handoff.status'),
          description: t('landing.scenarios.leadQualification.nodes.handoff.hint'),
        },
      ],
      aiResponse: t('landing.scenarios.leadQualification.aiResponse'),
      extractedData: [
        {
          key: t('landing.scenarios.leadQualification.extractedData.intent.key'),
          value: t('landing.scenarios.leadQualification.extractedData.intent.value'),
        },
        {
          key: t('landing.scenarios.leadQualification.extractedData.score.key'),
          value: t('landing.scenarios.leadQualification.extractedData.score.value'),
        },
        {
          key: t('landing.scenarios.leadQualification.extractedData.status.key'),
          value: t('landing.scenarios.leadQualification.extractedData.status.value'),
        },
      ],
    },
  ]

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
            {t('landing.interactiveStudio.sectionTag')}
          </span>
          <h2
            className="font-heading text-[clamp(32px,4vw,54px)] font-extrabold leading-tight"
            style={{ color: 'var(--organic-text)' }}
          >
            {t('landing.interactiveStudio.title')} <br />
            <span className="text-metallic">{t('landing.interactiveStudio.titleHighlight')}</span>
          </h2>
          <p
            className="mt-4 text-[17px] max-w-[55ch] mx-auto"
            style={{ color: 'color-mix(in srgb, var(--organic-text) 65%, transparent)' }}
          >
            {t('landing.interactiveStudio.subtitle')}
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
                  {t('landing.interactiveStudio.decisionGraph')}
                </span>
                <span
                  className="text-xs font-mono"
                  style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}
                >
                  {t('landing.interactiveStudio.scenario')} : <strong style={{ color: 'var(--organic-text)' }}>{currentScenario.channel}</strong>
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
                  {t('landing.interactiveStudio.dataExtracted')}
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
                      <div className="text-xs font-bold" style={{ color: 'var(--organic-text)' }}>{t('landing.interactiveStudio.aiAgent')}</div>
                      <div className="text-[11px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>{t('landing.interactiveStudio.responseTime')}</div>
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
                          {t('landing.interactiveStudio.userLabel')} · DM {currentScenario.channel}
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