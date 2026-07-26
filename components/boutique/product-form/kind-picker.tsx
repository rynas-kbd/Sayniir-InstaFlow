'use client'

import { LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PRODUCT_KINDS } from '../product-kinds'
import type { ProductKind } from '../types'

/** Grid of clickable kind cards, replacing the old plain <Select>. Raw <button> elements (not
 * ui/Button) — its `data-slot="button"` would be forced to a 999px pill by the app's unlayered
 * radius override, which would clip this grid's rounded-2xl cards. */
export function KindPicker({ value, onChange }: { value: ProductKind; onChange: (kind: ProductKind) => void }) {
  const reduce = useReducedMotion()

  return (
    <LayoutGroup id="product-kind">
      <div role="radiogroup" aria-label="Type d'offre" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PRODUCT_KINDS.map(({ key, title, hint, icon: Icon }) => {
          const selected = value === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(key)}
              className={cn(
                'relative flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-colors',
                selected ? 'border-primary/30' : 'border-border hover:border-primary/20 hover:bg-muted/30',
              )}
            >
              {selected && (
                <motion.span
                  layoutId={reduce ? undefined : 'kind-selected'}
                  aria-hidden
                  className="absolute inset-0 rounded-2xl bg-primary/8 ring-1 ring-primary/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Icon className="size-4" strokeWidth={1.75} />
                {title}
              </span>
              <span className="relative z-10 text-[10.5px] text-muted-foreground/70">{hint}</span>
            </button>
          )
        })}
      </div>
    </LayoutGroup>
  )
}
