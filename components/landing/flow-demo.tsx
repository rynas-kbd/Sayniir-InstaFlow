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
  const [mobileView, setMobileView] = useState<'canvas' | 'chat'>('canvas')
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
  const demoHeight = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], ['82vh', '100vh', '100vh', '82vh'])
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
      {/* Sticky Viewport Container reaching top edge under Navbar */}
      <div className="sticky top-0 flex flex-col justify-start items-center h-screen overflow-hidden">
        
        {/* FULLSCREEN EXPANDING GLASS STUDIO FRAME (Ultra Clean) */}
        <motion.div
          style={{
            width: demoWidth,
            height: demoHeight,
            borderRadius: demoBorderRadius,
            scale: demoScale,
          }}
          className="relative border-[1.5px] pt-14 pb-5 px-[clamp(12px,2.5vw,32px)] backdrop-blur-3xl shadow-2xl overflow-hidden flex flex-col justify-between"
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

          {/* Mobile Native View Switcher Bar (< 1024px) */}
          <div className="lg:hidden flex items-center justify-center mb-3 shrink-0">
            <div
              className="flex items-center gap-1 p-1 rounded-full border shadow-sm backdrop-blur-md"
              style={{
                borderColor: 'color-mix(in srgb, var(--organic-text) 14%, transparent)',
                background: 'color-mix(in srgb, var(--organic-surface) 85%, transparent)',
              }}
            >
              <button
                type="button"
                onClick={() => setMobileView('canvas')}
                className="relative px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors active:scale-95"
                style={{
                  color: mobileView === 'canvas' ? '#fff' : 'var(--organic-text)',
                  background: mobileView === 'canvas' ? 'var(--organic-terracotta)' : 'transparent',
                }}
              >
                ⚡ Studio Flow
              </button>
              <button
                type="button"
                onClick={() => setMobileView('chat')}
                className="relative px-3.5 py-1.5 text-xs font-bold rounded-full transition-colors active:scale-95 flex items-center gap-1.5"
                style={{
                  color: mobileView === 'chat' ? '#fff' : 'var(--organic-text)',
                  background: mobileView === 'chat' ? 'var(--organic-terracotta)' : 'transparent',
                }}
              >
                <span>💬 Simulation DM</span>
                {visibleIndex > 0 && (
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* Main Studio Grid: Flow Canvas + DM Conversation Box */}
          <div className="lp-flow-grid grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] items-center gap-[clamp(16px,3vw,36px)] h-full w-full overflow-hidden">
            {/* Left: Interactive Canvas */}
            <div className={`flex-col h-full justify-between ${mobileView === 'canvas' ? 'flex' : 'hidden lg:flex'}`}>
              <div
                className="relative h-[calc(100%-54px)] min-h-[300px] sm:min-h-[360px] w-full max-w-[760px] mx-auto rounded-2xl border shadow-2xl overflow-hidden flex items-center justify-center"
                style={{
                  borderColor: 'color-mix(in srgb, var(--organic-text) 16%, transparent)',
                  background: 'radial-gradient(circle, color-mix(in srgb, var(--organic-text) 8%, transparent) 1px, transparent 1px) 0 0 / 18px 18px, var(--organic-surface)',
                }}
              >
                {/* Auto-scaling container so all nodes fit on 320px-1200px screens */}
                <div className="relative w-[640px] h-[370px] shrink-0 origin-center scale-[0.50] min-[370px]:scale-[0.58] min-[430px]:scale-[0.68] sm:scale-[0.82] md:scale-95 lg:scale-100 transition-transform duration-300">
                  {/* SVG Cables & Connections */}
                  <svg width={640} height={370} viewBox="0 0 640 370" fill="none" className="absolute inset-0 m-auto">
                    {/* Path 1: Trigger -> AI */}
                    <path d="M180 96 C212 96 208 56 240 56" stroke="color-mix(in srgb, var(--organic-text) 22%, transparent)" strokeWidth={3} />
                    <motion.path
                      d="M180 96 C212 96 208 56 240 56"
                      stroke="var(--organic-terracotta)"
                      strokeWidth={4.5}
                      style={{ filter: 'drop-shadow(0 0 6px var(--organic-terracotta))' }}
                      animate={{ pathLength: path1Length }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />

                    {/* Path 2: AI -> Qualify */}
                    <path d="M320 92 C320 136 320 156 320 200" stroke="color-mix(in srgb, var(--organic-text) 22%, transparent)" strokeWidth={3} />
                    <motion.path
                      d="M320 92 C320 136 320 156 320 200"
                      stroke="var(--organic-terracotta)"
                      strokeWidth={4.5}
                      style={{ filter: 'drop-shadow(0 0 6px var(--organic-terracotta))' }}
                      animate={{ pathLength: path2Length }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />

                    {/* Path 3: Qualify -> Capture (OUI) */}
                    <path d="M400 236 C432 236 428 176 460 176" stroke="color-mix(in srgb, var(--organic-text) 22%, transparent)" strokeWidth={3} />
                    <motion.path
                      d="M400 236 C432 236 428 176 460 176"
                      stroke="#10b981"
                      strokeWidth={4.5}
                      style={{ filter: 'drop-shadow(0 0 6px #10b981)' }}
                      animate={{ pathLength: path3Length }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />

                    {/* Path 4: Qualify -> Handoff (NON) */}
                    <path
                      d="M400 236 C432 236 428 296 460 296"
                      stroke="color-mix(in srgb, var(--organic-text) 25%, transparent)"
                      strokeWidth={3}
                      strokeDasharray="6 6"
                    />

                    <text x={422} y={192} fill="#10b981" fontSize={12} fontWeight={900} letterSpacing={1}>
                      OUI
                    </text>
                    <text x={422} y={288} fill="#ef4444" fontSize={12} fontWeight={900} letterSpacing={1}>
                      NON
                    </text>
                  </svg>

                  {/* Node Buttons */}
                  {FLOW_NODES.map((n) => {
                    const isSelected = selectedNodeId === n.id
                    const isActive = activeNodeId === n.id
                    return (
                      <motion.button
                        key={n.id}
                        type="button"
                        onClick={() => setSelectedNodeId(n.id)}
                        className="lp-node-btn absolute w-40 rounded-xl border-2 p-3 text-left font-sans cursor-pointer shadow-lg active:scale-95"
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
                              ? '#10b981'
                              : 'color-mix(in srgb, var(--organic-text) 20%, transparent)',
                          boxShadow: isActive
                            ? '0 0 0 6px color-mix(in srgb, var(--organic-terracotta) 26%, transparent), 0 8px 24px rgba(0,0,0,0.15)'
                            : isSelected
                            ? '0 0 0 4px rgba(16, 185, 129, 0.25)'
                            : '0 4px 12px rgba(0,0,0,0.06)',
                        }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{
                              background:
                                n.tone === 'a' ? 'var(--organic-terracotta)' : '#10b981',
                            }}
                          />
                          <strong className="text-xs font-extrabold text-[var(--organic-text)]">{n.label}</strong>
                        </span>
                        <span
                          className="block text-[10.5px] font-medium mt-1 leading-tight"
                          style={{ color: 'color-mix(in srgb, var(--organic-text) 72%, transparent)' }}
                        >
                          {n.sub}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Node Inspector Footer */}
              <div
                className="mt-2.5 flex items-center gap-3 rounded-xl border p-[10px_14px] text-xs font-mono shrink-0 shadow-sm"
                style={{
                  borderColor: 'color-mix(in srgb, var(--organic-text) 14%, transparent)',
                  background: 'var(--organic-bg)',
                }}
              >
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
              className={`overflow-hidden rounded-[26px] border-[1.5px] shadow-xl h-full flex-col justify-between ${mobileView === 'chat' ? 'flex' : 'hidden lg:flex'}`}
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
