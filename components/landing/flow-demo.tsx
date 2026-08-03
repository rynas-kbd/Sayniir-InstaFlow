'use client'

import { useEffect, useRef, useState } from 'react'
import { FLOW_NODES, FLOW_STEPS, type FlowStep } from '@/lib/landing-content'

const AUTO_RUN_DELAY_MS = 1400

const MSG_STYLE: Record<FlowStep['kind'], React.CSSProperties> = {
  in: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    background: 'var(--organic-sand-200)',
    borderRadius: '16px 16px 16px 4px',
    padding: '9px 13px',
    fontSize: 13.5,
    lineHeight: 1.5,
    animation: 'popIn .3s ease both',
  },
  out: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    background: 'var(--organic-terracotta-700)',
    color: 'var(--organic-terracotta-100)',
    borderRadius: '16px 16px 4px 16px',
    padding: '9px 13px',
    fontSize: 13.5,
    lineHeight: 1.5,
    animation: 'popIn .3s ease both',
  },
  sys: {
    alignSelf: 'center',
    background: 'var(--organic-sage-100)',
    color: 'var(--organic-sage-900)',
    borderRadius: 999,
    padding: '6px 14px',
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: '.04em',
    animation: 'popIn .3s ease both',
  },
}

export function FlowDemo() {
  const [selected, setSelected] = useState('ai')
  const [active, setActive] = useState<string | null>(null)
  const [messages, setMessages] = useState<FlowStep[]>([])
  const [typing, setTyping] = useState(false)
  const [running, setRunning] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  function runFlow() {
    if (running) return
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setMessages([])
    setTyping(false)
    setRunning(true)
    setActive(null)

    let t = 400
    FLOW_STEPS.forEach((step, i) => {
      if (step.kind === 'out') {
        timersRef.current.push(
          setTimeout(() => {
            setTyping(true)
            setActive(step.node)
          }, t)
        )
        t += 1100
      }
      timersRef.current.push(
        setTimeout(() => {
          setMessages((prev) => [...prev, step])
          setTyping(false)
          setActive(step.node)
          setRunning(i < FLOW_STEPS.length - 1)
          requestAnimationFrame(() => {
            const el = chatRef.current
            if (el) el.scrollTop = el.scrollHeight
          })
        }, t)
      )
      t += step.kind === 'in' ? 900 : 700
    })
    timersRef.current.push(setTimeout(() => setActive(null), t + 600))
  }

  useEffect(() => {
    const autoRun = setTimeout(runFlow, AUTO_RUN_DELAY_MS)
    return () => {
      clearTimeout(autoRun)
      timersRef.current.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedNode = FLOW_NODES.find((n) => n.id === selected)

  return (
    <section id="product" className="pt-6 pb-[72px]">
      <div
        data-reveal
        className="relative rounded-[calc(var(--radius-lg)*2)] border-[1.5px] p-[clamp(16px,3vw,32px)]"
        style={{ borderColor: 'var(--organic-terracotta-300)', background: 'color-mix(in srgb, var(--organic-sand-100) 60%, transparent)' }}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-[.1em] uppercase" style={{ color: 'var(--organic-terracotta-700)' }}>
              Flow en direct · Fig. 01
            </span>
            <span className="text-[13px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 62%, transparent)' }}>
              Cliquez sur un nœud pour l'inspecter
            </span>
          </div>
          <button type="button" className="btn btn-secondary" onClick={runFlow}>
            {running ? 'En cours…' : 'Lancer ce flow'}
          </button>
        </div>

        <div className="lp-flow-grid grid grid-cols-[minmax(0,1fr)_288px] items-start gap-[clamp(16px,3vw,32px)]">
          <div className="overflow-x-auto">
            <div className="relative h-[366px] w-[640px]">
              <svg width={640} height={366} viewBox="0 0 640 366" fill="none" className="absolute inset-0">
                <path d="M180 96 C212 96 208 56 240 56" stroke="var(--organic-terracotta-400)" strokeWidth={2.5} />
                <path d="M320 92 C320 136 320 156 320 200" stroke="var(--organic-terracotta-400)" strokeWidth={2.5} />
                <path d="M400 236 C432 236 428 176 460 176" stroke="var(--organic-sage-500)" strokeWidth={2.5} />
                <path d="M400 236 C432 236 428 296 460 296" stroke="var(--organic-sage-500)" strokeWidth={2.5} strokeDasharray="5 5" />
                <text x={424} y={196} fill="var(--organic-sage-800)" fontSize={11} fontWeight={700} letterSpacing={1}>OUI</text>
                <text x={424} y={290} fill="var(--organic-sage-800)" fontSize={11} fontWeight={700} letterSpacing={1}>NON</text>
              </svg>
              {FLOW_NODES.map((n) => {
                const isSelected = selected === n.id
                const isActive = active === n.id
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setSelected(n.id)}
                    className="lp-node-btn absolute w-40 rounded-[var(--radius-lg)] border-[1.5px] p-[12px_14px] text-left font-sans"
                    style={{
                      left: n.x,
                      top: n.y,
                      background: 'var(--organic-bg)',
                      borderColor: isSelected || isActive ? 'var(--organic-terracotta)' : 'var(--organic-sand-300)',
                      borderWidth: isSelected || isActive ? 2 : 1.5,
                      boxShadow: isActive
                        ? '0 0 0 4px var(--organic-terracotta-200), var(--organic-shadow-md)'
                        : isSelected
                          ? 'var(--organic-shadow-md)'
                          : 'var(--organic-shadow-sm)',
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="size-[10px] shrink-0 rounded-full"
                        style={{ background: n.tone === 'a' ? 'var(--organic-terracotta)' : 'var(--organic-sage-500)' }}
                      />
                      <span className="text-sm font-bold">{n.label}</span>
                    </span>
                    <span className="mt-[3px] block text-left text-xs" style={{ color: 'color-mix(in srgb, var(--organic-text) 62%, transparent)' }}>
                      {n.sub}
                    </span>
                  </button>
                )
              })}
            </div>
            <p
              className="mt-3 min-h-[44px] max-w-[58ch] text-sm leading-[1.6]"
              style={{ color: 'color-mix(in srgb, var(--organic-text) 74%, transparent)', borderLeft: '2px solid var(--organic-terracotta-300)', paddingLeft: 12 }}
            >
              {selectedNode ? `${selectedNode.label} — ${selectedNode.desc}` : ''}
            </p>
          </div>

          <div
            className="overflow-hidden rounded-[28px] border-[1.5px]"
            style={{ borderColor: 'var(--organic-sand-300)', background: 'var(--organic-bg)', boxShadow: 'var(--organic-shadow-md)' }}
          >
            <div className="flex items-center gap-2.5 border-b-[1.5px] p-[12px_16px]" style={{ borderColor: 'var(--organic-sand-200)' }}>
              <span
                className="grid size-7 place-content-center rounded-full text-xs font-bold"
                style={{ background: 'var(--organic-sage-300)', color: 'var(--organic-sage-900)' }}
              >
                M
              </span>
              <div>
                <div className="text-[13px] font-bold">Maya · @homefolk</div>
                <div className="text-[11px]" style={{ color: 'color-mix(in srgb, var(--organic-text) 55%, transparent)' }}>DM Instagram</div>
              </div>
            </div>
            <div ref={chatRef} className="flex h-[300px] flex-col gap-2 overflow-y-auto p-3.5">
              {messages.map((m, i) => (
                <div key={i} style={MSG_STYLE[m.kind]}>{m.text}</div>
              ))}
              {typing && (
                <div className="flex gap-1 self-start rounded-[16px] rounded-bl-[4px] px-3.5 py-2.5" style={{ background: 'var(--organic-terracotta-100)' }}>
                  <span className="size-1.5 rounded-full" style={{ background: 'var(--organic-terracotta-700)', animation: 'blink 1s infinite' }} />
                  <span className="size-1.5 rounded-full" style={{ background: 'var(--organic-terracotta-700)', animation: 'blink 1s .15s infinite' }} />
                  <span className="size-1.5 rounded-full" style={{ background: 'var(--organic-terracotta-700)', animation: 'blink 1s .3s infinite' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
