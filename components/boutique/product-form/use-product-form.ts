'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { emptyForm, validateProductForm, buildProductPayload, FIELD_IDS } from './product-form-schema'
import type { Product } from '../types'
import type { ProductFormApi, ProductFormErrors, ProductFormField, ProductFormState } from './types'

export interface UseProductFormOptions {
  channelAccountId: string
  product?: Product
  onSave: (data: Partial<Product> & { channel_account_id: string }) => Promise<void>
  onSaved?: () => void
}

/** Owns the product form's state, per-field error lifecycle, and submit flow. The only stateful
 * piece of the form — everything else (schema, sections, footer) is presentational or pure. */
export function useProductForm({ channelAccountId, product, onSave, onSaved }: UseProductFormOptions): ProductFormApi {
  const [form, setForm] = useState<ProductFormState>(() => emptyForm(product))
  const [errors, setErrors] = useState<ProductFormErrors>({})
  const [saving, setSaving] = useState(false)

  function setField<K extends ProductFormField>(key: K, value: ProductFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    // Clear only this field's error — instant relief without flickering unrelated messages.
    setErrors((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors = validateProductForm(form)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      const firstKey = Object.keys(nextErrors)[0] as ProductFormField
      document.getElementById(FIELD_IDS[firstKey])?.focus()
      toast.error('Vérifiez les champs en rouge')
      return
    }

    setSaving(true)
    try {
      await onSave(buildProductPayload(form, channelAccountId, product))
      toast.success(product ? 'Produit mis à jour' : 'Produit créé')
      onSaved?.()
    } catch {
      toast.error("Erreur lors de l'enregistrement du produit")
    } finally {
      setSaving(false)
    }
  }

  return { form, errors, saving, isEdit: Boolean(product), setField, submit }
}
