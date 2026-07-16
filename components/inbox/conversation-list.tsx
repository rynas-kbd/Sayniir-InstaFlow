'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MessageSquare, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Conversation } from './types'

// Deterministic color palette for avatars
const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
]

function getAvatarGradient(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
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
      <div className="flex h-full flex-col items-center justify-center gap-2 px-5 py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <MessageSquare className="size-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[13px] font-medium text-foreground">Aucune conversation</p>
          <p className="text-xs text-muted-foreground">Les messages apparaîtront ici</p>
        </div>
      </div>
    )
  }

  return (
    <ul className="m-0 list-none divide-y divide-border/40 p-0">
      {conversations.map((conv) => {
        const isActive = activeId === conv.senderId
        const initial = (conv.senderFullName?.[0] ?? conv.senderUsername?.[0] ?? '?').toUpperCase()
        const displayName = conv.senderFullName ?? (conv.senderUsername ? `@${conv.senderUsername}` : conv.senderId)
        const preview = conv.lastMessage ?? '(média)'
        const gradient = getAvatarGradient(conv.senderId)

        return (
          <li key={conv.senderId}>
            <button
              onClick={() => select(conv.senderId)}
              className={cn(
                'relative flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors',
                isActive
                  ? 'bg-primary/6 before:absolute before:left-0 before:top-1/2 before:h-8 before:-translate-y-1/2 before:w-0.5 before:rounded-r-full before:bg-primary'
                  : 'hover:bg-muted/40'
              )}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                {conv.senderProfilePic ? (
                  <Image
                    src={conv.senderProfilePic}
                    alt={displayName}
                    width={40}
                    height={40}
                    unoptimized
                    className="size-10 rounded-full object-cover ring-2 ring-border"
                  />
                ) : (
                  <div
                    className={cn(
                      'flex size-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white',
                      gradient
                    )}
                  >
                    {initial}
                  </div>
                )}
                {conv.hasUnreplied && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-3 items-center justify-center rounded-full bg-background">
                    <Circle className="size-2.5 fill-primary text-primary" />
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      'truncate text-[13px]',
                      conv.hasUnreplied ? 'font-bold text-foreground' : 'font-medium text-foreground'
                    )}
                  >
                    {displayName}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                    {formatRelative(conv.lastMessageAt)}
                  </span>
                </div>
                <p
                  className={cn(
                    'mt-0.5 truncate text-xs',
                    conv.hasUnreplied ? 'font-medium text-muted-foreground' : 'text-muted-foreground/70'
                  )}
                >
                  {conv.lastDirection === 'outgoing' && (
                    <span className="mr-0.5 text-primary/70">Vous :</span>
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
