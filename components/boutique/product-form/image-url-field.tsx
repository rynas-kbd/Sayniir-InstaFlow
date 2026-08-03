'use client'

import { ImageIcon, Plus, X } from 'lucide-react'
import { Field, FormSection, fieldA11y } from '@/components/shared/form-section'
import { ImageUploadField } from '@/components/shared/image-upload-field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ProductThumb } from '../product-thumb'
import type { ProductFormApi } from './types'

export function ImageUrlField({ api }: { api: ProductFormApi }) {
  const { form, errors, setField, channelAccountId } = api

  function updateGalleryImage(index: number, url: string) {
    setField('images', form.images.map((img, i) => (i === index ? url : img)))
  }

  function removeGalleryImage(index: number) {
    setField('images', form.images.filter((_, i) => i !== index))
  }

  return (
    <FormSection icon={ImageIcon} label="Image & catégorie">
      <div className="flex items-start gap-3">
        <ProductThumb src={form.image_url.trim() || null} kind={form.kind} className="mt-1" />
        <div className="flex-1">
          <Field label="Image de couverture" htmlFor="p-image" error={errors.image_url} hint="Importez un fichier ou collez un lien direct (https://…)">
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

      <div className="mt-3">
        <Field label="Images supplémentaires" htmlFor="p-images" hint="Affichées en plus de la couverture, ex. autres angles">
          <div className="flex flex-col gap-2">
            {form.images.map((img, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <ImageUploadField
                    value={img}
                    onChange={(url) => updateGalleryImage(i, url)}
                    channelAccountId={channelAccountId}
                    folder="products"
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeGalleryImage(i)} aria-label="Retirer cette image">
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setField('images', [...form.images, ''])}>
              <Plus className="size-3.5" /> Ajouter une image
            </Button>
          </div>
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Catégorie" htmlFor="p-category" hint="Facultatif — ex. Vêtements, Accessoires">
          <Input
            id="p-category"
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
            placeholder="Ex. Vêtements"
          />
        </Field>
      </div>
    </FormSection>
  )
}
