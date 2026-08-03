'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Conversation } from './types'

// Deterministic organic palette for avatars
const AVATAR_PALETTES = [
  { from: 'var(--organic-terracotta-400)', to: 'var(--organic-terracotta-600)' },
  { from: 'var(--organic-sage-400)', to: 'var(--organic-sage-600)' },
  { from: 'var(--organic-terracotta-300)', to: 'var(--organic-sage-500)' },
  { from: 'var(--organic-sand-400)', to: 'var(--organic-terracotta-500)' },
  { from: 'var(--organic-sage-300)', to: 'var(--organic-sage-600)' },
  { from: 'var(--organic-terracotta-500)', to: 'var(--organic-sand-600)' },
]

function getAvatarPalette(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length]
}

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'maintenant'
  if (mins < 60) return `${mins}min`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function ConversationList({
  conversations,
  activeId,
  filter,
}: {
  conversations: Conversation[]
  activeId: string | null
  filter: string
}) {
  const router = useRouter()

  function select(senderId: string) {
    const params = new URLSearchParams()
    if (filter && filter !== 'all') params.set('filter', filter)
    params.set('conv', senderId)
    router.push(`/inbox?${params.toString()}`)
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-5 py-12 text-center">
        <div
          className="flex size-11 items-center justify-center rounded-2xl"
          style={{
            background: 'color-mix(in srgb, var(--organic-sand-400) 15%, transparent)',
            border: '1px solid color-mix(in srgb, var(--organic-sand-400) 20%, transparent)',
          }}
        >
          <MessageSquare className="size-5 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-foreground">Aucune conversation</p>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">Les messages apparaîtront ici</p>
        </div>
      </div>
    )
  }

  return (
    <ul className="m-0 list-none p-0 py-1">
      {conversations.map((conv) => {
        const isActive = activeId === conv.senderId
        const initial = (conv.senderFullName?.[0] ?? conv.senderUsername?.[0] ?? '?').toUpperCase()
        const displayName = conv.senderFullName ?? (conv.senderUsername ? `@${conv.senderUsername}` : conv.senderId)
        const preview = conv.lastMessage ?? '(média)'
        const palette = getAvatarPalette(conv.senderId)

        return (
          <li key={conv.senderId} className="mx-1.5 my-0.5">
            <button
              onClick={() => select(conv.senderId)}
              className={cn(
                'relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                isActive ? 'shadow-sm' : 'hover:bg-[color-mix(in_srgb,var(--organic-sand-300)_15%,transparent)]'
              )}
              style={
                isActive
                  ? {
                      background: 'color-mix(in srgb, var(--organic-terracotta) 8%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--organic-terracotta) 16%, transparent)',
                    }
                  : { border: '1px solid transparent' }
              }
            >
              {/* Active left accent */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full"
                  style={{ background: 'var(--organic-terracotta-600)' }}
                />
              )}

              {/* Avatar */}
              <div className="relative shrink-0">
                {conv.senderProfilePic ? (
                  <Image
                    src={conv.senderProfilePic}
                    alt={displayName}
                    width={40}
                    height={40}
                    unoptimized
                    className="size-10 rounded-full object-cover"
                    style={{ boxShadow: '0 0 0 2px color-mix(in srgb, var(--organic-terracotta) 20%, transparent)' }}
                  />
                ) : (
                  <div
                    className="flex size-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
                      boxShadow: `0 2px 8px color-mix(in srgb, ${palette.to} 30%, transparent)`,
                    }}
                  >
                    {initial}
                  </div>
                )}
                {/* Unreplied dot */}
                {conv.hasUnreplied && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full"
                    style={{ background: 'var(--organic-bg, var(--background))' }}
                  >
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: 'var(--organic-terracotta-600)' }}
                    />
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className="truncate text-[13px]"
                    style={{ fontWeight: conv.hasUnreplied ? 700 : 500 }}
                  >
                    {displayName}
                  </span>
                  <span
                    className="shrink-0 text-[10.5px] tabular-nums"
                    style={{ color: 'color-mix(in srgb, var(--foreground) 35%, transparent)' }}
                  >
                    {formatRelative(conv.lastMessageAt)}
                  </span>
                </div>
                <p
                  className="mt-0.5 truncate text-[12px]"
                  style={{
                    color: conv.hasUnreplied
                      ? 'color-mix(in srgb, var(--foreground) 60%, transparent)'
                      : 'color-mix(in srgb, var(--foreground) 38%, transparent)',
                    fontWeight: conv.hasUnreplied ? 500 : 400,
                  }}
                >
                  {conv.lastDirection === 'outgoing' && (
                    <span style={{ color: 'var(--organic-terracotta-600)', marginRight: '3px' }}>Vous :</span>
                  )}
                  {preview.length > 52 ? `${preview.slice(0, 52)}…` : preview}
                </p>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
