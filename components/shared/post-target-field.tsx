'use client'

import Image from 'next/image'
import { ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useInstagramMedia } from '@/lib/instagram/use-instagram-media'
import { useT } from '@/components/i18n-provider'

const MAX_PREVIEW_THUMBS = 5

/** Preview + entry point for the post picker — the actual grid/selection UI lives in
 * the caller-owned dialog (opened via `onOpen`), so this component only renders what's
 * already chosen and never owns open/closed state itself. */
export function PostTargetField({
  accountId,
  selectedIds,
  onOpen,
}: {
  accountId: string
  selectedIds: string[]
  onOpen: () => void
}) {
  const t = useT()
  const { items } = useInstagramMedia(selectedIds.length > 0 ? accountId : undefined)

  if (selectedIds.length === 0) {
    return (
      <div className="space-y-1.5">
        <Button type="button" variant="outline" className="w-full" onClick={onOpen}>
          <ImageIcon className="size-3.5" /> {t('shared.postTargetField.select')}
        </Button>
        <p className="text-[11px] text-muted-foreground">{t('shared.postTargetField.hint')}</p>
      </div>
    )
  }

  const byId = new Map(items.map((m) => [m.id, m]))
  const shown = selectedIds.slice(0, MAX_PREVIEW_THUMBS)
  const overflow = selectedIds.length - shown.length

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {shown.map((id) => {
          const media = byId.get(id)
          return (
            <div
              key={id}
              className="relative size-9 shrink-0 overflow-hidden rounded-md border-2 border-background bg-muted"
            >
              {media ? (
                <Image
                  src={media.thumbnail_url || media.media_url}
                  alt="post"
                  fill
                  unoptimized
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <ImageIcon className="size-3.5 text-muted-foreground/50" />
                </div>
              )}
            </div>
          )
        })}
        {overflow > 0 && (
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-md border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground">
            +{overflow}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="cursor-pointer text-[13px] text-muted-foreground underline hover:text-foreground"
      >
        {t('shared.postTargetField.edit')}
      </button>
    </div>
  )
}
