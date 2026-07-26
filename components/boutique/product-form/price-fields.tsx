'use client'

import { Coins } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Field, FormSection, fieldA11y } from '@/components/shared/form-section'
import type { ProductFormApi } from './types'

const CURRENCIES = ['DZD', 'EUR', 'USD', 'MAD', 'TND']

export function PriceFields({ api }: { api: ProductFormApi }) {
  const { form, errors, setField } = api
  // Keep a saved product's currency selectable even if it falls outside our default list —
  // otherwise the Select would render empty and could write '' back on save.
  const currencyOptions = Array.from(new Set([...CURRENCIES, form.currency].filter(Boolean)))

  return (
    <FormSection icon={Coins} label="Prix & stock">
      <div className="flex flex-col gap-3.5 sm:flex-row">
        <div className="flex-1">
          <Field label="Prix" htmlFor="p-price" required error={errors.price}>
            <Input
              {...fieldA11y('p-price', { error: errors.price })}
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setField('price', e.target.value)}
            />
          </Field>
        </div>
        <div className="w-28">
          <Field label="Devise" htmlFor="p-currency" error={errors.currency}>
            <Select value={form.currency} onValueChange={(v) => setField('currency', v ?? 'DZD')}>
              <SelectTrigger id="p-currency" className="w-full" aria-invalid={errors.currency ? true : undefined}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        {form.kind === 'physical' && (
          <div className="flex-1">
            <Field label="Stock" htmlFor="p-stock" error={errors.stock_quantity}>
              <Input
                {...fieldA11y('p-stock', { error: errors.stock_quantity })}
                type="number"
                value={form.stock_quantity}
                onChange={(e) => setField('stock_quantity', e.target.value)}
              />
            </Field>
          </div>
        )}
      </div>
    </FormSection>
  )
}
