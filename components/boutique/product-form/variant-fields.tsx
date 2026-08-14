'use client'

import { Palette } from 'lucide-react'
import { TagInput } from '@/components/shared/tag-input'
import { Field, FormSection } from '@/components/shared/form-section'
import { useT } from '@/components/i18n-provider'
import type { ProductFormApi } from './types'

export function VariantFields({ api }: { api: ProductFormApi }) {
  const t = useT()
  const { form, setField } = api

  return (
    <FormSection icon={Palette} label={t('boutique.productForm.variantFields.sectionLabel')}>
      <div className="flex flex-col gap-3.5 sm:flex-row">
        <div className="flex-1">
          <Field label={t('boutique.productForm.variantFields.sizesLabel')} htmlFor="p-sizes" hint={t('boutique.productForm.variantFields.tagInputHint')}>
            <TagInput
              id="p-sizes"
              value={form.sizes}
              onChange={(v) => setField('sizes', v)}
              placeholder={t('boutique.productForm.variantFields.sizesPlaceholder')}
            />
          </Field>
        </div>
        <div className="flex-1">
          <Field label={t('boutique.productForm.variantFields.colorsLabel')} htmlFor="p-colors" hint={t('boutique.productForm.variantFields.tagInputHint')}>
            <TagInput
              id="p-colors"
              value={form.colors}
              onChange={(v) => setField('colors', v)}
              placeholder={t('boutique.productForm.variantFields.colorsPlaceholder')}
            />
          </Field>
        </div>
      </div>
    </FormSection>
  )
}
