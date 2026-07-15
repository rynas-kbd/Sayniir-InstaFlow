import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle2, Clock, Bot, ChevronLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-5 py-4">
        {backHref && (
          <Link
            href={backHref}
            className="mr-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary md:hidden"
          >
            <ChevronLeft className="size-4" />
          </Link>
        )}
        {senderProfilePic ? (
          <Image
            src={senderProfilePic}
            alt={senderName}
            width={38}
            height={38}
            unoptimized
            className="size-[38px] rounded-full border-2 border-primary/30 object-cover"
          />
        ) : (
          <div className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {initial}
          </div>
        )}
        <div>
          <p className="mb-px text-sm font-bold text-foreground">{senderName}</p>
          {accountUsername && <p className="text-[11px] text-muted-foreground">via @{accountUsername}</p>}
        </div>
        <div className="ml-auto">
          <Badge variant="secondary">
            {sorted.length} message{sorted.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-background px-5 pt-5 pb-7">
        {groups.map((group) => (
          <div key={group.date}>
            <div className="my-4 flex items-center gap-2.5">
              <div className="h-px flex-1 bg-border" />
              <span className="whitespace-nowrap text-[10px] font-semibold text-muted-foreground">{group.date}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {group.items.map((msg, idx) => {
              const isIncoming = msg.direction === 'incoming'
              const prevMsg = idx > 0 ? group.items[idx - 1] : null
              const sameDirectionAsPrev = prevMsg?.direction === msg.direction
              const showAvatar = isIncoming && !sameDirectionAsPrev

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isIncoming ? 'flex-row' : 'flex-row-reverse'} ${sameDirectionAsPrev ? 'mt-1' : 'mt-3'}`}
                >
                  <div className="w-7 shrink-0">
                    {showAvatar &&
                      (senderProfilePic ? (
                        <Image
                          src={senderProfilePic}
                          alt={senderName}
                          width={28}
                          height={28}
                          unoptimized
                          className="size-7 rounded-full border border-primary/25 object-cover"
                        />
                      ) : (
                        <div className="flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                          {initial}
                        </div>
                      ))}
                    {!isIncoming && !sameDirectionAsPrev && (
                      <div className="flex size-7 items-center justify-center rounded-full border border-success/20 bg-success/15">
                        <Bot className="size-3.5 text-success" />
                      </div>
                    )}
                  </div>

                  <div className={`flex max-w-[70%] flex-col gap-1 ${isIncoming ? 'items-start' : 'items-end'}`}>
                    <div
                      className={`flex flex-col gap-0.5 break-words px-3.5 py-2.5 ${
                        isIncoming
                          ? sameDirectionAsPrev
                            ? 'rounded-tl-sm rounded-tr-2xl rounded-br-2xl rounded-bl-sm'
                            : 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-sm'
                          : sameDirectionAsPrev
                            ? 'rounded-tl-2xl rounded-tr-sm rounded-br-sm rounded-bl-2xl'
                            : 'rounded-tl-2xl rounded-tr-2xl rounded-br-sm rounded-bl-2xl'
                      } ${
                        msg.isAutoReply
                          ? 'bg-success shadow-sm'
                          : isIncoming
                            ? 'border border-border bg-card shadow-sm'
                            : 'bg-primary shadow-sm'
                      }`}
                    >
                      {msg.isAutoReply && (
                        <span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wide text-white/60">
                          Réponse automatique
                        </span>
                      )}
                      {msg.message_text ? (
                        <p className={`text-[13.5px] leading-relaxed ${isIncoming ? 'text-foreground' : 'text-primary-foreground'}`}>
                          {msg.message_text}
                        </p>
                      ) : (
                        <p className="text-xs italic text-muted-foreground">
                          {msg.message_type === 'image' ? '📷 Image' : msg.message_type === 'story_reply' ? '📖 Story reply' : '(contenu non textuel)'}
                        </p>
                      )}
                      {msg.isAutoReply && (
                        <span className="mt-1 flex items-center gap-1 text-[10px] text-white/50">
                          <CheckCircle2 className="size-2.5" /> Auto-envoyé
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="size-2.5" />
                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {msg.auto_reply_sent && (
                        <span className="inline-flex items-center gap-0.5 text-success">
                          · <CheckCircle2 className="size-2.5" /> Répondu
                        </span>
                      )}
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
