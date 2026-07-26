'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'

const FILTERS = [
  { key: 'all', label: 'Tous' },
  { key: 'incoming', label: 'Reçus' },
  { key: 'replied', label: 'Répondus' },
  { key: 'unreplied', label: 'Sans réponse' },
]

export function InboxFilterBar({
  activeFilter,
  activeConvId,
}: {
  activeFilter: string
  activeConvId: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function navigate(key: string) {
    const params = new URLSearchParams()
    if (key !== 'all') params.set('filter', key)
    if (activeConvId) params.set('conv', activeConvId)
    const href = `/inbox${params.toString() ? `?${params.toString()}` : ''}`
    startTransition(() => router.push(href))
  }

  return (
    <div
      className="flex gap-1 rounded-xl p-1 flex-row flex-nowrap overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none"
      style={{
        background: 'color-mix(in srgb, var(--organic-sand-300) 18%, transparent)',
        border: '1px solid color-mix(in srgb, var(--organic-sand-400) 20%, transparent)',
        opacity: isPending ? 0.7 : 1,
        transition: 'opacity 150ms ease',
      }}
    >
      {FILTERS.map(({ key, label }) => {
        const isActive = activeFilter === key
        return (
          <button
            key={key}
            onClick={() => navigate(key)}
            disabled={isPending}
            className={cn(
              'flex-1 rounded-lg px-2 py-1.5 text-center text-[10.5px] font-medium whitespace-nowrap',
              'transition-all duration-200 ease-out',
              isActive
                ? 'shadow-sm'
                : 'hover:bg-[color-mix(in_srgb,var(--organic-sand-300)_30%,transparent)]'
            )}
            style={
              isActive
                ? {
                    background: 'color-mix(in srgb, var(--organic-bg) 90%, transparent)',
                    color: 'var(--organic-terracotta-700)',
                    boxShadow: '0 1px 3px color-mix(in srgb, var(--organic-terracotta) 10%, transparent)',
                  }
                : { color: 'color-mix(in srgb, var(--foreground) 50%, transparent)' }
            }
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
