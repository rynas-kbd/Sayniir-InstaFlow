import type { DayPoint } from '@/lib/analytics/queries'

const COLORS = {
  messages: 'var(--color-primary)',
  replies: 'var(--color-success)',
}

export function MessagesChart({ points }: { points: DayPoint[] }) {
  const width = 720
  const height = 220
  const padding = { top: 12, right: 12, bottom: 28, left: 12 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxValue = Math.max(1, ...points.map((p) => Math.max(p.messages, p.replies)))
  const groupWidth = chartWidth / points.length
  const barWidth = Math.min(8, groupWidth / 3.5)

  if (points.every((p) => p.messages === 0 && p.replies === 0)) {
    return (
      <div className="flex h-55 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
        Aucune donnée sur cette période.
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: COLORS.messages }} />
          Messages reçus
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ backgroundColor: COLORS.replies }} />
          Réponses auto.
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Messages et réponses par jour">
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="var(--color-border)"
          strokeWidth={1}
        />
        {points.map((p, i) => {
          const groupX = padding.left + i * groupWidth
          const messagesHeight = (p.messages / maxValue) * chartHeight
          const repliesHeight = (p.replies / maxValue) * chartHeight
          const showLabel = i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2)

          return (
            <g key={p.date}>
              <rect
                x={groupX + groupWidth / 2 - barWidth - 1}
                y={height - padding.bottom - messagesHeight}
                width={barWidth}
                height={messagesHeight}
                rx={2}
                fill={COLORS.messages}
              />
              <rect
                x={groupX + groupWidth / 2 + 1}
                y={height - padding.bottom - repliesHeight}
                width={barWidth}
                height={repliesHeight}
                rx={2}
                fill={COLORS.replies}
              />
              {showLabel && (
                <text
                  x={groupX + groupWidth / 2}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--color-muted-foreground)"
                >
                  {new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
