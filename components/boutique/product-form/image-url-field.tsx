'use client'

import { ImageIcon } from 'lucide-react'
import { Field, FormSection, fieldA11y } from '@/components/shared/form-section'
import { ImageUploadField } from '@/components/shared/image-upload-field'
import { ProductThumb } from '../product-thumb'
import type { ProductFormApi } from './types'

export function ImageUrlField({ api }: { api: ProductFormApi }) {
  const { form, errors, setField, channelAccountId } = api

  return (
    <FormSection icon={ImageIcon} label="Image">
      <div className="flex items-start gap-3">
        <ProductThumb src={form.image_url.trim() || null} kind={form.kind} className="mt-1" />
        <div className="flex-1">
          <Field label="Image" htmlFor="p-image" error={errors.image_url} hint="Importez un fichier ou collez un lien direct (https://…)">
            <ImageUploadField
              {...fieldA11y('p-image', { hint: 'Importez un fichier ou collez un lien direct (https://…)', error: errors.image_url })}
              value={form.image_url}
              onChange={(url) => setField('image_url', url)}
              channelAccountId={channelAccountId}
              folder="products"
            />
          </Field>
        </div>
      </div>
    </FormSection>
  )
}
