'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CheckCircle2, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
      <div className="flex h-full flex-col items-center justify-center px-5 py-10 text-center">
        <div className="mb-3.5 flex size-12 items-center justify-center rounded-lg border border-border bg-muted">
          <MessageSquare className="size-5 text-primary" strokeWidth={1.5} />
        </div>
        <p className="mb-1 text-sm font-bold text-foreground">Aucune conversation</p>
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
              className={`flex w-full items-center gap-3 border-0 border-l-[3px] px-3.5 py-3 text-left transition-colors ${
                isActive ? 'border-l-primary bg-muted' : 'border-l-transparent hover:bg-muted/60'
              }`}
            >
              {conv.senderProfilePic ? (
                <Image
                  src={conv.senderProfilePic}
                  alt={displayName}
                  width={40}
                  height={40}
                  unoptimized
                  className={`size-10 shrink-0 rounded-full border-2 object-cover ${isActive ? 'border-primary' : 'border-border'}`}
                />
              ) : (
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 bg-primary text-sm font-extrabold text-primary-foreground ${
                    isActive ? 'border-primary' : 'border-border'
                  }`}
                >
                  {initial}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="max-w-[130px] truncate text-[13px] font-semibold text-foreground">
                    {displayName}
                  </span>
                  <span className="ml-1.5 shrink-0 text-[10px] text-muted-foreground">
                    {formatRelative(conv.lastMessageAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {conv.lastDirection === 'outgoing' && <span className="shrink-0 text-[10px]">🤖</span>}
                  <span className="truncate text-xs text-muted-foreground">
                    {preview.length > 45 ? `${preview.slice(0, 45)}…` : preview}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {conv.hasUnreplied && (
                    <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
                      Sans réponse
                    </Badge>
                  )}
                  {conv.hasAutoReplied && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
                      <CheckCircle2 className="size-2.5" /> Auto-répondu
                    </Badge>
                  )}
                  {conv.accountUsername && (
                    <Badge variant="outline" className="h-4 px-1.5 text-[9px]">
                      @{conv.accountUsername}
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
