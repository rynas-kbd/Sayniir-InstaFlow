'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Conversation } from './types'

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
      <div className="flex h-full flex-col items-center justify-center gap-1.5 px-5 py-10 text-center">
        <MessageSquare className="mb-1 size-4 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-[13px] font-medium text-foreground">Aucune conversation</p>
        <p className="text-xs text-muted-foreground">Les messages apparaîtront ici</p>
      </div>
    )
  }

  return (
    <ul className="m-0 list-none p-0">
      {conversations.map((conv) => {
        const isActive = activeId === conv.senderId
        const initial = (conv.senderFullName?.[0] ?? conv.senderUsername?.[0] ?? '?').toUpperCase()
        const displayName = conv.senderFullName ?? (conv.senderUsername ? `@${conv.senderUsername}` : conv.senderId)
        const preview = conv.lastMessage ?? '(média)'

        return (
          <li key={conv.senderId}>
            <button
              onClick={() => select(conv.senderId)}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                isActive ? 'bg-muted' : 'hover:bg-muted/50'
              )}
            >
              {conv.senderProfilePic ? (
                <Image
                  src={conv.senderProfilePic}
                  alt={displayName}
                  width={32}
                  height={32}
                  unoptimized
                  className="size-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                  {initial}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      'truncate text-[13px] text-foreground',
                      conv.hasUnreplied ? 'font-semibold' : 'font-medium'
                    )}
                  >
                    {displayName}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                    {formatRelative(conv.lastMessageAt)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  {conv.hasUnreplied && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />}
                  <span className="truncate text-xs text-muted-foreground">
                    {conv.lastDirection === 'outgoing' && 'Vous : '}
                    {preview.length > 48 ? `${preview.slice(0, 48)}…` : preview}
                  </span>
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
