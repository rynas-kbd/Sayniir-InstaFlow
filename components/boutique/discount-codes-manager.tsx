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
    <div className="pt-2">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-foreground">Codes promotionnels</h3>
          <p className="text-xs text-muted-foreground">Créés pour être reconnus et appliqués automatiquement par l&apos;agent IA dans le chat.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button type="button" size="sm" className="font-bold gap-1.5" />}>
            <Plus className="size-4" /> Nouveau code promo
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Créer un code promo</DialogTitle>
            </DialogHeader>
            <div className="space-y-3.5 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="dc-code" className="text-xs font-bold">Code promo (ex: PROMO10)</Label>
                <Input id="dc-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BIENVENUE20" className="font-mono uppercase font-bold" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="dc-percent" className="text-xs font-bold">Réduction (%)</Label>
                  <Input id="dc-percent" type="number" min="1" max="100" value={percentOff} onChange={(e) => { setPercentOff(e.target.value); setAmountOff('') }} placeholder="10" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dc-amount" className="text-xs font-bold">Ou montant fixe (DZD)</Label>
                  <Input id="dc-amount" type="number" min="1" value={amountOff} onChange={(e) => { setAmountOff(e.target.value); setPercentOff('') }} placeholder="500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dc-max-uses" className="text-xs font-bold">Nombre d&apos;utilisations max (facultatif)</Label>
                <Input id="dc-max-uses" type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Illimité" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleCreate} disabled={saving || !code.trim() || (!percentOff && !amountOff)} className="font-bold">
                {saving ? 'Création…' : 'Créer le code'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {codes.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Aucun code promo actif"
          description="Créez un code promo pour stimuler vos ventes et permettre à l'IA d'offrir des réductions lors du closings."
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
                      {c.percent_off ? `-${c.percent_off}% de réduction` : `-${c.amount_off?.toLocaleString('fr-FR')} DZD de réduction`}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {c.max_uses ? `${c.times_used} / ${c.max_uses} utilisations` : `${c.times_used} utilisation(s)`}
                    {c.expires_at ? ` · Expire le ${new Date(c.expires_at).toLocaleDateString('fr-FR')}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground select-none cursor-pointer">
                  <span className={c.is_active ? 'text-primary font-bold' : 'text-muted-foreground'}>
                    {c.is_active ? 'Actif' : 'Inactif'}
                  </span>
                  <Switch checked={c.is_active} onCheckedChange={(v) => handleToggle(c.id, v)} aria-label={c.is_active ? 'Désactiver' : 'Activer'} />
                </label>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="rounded-lg p-1.5 text-muted-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                  aria-label={`Supprimer ${c.code}`}
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
