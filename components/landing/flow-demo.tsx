'use client'

import { useRef, useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import { FLOW_NODES, FLOW_STEPS, type FlowStep } from '@/lib/landing-content'

const MSG_STYLE: Record<FlowStep['kind'], React.CSSProperties> = {
  in: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    background: 'var(--organic-sand-200)',
    color: 'var(--organic-text)',
    borderRadius: '18px 18px 18px 4px',
    padding: '10px 14px',
    fontSize: 13.5,
    lineHeight: 1.5,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  out: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    background: 'var(--organic-terracotta-700)',
    color: '#ffffff',
    borderRadius: '18px 18px 4px 18px',
    padding: '10px 14px',
    fontSize: 13.5,
    lineHeight: 1.5,
    boxShadow: '0 2px 8px color-mix(in srgb, var(--organic-terracotta) 25%, transparent)',
  },
  sys: {
    alignSelf: 'center',
    background: 'color-mix(in srgb, var(--organic-sage-200) 85%, transparent)',
    color: 'var(--organic-sage-900)',
    border: '1.5px solid var(--organic-sage-400)',
    borderRadius: 999,
    padding: '7px 16px',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '.03em',
  },
}

export function FlowDemo() {
  const sectionRef = useRef<HTMLElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const [visibleIndex, setVisibleIndex] = useState(0)
  const [selectedNodeId, setSelectedNodeId] = useState<string>('ai')
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const isDark = !mounted || resolvedTheme === 'dark'
  const screenBlend: React.CSSProperties['mixBlendMode'] = isDark ? 'screen' : 'multiply'
  const lightenBlend: React.CSSProperties['mixBlendMode'] = isDark ? 'lighten' : 'multiply'

  // Longer scroll distance for extended, unhurried demonstration
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })

  // Fullscreen Zoom Transforms (cleared of clutter)
  const demoWidth = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], ['86%', '100vw', '100vw', '86%'])
  const demoHeight = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], ['82vh', 'calc(100vh - 54px)', 'calc(100vh - 54px)', '82vh'])
  const demoBorderRadius = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], ['32px', '0px', '0px', '32px'])
  const demoScale = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0.94, 1, 1, 0.94])

  // Step progress mapped over 10 dialogue steps
  const stepProgress = useTransform(scrollYProgress, [0.12, 0.85], [0, FLOW_STEPS.length])

  useMotionValueEvent(stepProgress, 'change', (latest) => {
    const idx = Math.min(FLOW_STEPS.length, Math.max(0, Math.floor(latest)))
    setVisibleIndex(idx)
  })

  // Determine currently active node based on scroll step index
  const activeStep = visibleIndex > 0 ? FLOW_STEPS[visibleIndex - 1] : null
  const activeNodeId = activeStep ? activeStep.node : null

  // Auto scroll chat box when messages change
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [visibleIndex])

  // Current visible messages array
  const visibleMessages = FLOW_STEPS.slice(0, visibleIndex)
  const selectedNode = FLOW_NODES.find((n) => n.id === selectedNodeId)

  // Cable progress calculation based on active step
  const path1Length = visibleIndex >= 2 ? 1 : visibleIndex === 1 ? 0.5 : 0
  const path2Length = visibleIndex >= 4 ? 1 : visibleIndex >= 2 ? 0.6 : 0
  const path3Length = visibleIndex >= 6 ? 1 : visibleIndex >= 4 ? 0.5 : 0

  return (
    <section ref={sectionRef} id="product" className="relative h-[400vh] w-screen left-1/2 -translate-x-1/2">
      {/* Sticky Viewport Container directly flush underneath Navbar */}
      <div className="sticky top-[54px] flex flex-col justify-start items-center h-[calc(100vh-54px)] overflow-hidden">
        
        {/* FULLSCREEN EXPANDING GLASS STUDIO FRAME (Ultra Clean) */}
        <motion.div
          style={{
            width: demoWidth,
            height: demoHeight,
            borderRadius: demoBorderRadius,
            scale: demoScale,
          }}
          className="relative border-[1.5px] p-[clamp(16px,2.8vw,32px)] backdrop-blur-3xl shadow-2xl overflow-hidden flex flex-col justify-between"
          aria-label="Studio Flow Plein Écran"
        >
          {/* Phantom Arc - Aura Gradient Background Layers */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse 120% 145% at 50% -50%, rgba(0,0,0,0) 60%, rgb(12,24,210) 78%, rgba(0,0,0,0) 85%)',
              mixBlendMode: screenBlend,
              filter: 'blur(72px)',
              pointerEvents: 'none',
              transform: 'translateZ(0)',
            }}
            aria-hidden="true"
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse 120% 145% at 50% -50%, rgba(0,0,0,0) 55%, rgba(12,24,210,0.4) 80%, rgba(0,0,0,0) 100%)',
              mixBlendMode: screenBlend,
              filter: 'blur(252px)',
              opacity: 0.9,
              pointerEvents: 'none',
              transform: 'translateZ(0)',
            }}
            aria-hidden="true"
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse 120% 145% at 50% -50%, rgba(0,0,0,0) 83.5%, #c8a8a6 84.5%, rgba(0,0,0,0) 85.5%)',
              mixBlendMode: lightenBlend,
              filter: 'blur(72px)',
              opacity: 0.8,
              pointerEvents: 'none',
              transform: 'translateZ(0)',
            }}
            aria-hidden="true"
          />

          {/* Top light shimmer bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--organic-terracotta)] to-transparent opacity-80" />

          {/* Main Studio Grid: Flow Canvas + DM Conversation Box */}
          <div className="lp-flow-grid grid grid-cols-[minmax(0,1fr)_340px] items-center gap-[clamp(20px,3vw,36px)] h-full w-full overflow-hidden">
            {/* Left: Interactive Canvas */}
            <div className="flex flex-col h-full justify-between overflow-x-auto">
              <div className="relative h-[calc(100%-54px)] min-h-[360px] w-full max-w-[760px] mx-auto rounded-2xl border border-[var(--organic-sand-200)] bg-[color-mix(in_srgb,var(--organic-bg)_92%,transparent)] shadow-inner flex items-center justify-center">
                {/* SVG Cables & Connections */}
                <svg width={640} height={370} viewBox="0 0 640 370" fill="none" className="absolute inset-0 m-auto">
                  {/* Path 1: Trigger -> AI */}
                  <path d="M180 96 C212 96 208 56 240 56" stroke="var(--organic-sand-300)" strokeWidth={2.5} />
                  <motion.path
                    d="M180 96 C212 96 208 56 240 56"
                    stroke="var(--organic-terracotta)"
                    strokeWidth={3.5}
                    animate={{ pathLength: path1Length }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />

                  {/* Path 2: AI -> Qualify */}
                  <path d="M320 92 C320 136 320 156 320 200" stroke="var(--organic-sand-300)" strokeWidth={2.5} />
                  <motion.path
                    d="M320 92 C320 136 320 156 320 200"
                    stroke="var(--organic-terracotta)"
                    strokeWidth={3.5}
                    animate={{ pathLength: path2Length }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />

                  {/* Path 3: Qualify -> Capture (OUI) */}
                  <path d="M400 236 C432 236 428 176 460 176" stroke="var(--organic-sand-300)" strokeWidth={2.5} />
                  <motion.path
                    d="M400 236 C432 236 428 176 460 176"
                    stroke="var(--organic-sage-500)"
                    strokeWidth={3.5}
                    animate={{ pathLength: path3Length }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />

                  {/* Path 4: Qualify -> Handoff (NON) */}
                  <path
                    d="M400 236 C432 236 428 296 460 296"
                    stroke="var(--organic-sand-300)"
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                  />

                  <text x={422} y={194} fill="var(--organic-sage-800)" fontSize={11} fontWeight={800} letterSpacing={1}>
                    OUI
                  </text>
                  <text x={422} y={288} fill="var(--organic-sage-800)" fontSize={11} fontWeight={800} letterSpacing={1}>
                    NON
                  </text>
                </svg>

                {/* Node Buttons */}
                <div className="relative w-[640px] h-[370px] shrink-0">
                  {FLOW_NODES.map((n) => {
                    const isSelected = selectedNodeId === n.id
                    const isActive = activeNodeId === n.id
                    return (
                      <motion.button
                        key={n.id}
                        type="button"
                        onClick={() => setSelectedNodeId(n.id)}
                        className="lp-node-btn absolute w-40 rounded-[var(--radius-lg)] border-[1.5px] p-[12px_14px] text-left font-sans cursor-pointer shadow-md"
                        style={{
                          left: n.x,
                          top: n.y,
                          background: 'var(--organic-bg)',
                        }}
                        animate={{
                          scale: isActive ? 1.08 : isSelected ? 1.03 : 1,
                          borderColor:
                            isActive
                              ? 'var(--organic-terracotta)'
                              : isSelected
                              ? 'var(--organic-terracotta-500)'
                              : 'var(--organic-sand-300)',
                          borderWidth: isActive || isSelected ? 2 : 1.5,
                          boxShadow: isActive
                            ? '0 0 0 6px color-mix(in srgb, var(--organic-terracotta) 26%, transparent), var(--organic-shadow-md)'
                            : isSelected
                            ? '0 4px 18px color-mix(in srgb, var(--organic-terracotta) 18%, transparent)'
                            : 'var(--organic-shadow-sm)',
                        }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="size-[10px] shrink-0 rounded-full"
                            style={{
                              background:
                                n.tone === 'a' ? 'var(--organic-terracotta)' : 'var(--organic-sage-500)',
                            }}
                          />
                          <span className="text-sm font-bold text-[var(--organic-text)]">{n.label}</span>
                        </span>
                        <span
                          className="mt-[3px] block text-left text-xs"
                          style={{ color: 'color-mix(in srgb, var(--organic-text) 62%, transparent)' }}
                        >
                          {n.sub}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Node Information Bar */}
              <div className="mt-3 min-h-[44px] w-full max-w-[760px] mx-auto rounded-xl border border-[var(--organic-terracotta-300)] p-3 text-xs md:text-sm leading-[1.5] bg-[color-mix(in_srgb,var(--organic-sand-100)_60%,transparent)] flex items-start gap-3 shrink-0">
                <span className="text-base">ℹ️</span>
                <div>
                  <strong className="font-bold text-[var(--organic-text)]">
                    {selectedNode ? selectedNode.label : ''}
                  </strong>
                  <span style={{ color: 'color-mix(in srgb, var(--organic-text) 74%, transparent)' }}>
                    {' '}
                    — {selectedNode ? selectedNode.desc : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Clean DM Conversation Window */}
            <div
              className="overflow-hidden rounded-[26px] border-[1.5px] shadow-xl h-full flex flex-col justify-between"
              style={{
                borderColor: 'var(--organic-sand-300)',
                background: 'var(--organic-bg)',
              }}
            >
              {/* Chat Header */}
              <div
                className="flex items-center justify-between border-b-[1.5px] p-[14px_18px] shrink-0"
                style={{ borderColor: 'var(--organic-sand-200)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid size-9 place-content-center rounded-full text-xs font-bold shadow-inner"
                    style={{
                      background: 'var(--organic-sage-300)',
                      color: 'var(--organic-sage-900)',
                    }}
                  >
                    M
                  </div>
                  <div>
                    <div className="text-[13.5px] font-bold text-[var(--organic-text)]">Maya · @homefolk</div>
                    <div
                      className="text-[11.5px] font-medium"
                      style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}
                    >
                      DM Instagram
                    </div>
                  </div>
                </div>
                <span className="size-2.5 rounded-full bg-[var(--organic-sage-500)] animate-pulse" />
              </div>

              {/* Chat Messages */}
              <div ref={chatRef} className="flex-1 flex flex-col gap-3 overflow-y-auto p-4.5">
                <AnimatePresence mode="popLayout">
                  {visibleMessages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.88, y: 12, originX: m.kind === 'out' ? 1 : 0.5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85, y: -8 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      style={MSG_STYLE[m.kind]}
                    >
                      {m.text}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {visibleIndex === 0 && (
                  <p
                    className="text-center text-xs my-auto py-12"
                    style={{ color: 'color-mix(in srgb, var(--organic-text) 45%, transparent)' }}
                  >
                    Défilez vers le bas pour démarrer la démo…
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
