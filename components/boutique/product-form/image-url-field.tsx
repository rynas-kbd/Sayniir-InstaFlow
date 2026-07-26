'use client'

import { ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Field, FormSection, fieldA11y } from '@/components/shared/form-section'
import { ProductThumb } from '../product-thumb'
import type { ProductFormApi } from './types'

export function ImageUrlField({ api }: { api: ProductFormApi }) {
  const { form, errors, setField } = api

  return (
    <FormSection icon={ImageIcon} label="Image">
      <div className="flex items-start gap-3">
        <ProductThumb src={form.image_url.trim() || null} kind={form.kind} className="mt-1" />
        <div className="flex-1">
          <Field label="URL image" htmlFor="p-image" error={errors.image_url} hint="Lien direct vers une image (https://…)">
            <Input
              {...fieldA11y('p-image', { hint: 'Lien direct vers une image (https://…)', error: errors.image_url })}
              type="url"
              value={form.image_url}
              onChange={(e) => setField('image_url', e.target.value)}
            />
          </Field>
        </div>
      </div>
    </FormSection>
  )
}
