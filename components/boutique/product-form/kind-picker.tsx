'use client'

import { OptionPicker } from '@/components/shared/option-picker'
import { PRODUCT_KINDS } from '../product-kinds'
import type { ProductKind } from '../types'

/** Thin wrapper around the shared OptionPicker for the product kind selector. */
export function KindPicker({ value, onChange }: { value: ProductKind; onChange: (kind: ProductKind) => void }) {
  return (
    <OptionPicker
      name="Type d'offre"
      value={value}
      onChange={onChange}
      options={PRODUCT_KINDS.map(({ key, title, hint, icon }) => ({ value: key, label: title, hint, icon }))}
    />
  )
}
