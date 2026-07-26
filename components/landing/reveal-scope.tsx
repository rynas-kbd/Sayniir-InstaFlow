'use client'

import { useEffect, useRef } from 'react'

const REVEAL_MARGIN = '0px 0px -8% 0px'
const REVEAL_THRESHOLD = 0.08
const SAFETY_TIMEOUT_MS = 2500
const COUNT_DURATION_MS = 1400

function animateCount(el: Element): void {
  const htmlEl = el as HTMLElement
  
  // Save original text if not already saved, to allow resetting later
  if (!htmlEl.dataset.originalText && el.textContent) {
    htmlEl.dataset.originalText = el.textContent
  }

  const raw = htmlEl.dataset.originalText ?? el.textContent ?? ''
  const match = raw.match(/-?[\d,]*\.?\d+/)
  if (!match || htmlEl.dataset.counted) return
  htmlEl.dataset.counted = '1'

  const plain = match[0].replace(/,/g, '')
  const grouped = match[0].includes(',')
  const target = parseFloat(plain)
  const decimals = (plain.split('.')[1] ?? '').length
  const prefix = raw.slice(0, match.index)
  const suffix = raw.slice((match.index ?? 0) + match[0].length)
  let start = 0

  function step(ts: number) {
    if (!start) start = ts
    const progress = Math.min(1, (ts - start) / COUNT_DURATION_MS)
    const eased = 1 - Math.pow(1 - progress, 3)
    const value = (target * eased).toFixed(decimals)
    el.textContent = prefix + (grouped ? Number(value).toLocaleString('en-US') : value) + suffix
    
    // Only continue animation if the element is still marked as counted.
    // If it was reset (uncounted) because it left the viewport, we stop.
    if (progress < 1 && htmlEl.dataset.counted === '1') {
      requestAnimationFrame(step)
    }
  }
  requestAnimationFrame(step)
}

function resetCount(el: Element): void {
  const htmlEl = el as HTMLElement
  if (htmlEl.dataset.originalText) {
    el.textContent = htmlEl.dataset.originalText
  }
  delete htmlEl.dataset.counted
}

/**
 * Ports the design's scroll-reveal script, scoped to this component's own
 * subtree via a ref rather than document.documentElement — so it can never
 * leak the "lp-reveal" class (or its opacity:0 default) into the rest of
 * the app if the landing is ever embedded elsewhere.
 */
export function RevealScope({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !window.IntersectionObserver) return

    root.classList.add('lp-reveal')

    const seen = new WeakSet<Element>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            entry.target.classList.remove('lp-in')
            if (entry.target.hasAttribute('data-count')) resetCount(entry.target)
            entry.target.querySelectorAll('[data-count]').forEach(resetCount)
            continue
          }
          entry.target.classList.add('lp-in')
          if (entry.target.hasAttribute('data-count')) animateCount(entry.target)
          entry.target.querySelectorAll('[data-count]').forEach(animateCount)
        }
      },
      { rootMargin: REVEAL_MARGIN, threshold: REVEAL_THRESHOLD }
    )

    function scan() {
      root?.querySelectorAll('[data-reveal], [data-count]').forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el)
          io.observe(el)
        }
      })
    }
    scan()

    const mo = new MutationObserver(scan)
    mo.observe(root, { childList: true, subtree: true })

    const safety = setTimeout(() => {
      root.querySelectorAll('[data-reveal]:not(.lp-in)').forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('lp-in')
      })
    }, SAFETY_TIMEOUT_MS)

    return () => {
      io.disconnect()
      mo.disconnect()
      clearTimeout(safety)
    }
  }, [])

  return <div ref={rootRef}>{children}</div>
}
