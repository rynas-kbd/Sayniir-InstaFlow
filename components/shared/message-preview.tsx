'use client'

import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/components/i18n-provider'
import type { CardButton } from '@/components/flows/types'

export interface MessagePreviewCard {
  title: string
  subtitle: string
  imageUrl: string
  buttons: CardButton[]
}

export interface MessagePreviewProps {
  responseType: 'text' | 'card'
  text: string
  card?: MessagePreviewCard
  /** Muted "no content yet" placeholder instead of an empty bubble. */
  placeholder?: boolean
  className?: string
}

/** Shared preview bubble for the outgoing message/card content — factored out of the message
 * template preview box already used in campaign-card.tsx so campaigns and automation rules render
 * an identical mock instead of two near-copies. */
export function MessagePreview({ responseType, text, card, placeholder, className }: MessagePreviewProps) {
  if (responseType === 'card' && card) {
    return <CardPreview card={card} placeholder={placeholder} className={className} />
  }
  return <TextPreview text={text} placeholder={placeholder} className={className} />
}

function TextPreview({ text, placeholder, className }: { text: string; placeholder?: boolean; className?: string }) {
  const t = useT()
  const trimmed = text.trim()
  return (
    <div className={cn('min-h-[44px] rounded-lg border border-border/40 bg-muted/40 p-2.5 text-xs text-foreground/90', className)}>
      {trimmed ? (
        <p className="line-clamp-4 leading-relaxed italic">&ldquo;{trimmed}&rdquo;</p>
      ) : (
        <p className="italic text-muted-foreground/50">{placeholder ? t('shared.messagePreview.placeholder') : ''}</p>
      )}
    </div>
  )
}

function CardPreview({ card, placeholder, className }: { card: MessagePreviewCard; placeholder?: boolean; className?: string }) {
  const t = useT()
  const [broken, setBroken] = useState(false)
  const hasImage = card.imageUrl.trim() !== '' && !broken

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border/40 bg-muted/40', className)}>
      <div className="flex h-24 items-center justify-center bg-muted/70">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied URL, no next/image remotePatterns configured
          <img key={card.imageUrl} src={card.imageUrl} alt="" onError={() => setBroken(true)} className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
        )}
      </div>
      <div className="flex flex-col gap-1 p-2.5">
        <p className="line-clamp-1 text-xs font-bold text-foreground">
          {card.title.trim() ||
            (placeholder && <span className="italic text-muted-foreground/50">{t('shared.messagePreview.cardTitlePlaceholder')}</span>)}
        </p>
        {card.subtitle.trim() && <p className="line-clamp-2 text-[11px] text-muted-foreground">{card.subtitle}</p>}
        {card.buttons.length > 0 && (
          <div className="mt-1 flex flex-col gap-1">
            {card.buttons.map((btn, i) => (
              <span key={i} className="rounded-md border border-border/60 bg-card px-2 py-1 text-center text-[11px] font-medium text-primary">
                {btn.title || t('shared.messagePreview.defaultButton')}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
