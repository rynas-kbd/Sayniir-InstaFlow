'use client'

import { Check, Globe } from 'lucide-react'
import { useLocale, useSetLocale, useT } from '@/components/i18n-provider'
import { LOCALES } from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

/**
 * Shared FR/EN/AR switcher — rendered in Settings (appearance-card.tsx),
 * in the topbar personalization modal (theme-customizer-modal.tsx), and in
 * the onboarding personalization step (welcome-form.tsx), same section as
 * theme/palette. Instant-save like every other preference here, no submit
 * button. `labelClassName` lets each host match its own label styling.
 */
export function LanguagePicker({ labelClassName }: { labelClassName?: string }) {
  const locale = useLocale()
  const setLocale = useSetLocale()
  const t = useT()

  return (
    <div>
      <label className={cn('mb-2 block text-xs font-semibold text-foreground/80', labelClassName)}>
        <span className="inline-flex items-center gap-1.5">
          <Globe className="size-3.5" strokeWidth={1.75} />
          {t('languagePicker.title')}
        </span>
      </label>
      <div className="grid grid-cols-3 gap-2.5">
        {LOCALES.map((id) => {
          const isSelected = locale === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setLocale(id)}
              aria-pressed={isSelected}
              className={cn(
                'relative flex items-center justify-center rounded-xl border py-2.5 text-xs font-medium transition-all duration-150 active:scale-95',
                isSelected
                  ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-xs'
                  : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40'
              )}
            >
              {isSelected && <Check className="absolute left-2 size-3" strokeWidth={3} />}
              <span>{t(`languagePicker.${id}`)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
