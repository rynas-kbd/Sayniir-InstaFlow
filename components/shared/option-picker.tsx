'use client'

import { LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { springs } from '@/lib/motion/springs'

export interface OptionPickerItem<T extends string> {
  value: T
  label: string
  /** Shown under the label — grid variant only (compact toggles have no room for it). */
  hint?: string
  icon?: React.ElementType
}

export interface OptionPickerProps<T extends string> {
  value: T
  onChange: (v: T) => void
  options: OptionPickerItem<T>[]
  /** aria-label for the radiogroup, and the framer-motion layout namespace — must be unique per picker on the page. */
  name: string
  /** Single-row toggle for 2-3 near-equal options (e.g. Texte/Carte). Default is a responsive card grid. */
  compact?: boolean
  /** Grid variant only. Default 3. */
  columns?: 2 | 3
}

/** Generalizes the boutique kind-picker into a reusable "N options, pick one, show as cards"
 * control: `role="radiogroup"` + `framer-motion` `layoutId` selection highlight + `useReducedMotion`.
 * Replaces plain `<Select>`s and hand-rolled toggle-button rows across products/campaigns/rules —
 * every one of those was the same interaction with different labels. Raw `<button>` elements (not
 * `ui/Button`) — its `data-slot="button"` would be forced to a 999px pill by the app's unlayered
 * radius override, which would clip these rounded-2xl cards. */
export function OptionPicker<T extends string>({ value, onChange, options, name, compact, columns = 3 }: OptionPickerProps<T>) {
  const reduce = useReducedMotion()
  const layoutId = `option-picker-${name}`

  return (
    <LayoutGroup id={layoutId}>
      <div
        role="radiogroup"
        aria-label={name}
        className={cn('gap-2', compact ? 'flex' : `grid grid-cols-2 ${columns === 3 ? 'sm:grid-cols-3' : ''}`)}
      >
        {options.map(({ value: v, label, hint, icon: Icon }) => {
          const selected = value === v
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(v)}
              className={cn(
                'relative flex rounded-2xl border text-left transition-colors',
                compact ? 'flex-1 items-center justify-center gap-1.5 px-3 py-2' : 'flex-col items-start gap-1 p-3',
                selected ? 'border-primary/30' : 'border-border hover:border-primary/20 hover:bg-muted/30',
              )}
            >
              {selected && (
                <motion.span
                  layoutId={reduce ? undefined : `${layoutId}-selected`}
                  aria-hidden
                  className="absolute inset-0 rounded-2xl bg-primary/8 ring-1 ring-primary/30"
                  transition={springs.smooth}
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex items-center gap-1.5',
                  compact ? cn('text-[13px] font-medium', selected ? 'text-primary' : 'text-muted-foreground') : 'text-xs font-bold text-foreground',
                )}
              >
                {Icon && <Icon className="size-3.5" strokeWidth={1.75} />}
                {label}
              </span>
              {!compact && hint && <span className="relative z-10 text-[10.5px] text-muted-foreground/70">{hint}</span>}
            </button>
          )
        })}
      </div>
    </LayoutGroup>
  )
}
