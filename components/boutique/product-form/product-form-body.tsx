'use client'

import { Package, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, FormSection, fieldA11y } from '@/components/shared/form-section'
import { useT } from '@/components/i18n-provider'
import { KindPicker } from './kind-picker'
import { PriceFields } from './price-fields'
import { VariantFields } from './variant-fields'
import { KindDetailsFields } from './kind-details-fields'
import { ImageUrlField } from './image-url-field'
import { LinkedPostsField } from './linked-posts-field'
import type { ProductFormApi } from './types'

/** Renders only the form sections — no <form> boundary, no footer. The caller (page or dialog)
 * owns those, since their placement differs (inline footer on the page, sticky in the dialog). */
export function ProductFormBody({ api, autoFocusName }: { api: ProductFormApi; autoFocusName?: boolean }) {
  const t = useT()
  const { form, errors, setField } = api

  return (
    <div className="flex flex-col gap-4">
      <FormSection
        icon={Tag}
        label={t('boutique.productForm.formBody.kindSectionLabel')}
        description={t('boutique.productForm.formBody.kindSectionDescription')}
      >
        <KindPicker value={form.kind} onChange={(k) => setField('kind', k)} />
      </FormSection>

      <FormSection icon={Package} label={t('boutique.productForm.formBody.infoSectionLabel')}>
        <Field
          label={t('boutique.productForm.formBody.nameLabel')}
          htmlFor="p-name"
          required
          error={errors.name}
          hint={t('boutique.productForm.formBody.nameHint')}
        >
          <Input
            {...fieldA11y('p-name', { hint: t('boutique.productForm.formBody.nameHint'), error: errors.name })}
            autoFocus={autoFocusName}
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
          />
        </Field>
        <Field label={t('boutique.productForm.formBody.descriptionLabel')} htmlFor="p-desc" hint={t('boutique.productForm.formBody.descriptionHint')}>
          <Textarea id="p-desc" value={form.description} onChange={(e) => setField('description', e.target.value)} />
        </Field>
      </FormSection>

      <PriceFields api={api} />
      {form.kind === 'physical' && <VariantFields api={api} />}
      <KindDetailsFields api={api} />
      <ImageUrlField api={api} />
      <LinkedPostsField api={api} />
    </div>
  )
}
