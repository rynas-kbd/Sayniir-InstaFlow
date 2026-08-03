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
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      setCodes((prev) => [data, ...prev])
      toast.success('Code promo créé')
      setOpen(false)
      setCode('')
      setPercentOff('')
      setAmountOff('')
      setMaxUses('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de créer le code')
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
      toast.error('Impossible de mettre à jour le code')
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/discount-codes/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Impossible de supprimer le code')
      return
    }
    setCodes((prev) => prev.filter((c) => c.id !== id))
    toast.success('Code supprimé')
  }

  return (
    <div className="pt-4">
      <div className="mb-4 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button type="button" size="sm" />}>
            <Plus className="size-3.5" /> Nouveau code promo
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un code promo</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="dc-code">Code</Label>
                <Input id="dc-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="PROMO10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dc-percent">Réduction (%)</Label>
                  <Input id="dc-percent" type="number" min="1" max="100" value={percentOff} onChange={(e) => { setPercentOff(e.target.value); setAmountOff('') }} placeholder="10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dc-amount">Ou montant fixe (DZD)</Label>
                  <Input id="dc-amount" type="number" min="1" value={amountOff} onChange={(e) => { setAmountOff(e.target.value); setPercentOff('') }} placeholder="500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dc-max-uses">Nombre d&apos;utilisations max (facultatif)</Label>
                <Input id="dc-max-uses" type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Illimité" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleCreate} disabled={saving || !code.trim() || (!percentOff && !amountOff)}>
                {saving ? 'Création…' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {codes.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Aucun code promo"
          description="Créez un code que l'IA pourra appliquer en conversation quand un client le mentionne."
        />
      ) : (
        <div className="divide-y divide-border/60 rounded-xl border border-border">
          {codes.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-foreground">{c.code}</p>
                <p className="text-xs text-muted-foreground">
                  {c.percent_off ? `-${c.percent_off}%` : `-${c.amount_off} DZD`}
                  {c.max_uses ? ` · ${c.times_used}/${c.max_uses} utilisations` : ` · ${c.times_used} utilisation(s)`}
                  {c.expires_at ? ` · expire le ${new Date(c.expires_at).toLocaleDateString('fr-FR')}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Switch checked={c.is_active} onCheckedChange={(v) => handleToggle(c.id, v)} aria-label={c.is_active ? 'Désactiver' : 'Activer'} />
                <button type="button" onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive" aria-label={`Supprimer ${c.code}`}>
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
