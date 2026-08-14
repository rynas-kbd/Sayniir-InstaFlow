'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useT } from '@/components/i18n-provider'
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
  const t = useT()
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
    const nextErrors = validateProductForm(form, t)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      const firstKey = Object.keys(nextErrors)[0] as ProductFormField
      document.getElementById(FIELD_IDS[firstKey])?.focus()
      toast.error(t('boutique.productForm.useProductForm.validationError'))
      return
    }

    setSaving(true)
    try {
      await onSave(buildProductPayload(form, channelAccountId, product))
      toast.success(product ? t('boutique.productForm.useProductForm.updateSuccess') : t('boutique.productForm.useProductForm.createSuccess'))
      onSaved?.()
    } catch {
      toast.error(t('boutique.productForm.useProductForm.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return { form, errors, saving, isEdit: Boolean(product), channelAccountId, productId: product?.id, setField, submit }
}
