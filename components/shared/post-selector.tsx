'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, Loader2, Film, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useInstagramMedia } from '@/lib/instagram/use-instagram-media'

function MediaTypeBadge({ mediaType }: { mediaType?: string }) {
  if (mediaType === 'VIDEO') {
    return (
      <div className="absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-black/55 text-white">
        <Film className="size-3" />
      </div>
    )
  }
  if (mediaType === 'CAROUSEL_ALBUM') {
    return (
      <div className="absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-black/55 text-white">
        <Layers className="size-3" />
      </div>
    )
  }
  return null
}

export function PostSelector({
  accountId,
  selectedIds,
  onSelect,
  onClose,
}: {
  accountId: string
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  onClose: () => void
}) {
  const { items: media, loading, loadingMore, error, hasMore, loadMore } = useInstagramMedia(accountId)
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds)

  function toggle(id: string) {
    setLocalSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-4 text-[15px] font-bold text-foreground">Sélectionner des posts</h3>

      <div className="min-h-[200px] flex-1">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-5 text-center text-sm text-destructive">Erreur : {error}</div>
        ) : media.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Aucun post trouvé sur ce compte.
          </div>
        ) : (
          <>
            <div className="grid max-h-90 grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3">
              {media.map((m) => {
                const isSelected = localSelected.includes(m.id)
                return (
                  <div
                    key={m.id}
                    className={`relative aspect-square cursor-pointer overflow-hidden rounded-md border-2 bg-muted transition-all ${
                      isSelected ? 'scale-95 border-primary' : 'border-transparent hover:opacity-75'
                    }`}
                    onClick={() => toggle(m.id)}
                  >
                    <Image
                      src={m.thumbnail_url || m.media_url}
                      alt="post"
                      fill
                      unoptimized
                      sizes="150px"
                      className="pointer-events-none object-cover"
                    />
                    <MediaTypeBadge mediaType={m.media_type} />
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="size-3.5" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {hasMore && (
              <div className="mt-3 flex justify-center">
                <Button type="button" variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  {loadingMore ? 'Chargement…' : 'Charger plus'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-5 flex gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
        <Button
          type="button"
          className="flex-1"
          onClick={() => {
            onSelect(localSelected)
            onClose()
          }}
        >
          Valider ({localSelected.length})
        </Button>
      </div>
    </div>
  )
}
