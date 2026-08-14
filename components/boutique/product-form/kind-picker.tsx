'use client'

import { OptionPicker } from '@/components/shared/option-picker'
import { PRODUCT_KINDS } from '../product-kinds'
import type { ProductKind } from '../types'
import { useT } from '@/components/i18n-provider'

/** Thin wrapper around the shared OptionPicker for the product kind selector. */
export function KindPicker({ value, onChange }: { value: ProductKind; onChange: (kind: ProductKind) => void }) {
  const t = useT()
  return (
    <OptionPicker
      name={t('boutique.productForm.kindPicker.name')}
      value={value}
      onChange={onChange}
      options={PRODUCT_KINDS.map(({ key, title, hint, icon }) => ({ value: key, label: t(title), hint: t(hint), icon }))}
    />
  )
}
