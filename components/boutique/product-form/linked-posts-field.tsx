'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Link2, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FormSection } from '@/components/shared/form-section'
import { PostPickerDialog } from '@/components/shared/post-picker-dialog'
import { useInstagramMedia } from '@/lib/instagram/use-instagram-media'
import type { ProductFormApi } from './types'

interface LinkedPost {
  id: string
  media_id: string | null
  shortcode: string | null
  permalink: string | null
  caption: string | null
  source: 'manual' | 'rapidapi_cache'
}

/**
 * "Posts liés" — manual half of post→product resolution (see
 * lib/agent/ecommerce/post-resolver.ts for the automatic RapidAPI-cache
 * half). Only rendered in edit mode: linking requires a real product_id,
 * see requirement §2's "rattachement manuel dans l'UI" and the plan's
 * decision to reuse the existing post picker rather than build a new one.
 */
export function LinkedPostsField({ api }: { api: ProductFormApi }) {
  const { productId, channelAccountId } = api
  const [posts, setPosts] = useState<LinkedPost[]>([])
  const [loading, setLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  // Shared cache with the picker dialog (see lib/instagram/use-instagram-media.ts)
  // — reading it here too costs nothing extra and gives access to caption/permalink
  // for whatever the merchant selects, without a second fetch.
  const { items: media } = useInstagramMedia(channelAccountId)

  useEffect(() => {
    if (!productId) return

    async function loadLinkedPosts() {
      setLoading(true)
      try {
        const res = await fetch(`/api/products/${productId}/posts`)
        const data = await res.json()
        setPosts(data.data ?? [])
      } catch {
        toast.error('Impossible de charger les posts liés')
      } finally {
        setLoading(false)
      }
    }

    loadLinkedPosts()
  }, [productId])

  if (!productId) return null

  const linkedMediaIds = posts.filter((p) => p.media_id).map((p) => p.media_id as string)

  async function handleSelect(ids: string[]) {
    setSaving(true)
    try {
      const selectedMedia = media.filter((m) => ids.includes(m.id))
      const res = await fetch(`/api/products/${productId}/posts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posts: selectedMedia.map((m) => ({ mediaId: m.id, permalink: m.permalink ?? null, caption: m.caption ?? null })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error('Erreur')
      if (data.skipped?.length) {
        toast.warning(`${data.skipped.length} post(s) déjà liés à un autre produit — ignorés`)
      }
      const reload = await fetch(`/api/products/${productId}/posts`).then((r) => r.json())
      setPosts(reload.data ?? [])
      toast.success('Posts liés mis à jour')
    } catch {
      toast.error("Impossible de mettre à jour les posts liés")
    } finally {
      setSaving(false)
    }
  }

  async function removePost(mediaId: string | null) {
    if (!mediaId) return
    await handleSelect(linkedMediaIds.filter((id) => id !== mediaId))
  }

  return (
    <FormSection icon={Link2} label="Posts liés" description="Utilisés pour identifier ce produit quand un client partage un post en DM.">
      <div className="flex flex-wrap gap-2">
        {loading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : posts.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucun post lié pour le moment.</p>
        ) : (
          posts.map((post) => (
            <span key={post.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs">
              {post.source === 'manual' ? 'Manuel' : 'Auto'} · {post.media_id?.slice(0, 8) ?? post.shortcode}
              {post.source === 'manual' && (
                <button type="button" onClick={() => removePost(post.media_id)} className="text-muted-foreground hover:text-foreground" disabled={saving}>
                  <X className="size-3" />
                </button>
              )}
            </span>
          ))
        )}
      </div>
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setPickerOpen(true)} disabled={saving}>
        Lier des posts
      </Button>
      {pickerOpen && (
        <PostPickerDialog
          open={pickerOpen}
          accountId={channelAccountId}
          selectedIds={linkedMediaIds}
          onSelect={handleSelect}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </FormSection>
  )
}
