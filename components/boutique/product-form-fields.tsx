'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Package, Coins, Palette, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FormSection } from '@/components/shared/form-section'
import type { Product } from './types'

export interface ProductFormFieldsProps {
  channelAccountId: string
  product?: Product
  onSave: (data: Partial<Product> & { channel_account_id: string }) => Promise<void>
  onSaved?: () => void
  onCancel?: () => void
  submitLabel?: string
}

/** Shared fields for both ProductFormDialog (edit) and the /boutique/products/new page (create). */
export function ProductFormFields({ channelAccountId, product, onSave, onSaved, onCancel, submitLabel }: ProductFormFieldsProps) {
  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price?.toString() ?? '',
    stock_quantity: product?.stock_quantity?.toString() ?? '0',
    sizes: product?.sizes?.join(', ') ?? '',
    colors: product?.colors?.join(', ') ?? '',
    image_url: product?.image_url ?? '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        channel_account_id: channelAccountId,
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        stock_quantity: parseInt(form.stock_quantity, 10) || 0,
        sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
        image_url: form.image_url || null,
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
            <Label htmlFor="p-price">Prix (DZD)</Label>
            <Input
              id="p-price"
              type="number"
              step="0.01"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="p-stock">Stock</Label>
            <Input
              id="p-stock"
              type="number"
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
            />
          </div>
        </div>
      </FormSection>

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
