'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'
import { PLATFORM_ICON, PLATFORM_LABEL } from '@/lib/channels/labels'
import type { Platform } from '@/lib/channels/types'

/**
 * Platform pills shown only in the unified "all channels" inbox scope
 * (Phase 2) — lets a merchant isolate Instagram/WhatsApp/Messenger inside
 * the merged view without switching the account scope back to 'single'.
 * Mirrors InboxFilterBar's URL-param navigation pattern, on a separate
 * `channel` param so status and platform filters combine freely.
 */
export function ChannelFilterPills({
  platforms,
  activeChannel,
  activeFilter,
  activeConvId,
}: {
  platforms: Platform[]
  activeChannel: string
  activeFilter: string
  activeConvId: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (platforms.length <= 1) return null

  function navigate(platform: string) {
    const params = new URLSearchParams()
    if (activeFilter !== 'all') params.set('filter', activeFilter)
    if (platform !== 'all') params.set('channel', platform)
    if (activeConvId) params.set('conv', activeConvId)
    startTransition(() => router.push(`/inbox${params.toString() ? `?${params.toString()}` : ''}`))
  }

  return (
    <div
      className="mt-1.5 flex gap-1 rounded-xl p-1 flex-row flex-nowrap overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none"
      style={{
        background: 'color-mix(in srgb, var(--organic-sand-300) 10%, transparent)',
        opacity: isPending ? 0.7 : 1,
      }}
    >
      {(['all', ...platforms] as const).map((key) => {
        const isActive = activeChannel === key
        const Icon = key === 'all' ? null : PLATFORM_ICON[key]
        return (
          <button
            key={key}
            onClick={() => navigate(key)}
            disabled={isPending}
            className={cn(
              'flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-medium whitespace-nowrap transition-all duration-200',
              isActive ? 'shadow-sm' : 'hover:bg-[color-mix(in_srgb,var(--organic-sand-300)_25%,transparent)]'
            )}
            style={
              isActive
                ? { background: 'color-mix(in srgb, var(--organic-bg) 90%, transparent)', color: 'var(--organic-terracotta-700)' }
                : { color: 'color-mix(in srgb, var(--foreground) 45%, transparent)' }
            }
          >
            {Icon && <Icon className="size-3" strokeWidth={1.75} />}
            {key === 'all' ? 'Tous' : PLATFORM_LABEL[key]}
          </button>
        )
      })}
    </div>
  )
}
