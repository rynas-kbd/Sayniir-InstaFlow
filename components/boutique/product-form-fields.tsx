'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Package, Coins, Palette, ImageIcon, Tag, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { FormSection } from '@/components/shared/form-section'
import type { Product, ProductKind } from './types'

export interface ProductFormFieldsProps {
  channelAccountId: string
  product?: Product
  onSave: (data: Partial<Product> & { channel_account_id: string }) => Promise<void>
  onSaved?: () => void
  onCancel?: () => void
  submitLabel?: string
}

const KIND_LABELS: Record<ProductKind, string> = {
  physical: 'Produit physique',
  service: 'Service / RDV',
  digital: 'Produit digital',
  subscription: 'Abonnement',
  event: 'Billet / événement',
}

/** Shared fields for both ProductFormDialog (edit) and the /boutique/products/new page (create). */
export function ProductFormFields({ channelAccountId, product, onSave, onSaved, onCancel, submitLabel }: ProductFormFieldsProps) {
  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price?.toString() ?? '',
    currency: product?.currency ?? 'DZD',
    kind: product?.kind ?? ('physical' as ProductKind),
    stock_quantity: product?.stock_quantity?.toString() ?? '0',
    sizes: product?.sizes?.join(', ') ?? '',
    colors: product?.colors?.join(', ') ?? '',
    image_url: product?.image_url ?? '',
    duration_minutes: product?.metadata?.duration_minutes?.toString() ?? '',
    location: product?.metadata?.location ?? '',
    file_url: product?.metadata?.file_url ?? '',
    download_limit: product?.metadata?.download_limit?.toString() ?? '',
    billing_period: product?.metadata?.billing_period ?? 'monthly',
    event_date: product?.metadata?.event_date ?? '',
    capacity: product?.metadata?.capacity?.toString() ?? '',
  })
  const [saving, setSaving] = useState(false)

  function buildMetadata(): Record<string, unknown> {
    switch (form.kind) {
      case 'service':
        return {
          ...(form.duration_minutes ? { duration_minutes: parseInt(form.duration_minutes, 10) } : {}),
          ...(form.location ? { location: form.location } : {}),
        }
      case 'digital':
        return {
          ...(form.file_url ? { file_url: form.file_url } : {}),
          ...(form.download_limit ? { download_limit: parseInt(form.download_limit, 10) } : {}),
        }
      case 'subscription':
        return { billing_period: form.billing_period }
      case 'event': {
        const capacity = form.capacity ? parseInt(form.capacity, 10) : undefined
        return {
          ...(form.event_date ? { event_date: form.event_date } : {}),
          ...(capacity !== undefined ? { capacity, remaining: product?.metadata?.remaining ?? capacity } : {}),
        }
      }
      default:
        return {}
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        channel_account_id: channelAccountId,
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        currency: form.currency,
        kind: form.kind,
        stock_quantity: parseInt(form.stock_quantity, 10) || 0,
        sizes: form.kind === 'physical' ? form.sizes.split(',').map((s) => s.trim()).filter(Boolean) : [],
        colors: form.kind === 'physical' ? form.colors.split(',').map((c) => c.trim()).filter(Boolean) : [],
        image_url: form.image_url || null,
        metadata: buildMetadata(),
      })
      toast.success(product ? 'Produit mis à jour' : 'Produit créé')
      onSaved?.()
    } catch {
      toast.error("Erreur lors de l'enregistrement du produit")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormSection icon={Tag} label="Type d'offre">
        <div className="space-y-1.5">
          <Label htmlFor="p-kind">Type</Label>
          <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: (v ?? 'physical') as ProductKind })}>
            <SelectTrigger id="p-kind" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(KIND_LABELS) as ProductKind[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {KIND_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FormSection>

      <FormSection icon={Package} label="Informations">
        <div className="space-y-1.5">
          <Label htmlFor="p-name">Nom</Label>
          <Input id="p-name" autoFocus required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-desc">Description</Label>
          <Textarea id="p-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </FormSection>

      <FormSection icon={Coins} label="Prix & stock">
        <div className="flex flex-col gap-3.5 sm:flex-row">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="p-price">Prix</Label>
            <Input
              id="p-price"
              type="number"
              step="0.01"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div className="w-28 space-y-1.5">
            <Label htmlFor="p-currency">Devise</Label>
            <Input id="p-currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} />
          </div>
          {form.kind === 'physical' && (
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="p-stock">Stock</Label>
              <Input
                id="p-stock"
                type="number"
                value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
              />
            </div>
          )}
        </div>
      </FormSection>

      {form.kind === 'physical' && (
        <FormSection icon={Palette} label="Variantes">
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="p-sizes">Tailles (virgules)</Label>
              <Input id="p-sizes" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S, M, L" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="p-colors">Couleurs (virgules)</Label>
              <Input id="p-colors" value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="Noir, Blanc" />
            </div>
          </div>
        </FormSection>
      )}

      {form.kind === 'service' && (
        <FormSection icon={Calendar} label="Détails du service">
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="p-duration">Durée (minutes)</Label>
              <Input
                id="p-duration"
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="p-location">Lieu</Label>
              <Input
                id="p-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="En ligne, cabinet, à domicile…"
              />
            </div>
          </div>
        </FormSection>
      )}

      {form.kind === 'digital' && (
        <FormSection icon={Calendar} label="Fichier digital">
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="p-file">URL du fichier</Label>
              <Input id="p-file" type="url" value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="p-download-limit">Limite de téléchargements</Label>
              <Input
                id="p-download-limit"
                type="number"
                value={form.download_limit}
                onChange={(e) => setForm({ ...form, download_limit: e.target.value })}
                placeholder="Illimité si vide"
              />
            </div>
          </div>
        </FormSection>
      )}

      {form.kind === 'subscription' && (
        <FormSection icon={Calendar} label="Facturation">
          <div className="space-y-1.5">
            <Label htmlFor="p-billing">Période de facturation</Label>
            <Select value={form.billing_period} onValueChange={(v) => setForm({ ...form, billing_period: (v ?? 'monthly') as 'monthly' | 'yearly' })}>
              <SelectTrigger id="p-billing" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensuelle</SelectItem>
                <SelectItem value="yearly">Annuelle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FormSection>
      )}

      {form.kind === 'event' && (
        <FormSection icon={Calendar} label="Événement">
          <div className="flex flex-col gap-3.5 sm:flex-row">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="p-event-date">Date</Label>
              <Input id="p-event-date" type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="p-capacity">Places disponibles</Label>
              <Input id="p-capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
          </div>
        </FormSection>
      )}

      <FormSection icon={ImageIcon} label="Image">
        <div className="space-y-1.5">
          <Label htmlFor="p-image">URL image</Label>
          <Input id="p-image" type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
        </div>
      </FormSection>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement…' : submitLabel ?? (product ? 'Sauvegarder' : 'Créer')}
        </Button>
      </div>
    </form>
  )
}
