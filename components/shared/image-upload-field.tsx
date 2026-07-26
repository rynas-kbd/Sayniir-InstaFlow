'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif'

/**
 * Generic "import an image or paste a link" field, backed by /api/uploads/image. Used by the
 * Boutique product form today; the upload endpoint and this component are deliberately not
 * boutique-specific so campaigns/automation rule cards/flow builder cards can reuse it later.
 */
export function ImageUploadField({
  id,
  value,
  onChange,
  channelAccountId,
  folder,
  ...a11y
}: {
  id?: string
  value: string
  onChange: (url: string) => void
  channelAccountId: string
  folder: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('channelAccountId', channelAccountId)
      formData.append('folder', folder)

      const res = await fetch('/api/uploads/image', { method: 'POST', body: formData })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? "Échec de l'import")
      }
      const { url } = await res.json()
      onChange(url)
      toast.success('Image importée')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible d'importer l'image")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleFile} />
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Upload className="size-3.5" /> {uploading ? 'Import…' : 'Importer une image'}
        </Button>
        {value.trim() !== '' && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')} aria-label="Retirer l'image">
            <X className="size-3.5" />
          </Button>
        )}
      </div>
      <Input
        {...a11y}
        id={id}
        type="url"
        placeholder="ou collez un lien direct (https://…)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
