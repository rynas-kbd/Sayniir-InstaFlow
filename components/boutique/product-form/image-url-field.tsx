'use client'

import { ImageIcon, Plus, X } from 'lucide-react'
import { Field, FormSection, fieldA11y } from '@/components/shared/form-section'
import { ImageUploadField } from '@/components/shared/image-upload-field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useT } from '@/components/i18n-provider'
import { ProductThumb } from '../product-thumb'
import type { ProductFormApi } from './types'

export function ImageUrlField({ api }: { api: ProductFormApi }) {
  const t = useT()
  const { form, errors, setField, channelAccountId } = api

  function updateGalleryImage(index: number, url: string) {
    setField('images', form.images.map((img, i) => (i === index ? url : img)))
  }

  function removeGalleryImage(index: number) {
    setField('images', form.images.filter((_, i) => i !== index))
  }

  return (
    <FormSection icon={ImageIcon} label={t('boutique.productForm.imageUrlField.sectionLabel')}>
      <div className="flex items-start gap-3">
        <ProductThumb src={form.image_url.trim() || null} kind={form.kind} className="mt-1" />
        <div className="flex-1">
          <Field
            label={t('boutique.productForm.imageUrlField.coverLabel')}
            htmlFor="p-image"
            error={errors.image_url}
            hint={t('boutique.productForm.imageUrlField.coverHint')}
          >
            <ImageUploadField
              {...fieldA11y('p-image', { hint: t('boutique.productForm.imageUrlField.coverHint'), error: errors.image_url })}
              value={form.image_url}
              onChange={(url) => setField('image_url', url)}
              channelAccountId={channelAccountId}
              folder="products"
            />
          </Field>
        </div>
      </div>

      <div className="mt-3">
        <Field
          label={t('boutique.productForm.imageUrlField.galleryLabel')}
          htmlFor="p-images"
          hint={t('boutique.productForm.imageUrlField.galleryHint')}
        >
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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeGalleryImage(i)}
                  aria-label={t('boutique.productForm.imageUrlField.removeImageAria')}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setField('images', [...form.images, ''])}>
              <Plus className="size-3.5" /> {t('boutique.productForm.imageUrlField.addImage')}
            </Button>
          </div>
        </Field>
      </div>

      <div className="mt-3">
        <Field label={t('boutique.productForm.imageUrlField.categoryLabel')} htmlFor="p-category" hint={t('boutique.productForm.imageUrlField.categoryHint')}>
          <Input
            id="p-category"
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
            placeholder={t('boutique.productForm.imageUrlField.categoryPlaceholder')}
          />
        </Field>
      </div>
    </FormSection>
  )
}
