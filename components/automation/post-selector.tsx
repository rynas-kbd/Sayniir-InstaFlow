'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InstagramMedia {
  id: string
  thumbnail_url?: string
  media_url: string
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
  const [media, setMedia] = useState<InstagramMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds)

  useEffect(() => {
    fetch(`/api/instagram/media?accountId=${accountId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setMedia(data.data ?? [])
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [accountId])

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
          <div className="grid max-h-90 grid-cols-3 gap-2.5 overflow-y-auto pr-1">
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
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                      <Check className="size-3.5" strokeWidth={3} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
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
