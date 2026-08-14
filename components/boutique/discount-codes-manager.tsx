'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useT, useLocale } from '@/components/i18n-provider'
import type { Locale } from '@/lib/i18n/config'

function toIntlLocale(locale: Locale): string {
  if (locale === 'ar') return 'ar'
  if (locale === 'en') return 'en-US'
  return 'fr-FR'
}

export interface DiscountCode {
  id: string
  code: string
  percent_off: number | null
  amount_off: number | null
  is_active: boolean
  expires_at: string | null
  max_uses: number | null
  times_used: number
}

/**
 * Agent instructions already reference "codes promo" with nothing behind
 * them — no table, no redemption logic, no way to create one. This is the
 * management UI; redemption happens in lib/agent/ecommerce/handler.ts via
 * the redeem_discount_code RPC (migration 20260822).
 */
export function DiscountCodesManager({ channelAccountId, initialCodes }: { channelAccountId: string; initialCodes: DiscountCode[] }) {
  const t = useT()
  const locale = useLocale()
  const intlLocale = toIntlLocale(locale)
  const [codes, setCodes] = useState<DiscountCode[]>(initialCodes)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [code, setCode] = useState('')
  const [percentOff, setPercentOff] = useState('')
  const [amountOff, setAmountOff] = useState('')
  const [maxUses, setMaxUses] = useState('')

  async function handleCreate() {
    if (!code.trim() || (!percentOff && !amountOff)) return
    setSaving(true)
    try {
      const res = await fetch('/api/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_account_id: channelAccountId,
          code: code.trim(),
          percent_off: percentOff ? Number(percentOff) : undefined,
          amount_off: amountOff ? Number(amountOff) : undefined,
          max_uses: maxUses ? Number(maxUses) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('boutique.discountCodes.genericError'))
      setCodes((prev) => [data, ...prev])
      toast.success(t('boutique.discountCodes.toastCreateSuccess'))
      setOpen(false)
      setCode('')
      setPercentOff('')
      setAmountOff('')
      setMaxUses('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('boutique.discountCodes.toastCreateError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: isActive } : c)))
    const res = await fetch(`/api/discount-codes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: isActive }),
    })
    if (!res.ok) {
      setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: !isActive } : c)))
      toast.error(t('boutique.discountCodes.toastToggleError'))
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/discount-codes/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error(t('boutique.discountCodes.toastDeleteError'))
      return
    }
    setCodes((prev) => prev.filter((c) => c.id !== id))
    toast.success(t('boutique.discountCodes.toastDeleteSuccess'))
  }

  return (
    <div className="pt-2">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-foreground">{t('boutique.discountCodes.title')}</h3>
          <p className="text-xs text-muted-foreground">{t('boutique.discountCodes.description')}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button type="button" size="sm" className="font-bold gap-1.5" />}>
            <Plus className="size-4" /> {t('boutique.discountCodes.newButton')}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">{t('boutique.discountCodes.dialogTitle')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3.5 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="dc-code" className="text-xs font-bold">{t('boutique.discountCodes.codeLabel')}</Label>
                <Input id="dc-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t('boutique.discountCodes.codePlaceholder')} className="font-mono uppercase font-bold" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="dc-percent" className="text-xs font-bold">{t('boutique.discountCodes.percentLabel')}</Label>
                  <Input id="dc-percent" type="number" min="1" max="100" value={percentOff} onChange={(e) => { setPercentOff(e.target.value); setAmountOff('') }} placeholder={t('boutique.discountCodes.percentPlaceholder')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dc-amount" className="text-xs font-bold">{t('boutique.discountCodes.amountLabel')}</Label>
                  <Input id="dc-amount" type="number" min="1" value={amountOff} onChange={(e) => { setAmountOff(e.target.value); setPercentOff('') }} placeholder={t('boutique.discountCodes.amountPlaceholder')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dc-max-uses" className="text-xs font-bold">{t('boutique.discountCodes.maxUsesLabel')}</Label>
                <Input id="dc-max-uses" type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder={t('boutique.discountCodes.maxUsesPlaceholder')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleCreate} disabled={saving || !code.trim() || (!percentOff && !amountOff)} className="font-bold">
                {saving ? t('boutique.discountCodes.creating') : t('boutique.discountCodes.createButton')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {codes.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={t('boutique.discountCodes.emptyTitle')}
          description={t('boutique.discountCodes.emptyDescription')}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm divide-y divide-border/40">
          {codes.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-extrabold tracking-wider bg-primary/10 text-primary border border-primary/20 rounded-lg px-2.5 py-1">
                    {c.code}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-foreground">
                      {c.percent_off
                        ? t('boutique.discountCodes.percentOff', { percent: c.percent_off })
                        : t('boutique.discountCodes.amountOff', { amount: c.amount_off?.toLocaleString(intlLocale) ?? '' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {c.max_uses
                      ? t('boutique.discountCodes.usageWithMax', { used: c.times_used, max: c.max_uses })
                      : t.plural('boutique.discountCodes.usageCount', c.times_used)}
                    {c.expires_at ? ` · ${t('boutique.discountCodes.expiresOn', { date: new Date(c.expires_at).toLocaleDateString(intlLocale) })}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground select-none cursor-pointer">
                  <span className={c.is_active ? 'text-primary font-bold' : 'text-muted-foreground'}>
                    {c.is_active ? t('boutique.discountCodes.active') : t('boutique.discountCodes.inactive')}
                  </span>
                  <Switch checked={c.is_active} onCheckedChange={(v) => handleToggle(c.id, v)} aria-label={c.is_active ? t('boutique.discountCodes.deactivateAria') : t('boutique.discountCodes.activateAria')} />
                </label>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="rounded-lg p-1.5 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                  aria-label={t('boutique.discountCodes.deleteAria', { code: c.code })}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
