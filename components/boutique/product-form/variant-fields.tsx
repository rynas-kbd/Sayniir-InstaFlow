'use client'

import { Palette } from 'lucide-react'
import { TagInput } from '@/components/shared/tag-input'
import { Field, FormSection } from '@/components/shared/form-section'
import type { ProductFormApi } from './types'

export function VariantFields({ api }: { api: ProductFormApi }) {
  const { form, setField } = api

  return (
    <FormSection icon={Palette} label="Variantes">
      <div className="flex flex-col gap-3.5 sm:flex-row">
        <div className="flex-1">
          <Field label="Tailles" htmlFor="p-sizes" hint="Entrée ou virgule pour ajouter">
            <TagInput id="p-sizes" value={form.sizes} onChange={(v) => setField('sizes', v)} placeholder="S, M, L…" />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Couleurs" htmlFor="p-colors" hint="Entrée ou virgule pour ajouter">
            <TagInput id="p-colors" value={form.colors} onChange={(v) => setField('colors', v)} placeholder="Noir, Blanc…" />
          </Field>
        </div>
      </div>
    </FormSection>
  )
}
