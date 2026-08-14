'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useT } from '@/components/i18n-provider'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useT()

  const handleToggle = () => {
    const nextTheme = resolvedTheme === 'dark' ? 'light' : 'dark'

    // Fallback if View Transitions API is not supported
    if (!document.startViewTransition) {
      setTheme(nextTheme)
      return
    }

    document.startViewTransition(() => {
      setTheme(nextTheme)
    })
  }

  return (
    <button
      type="button"
      aria-label={t('appearance.themeToggleAriaLabel')}
      onClick={handleToggle}
      className="flex size-8 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:text-foreground active:scale-95"
      style={{
        background: 'color-mix(in srgb, var(--organic-sand-300) 0%, transparent)',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background =
          'color-mix(in srgb, var(--organic-sand-300) 18%, transparent)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background =
          'color-mix(in srgb, var(--organic-sand-300) 0%, transparent)'
      }}
    >
      <Sun className="hidden size-4 dark:block" strokeWidth={1.75} />
      <Moon className="block size-4 dark:hidden" strokeWidth={1.75} />
    </button>
  )
}
