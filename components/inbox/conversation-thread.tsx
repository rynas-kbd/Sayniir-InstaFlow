import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft } from 'lucide-react'
import type { MessageItem } from './types'

interface ExtendedMessageItem extends MessageItem {
  isAutoReply?: boolean
}

export function ConversationThread({
  messages,
  senderName,
  senderProfilePic,
  accountUsername,
  backHref,
}: {
  messages: MessageItem[]
  senderName: string
  senderProfilePic: string | null
  accountUsername: string | null
  backHref?: string
}) {
  const sorted = [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const displayItems: ExtendedMessageItem[] = []
  for (const msg of sorted) {
    displayItems.push(msg)
    if (msg.reply_text) {
      displayItems.push({
        ...msg,
        id: `reply-${msg.id}`,
        direction: 'outgoing',
        message_text: msg.reply_text,
        reply_text: null,
        auto_reply_sent: false,
        isAutoReply: true,
        created_at: new Date(new Date(msg.created_at).getTime() + 1000).toISOString(),
      })
    }
  }

  const groups: { date: string; items: ExtendedMessageItem[] }[] = []
  for (const msg of displayItems) {
    const day = new Date(msg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    const last = groups[groups.length - 1]
    if (last && last.date === day) last.items.push(msg)
    else groups.push({ date: day, items: [msg] })
  }

  const initial = senderName[0]?.toUpperCase() ?? '?'

  return (
    <>
      <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-border bg-background px-4">
        {backHref && (
          <Link
            href={backHref}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          >
            <ChevronLeft className="size-4" />
          </Link>
        )}
        {senderProfilePic ? (
          <Image
            src={senderProfilePic}
            alt={senderName}
            width={24}
            height={24}
            unoptimized
            className="size-6 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
            {initial}
          </div>
        )}
        <div className="flex min-w-0 items-baseline gap-2">
          <p className="truncate text-[13px] font-medium text-foreground">{senderName}</p>
          {accountUsername && <p className="truncate text-xs text-muted-foreground">via @{accountUsername}</p>}
        </div>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
          {sorted.length} message{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto bg-background px-4 pt-4 pb-6 md:px-6">
        {groups.map((group) => (
          <div key={group.date}>
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="whitespace-nowrap text-[11px] text-muted-foreground">{group.date}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {group.items.map((msg, idx) => {
              const isIncoming = msg.direction === 'incoming'
              const prevMsg = idx > 0 ? group.items[idx - 1] : null
              const sameDirectionAsPrev = prevMsg?.direction === msg.direction

              return (
                <div
                  key={msg.id}
                  className={`flex ${isIncoming ? 'justify-start' : 'justify-end'} ${sameDirectionAsPrev ? 'mt-1' : 'mt-3'}`}
                >
                  <div className={`flex max-w-[68%] flex-col gap-1 ${isIncoming ? 'items-start' : 'items-end'}`}>
                    <div
                      className={`rounded-lg px-3 py-2 break-words ${
                        isIncoming ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      {msg.message_text ? (
                        <p className="text-[13px] leading-relaxed">{msg.message_text}</p>
                      ) : (
                        <p className="text-xs italic opacity-70">
                          {msg.message_type === 'image'
                            ? 'Image'
                            : msg.message_type === 'story_reply'
                              ? 'Réponse à une story'
                              : '(contenu non textuel)'}
                        </p>
                      )}
                    </div>
                    <span className="px-0.5 text-[11px] text-muted-foreground tabular-nums">
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {msg.isAutoReply && ' · Réponse automatique'}
                      {msg.auto_reply_sent && ' · Répondu'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </>
  )
}
