'use client'

import { useState } from 'react'
import type { DayPoint } from '@/lib/analytics/queries'
import { useT, useLocale } from '@/components/i18n-provider'

const DATE_LOCALE: Record<string, string> = { fr: 'fr-FR', en: 'en-US', ar: 'ar' }

interface TooltipState {
  x: number
  y: number
  point: DayPoint
}

export function MessagesChart({ points }: { points: DayPoint[] }) {
  const t = useT()
  const locale = useLocale()
  const dateLocale = DATE_LOCALE[locale] ?? 'fr-FR'
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const W = 720
  const H = 220
  const pad = { top: 20, right: 20, bottom: 36, left: 36 }
  const cw = W - pad.left - pad.right
  const ch = H - pad.top - pad.bottom

  const maxVal = Math.max(1, ...points.map((p) => Math.max(p.messages, p.replies)))
  const step = cw / Math.max(points.length - 1, 1)

  function xFor(i: number) {
    return pad.left + i * step
  }
  function yFor(v: number) {
    return pad.top + ch - (v / maxVal) * ch
  }

  function buildPath(key: 'messages' | 'replies') {
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(i).toFixed(1)},${yFor(p[key]).toFixed(1)}`)
      .join(' ')
  }

  function buildArea(key: 'messages' | 'replies') {
    const line = buildPath(key)
    const baseline = pad.top + ch
    return `${line} L${xFor(points.length - 1).toFixed(1)},${baseline} L${pad.left.toFixed(1)},${baseline} Z`
  }

  const isEmpty = points.every((p) => p.messages === 0 && p.replies === 0)

  if (isEmpty) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
        {t('analytics.messagesChart.empty')}
      </div>
    )
  }

  // Y-axis gridlines at 0, 25%, 50%, 75%, 100%
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: pad.top + ch * (1 - pct),
    label: Math.round(maxVal * pct),
  }))

  // X-axis labels (first, mid, last + one between)
  const labelIndices = Array.from(new Set([0, Math.floor(points.length / 3), Math.floor((2 * points.length) / 3), points.length - 1]))

  return (
    <div className="relative select-none">
      {/* Legend */}
      <div className="mb-4 flex items-center gap-5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-5 rounded-full" style={{ background: 'var(--color-primary)' }} />
          {t('analytics.messagesChart.legendMessages')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-5 rounded-full" style={{ background: 'var(--color-success, #22c55e)' }} />
          {t('analytics.messagesChart.legendReplies')}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="grad-messages" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grad-replies" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map(({ y, label }) => (
          <g key={y}>
            <line
              x1={pad.left}
              x2={W - pad.right}
              y1={y}
              y2={y}
              stroke="var(--color-border)"
              strokeWidth={0.75}
              strokeDasharray={label === 0 ? undefined : '4 4'}
            />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize={9} fill="var(--color-muted-foreground)">
              {label}
            </text>
          </g>
        ))}

        {/* Area fills */}
        <path d={buildArea('messages')} fill="url(#grad-messages)" />
        <path d={buildArea('replies')} fill="url(#grad-replies)" />

        {/* Lines */}
        <path d={buildPath('messages')} fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <path d={buildPath('replies')} fill="none" stroke="#22c55e" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {/* X-axis labels */}
        {labelIndices.map((i) => (
          <text
            key={i}
            x={xFor(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize={9.5}
            fill="var(--color-muted-foreground)"
          >
            {new Date(points[i].date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}
          </text>
        ))}

        {/* Invisible hit areas + dots */}
        {points.map((p, i) => (
          <g
            key={p.date}
            onMouseEnter={(e) => {
              const rect = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
              setTooltip({ x: xFor(i), y: Math.min(yFor(p.messages), yFor(p.replies)) - 12, point: p })
            }}
          >
            <rect
              x={xFor(i) - step / 2}
              y={pad.top}
              width={step}
              height={ch}
              fill="transparent"
            />
            {tooltip?.point.date === p.date && (
              <>
                <line x1={xFor(i)} x2={xFor(i)} y1={pad.top} y2={pad.top + ch} stroke="var(--color-border)" strokeWidth={1} strokeDasharray="3 3" />
                <circle cx={xFor(i)} cy={yFor(p.messages)} r={4} fill="var(--color-primary)" />
                <circle cx={xFor(i)} cy={yFor(p.replies)} r={4} fill="#22c55e" />
              </>
            )}
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-[11px] shadow-lg backdrop-blur-sm"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <p className="mb-1 font-semibold text-foreground">
            {new Date(tooltip.point.date).toLocaleDateString(dateLocale, { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
          <p style={{ color: 'var(--color-primary)' }}>{t('analytics.messagesChart.tooltipMessages', { count: tooltip.point.messages })}</p>
          <p style={{ color: '#22c55e' }}>{t('analytics.messagesChart.tooltipReplies', { count: tooltip.point.replies })}</p>
        </div>
      )}
    </div>
  )
}
