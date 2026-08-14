'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Link2, Plus, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useT } from '@/components/i18n-provider'

export interface GrowthLink {
  id: string
  name: string
  code: string
  clicks: number
}

export function GrowthLinkPopover({
  channelAccountId,
  flowId,
  instagramUsername,
  links: initialLinks,
}: {
  channelAccountId: string
  flowId: string
  instagramUsername: string | null
  links: GrowthLink[]
}) {
  const t = useT()
  const [links, setLinks] = useState(initialLinks)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  function urlFor(code: string): string {
    return instagramUsername ? `https://ig.me/m/${instagramUsername}?ref=${code}` : `?ref=${code}`
  }

  async function createLink() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/growth-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_account_id: channelAccountId, flow_id: flowId, name: name.trim() }),
      })
      if (!res.ok) throw new Error()
      const created: GrowthLink = await res.json()
      setLinks((prev) => [created, ...prev])
      setName('')
      toast.success(t('flows.builder.growthLinkPopover.createdToast'))
    } catch {
      toast.error(t('flows.builder.growthLinkPopover.createError'))
    } finally {
      setSaving(false)
    }
  }

  async function deleteLink(id: string) {
    try {
      const res = await fetch(`/api/growth-links/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setLinks((prev) => prev.filter((l) => l.id !== id))
    } catch {
      toast.error(t('flows.builder.growthLinkPopover.deleteError'))
    }
  }

  function copyLink(code: string) {
    navigator.clipboard.writeText(urlFor(code))
    toast.success(t('flows.builder.growthLinkPopover.copiedToast'))
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <Link2 className="size-3.5" /> {t('flows.builder.growthLinkPopover.trigger')}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t('flows.builder.growthLinkPopover.description')}
        </p>

        {!instagramUsername && (
          <p className="mb-2 rounded-md border border-warning/20 bg-warning/10 px-2 py-1.5 text-[11px] text-warning">
            {t('flows.builder.growthLinkPopover.noInstagramWarning')}
          </p>
        )}

        <div className="space-y-2">
          {links.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">{t('flows.builder.growthLinkPopover.noLinks')}</p>
          ) : (
            links.map((l) => (
              <div key={l.id} className="rounded-md border border-border p-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-foreground">{l.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t('flows.builder.growthLinkPopover.clicksCount', { count: l.clicks })}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => copyLink(l.code)}
                      className="cursor-pointer rounded p-1 text-muted-foreground hover:text-primary"
                      aria-label={t('flows.builder.growthLinkPopover.copyAria')}
                    >
                      <Copy className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteLink(l.id)}
                      className="cursor-pointer rounded p-1 text-muted-foreground hover:text-destructive"
                      aria-label={t('flows.builder.growthLinkPopover.deleteAria')}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                {instagramUsername && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(urlFor(l.code))}`}
                    alt={t('flows.builder.growthLinkPopover.qrAlt', { name: l.name })}
                    width={120}
                    height={120}
                    className="rounded-md border border-border"
                  />
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 border-t border-border pt-2.5">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('flows.builder.growthLinkPopover.namePlaceholder')} className="text-xs" />
          <Button type="button" size="icon-sm" onClick={createLink} disabled={saving || !name.trim()} aria-label={t('flows.builder.growthLinkPopover.createAria')}>
            <Plus className="size-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
