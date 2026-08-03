import type { ProductKind } from '../types'

/** All-string form state (native inputs), except sizes/colors which are chip arrays and kind/billing_period
 * which are already-typed unions. Mirrors the previous flat useState object in product-form-fields.tsx,
 * minus the comma-joined sizes/colors strings. */
export interface ProductFormState {
  name: string
  description: string
  price: string
  currency: string
  kind: ProductKind
  stock_quantity: string
  sizes: string[]
  colors: string[]
  image_url: string
  images: string[]
  category: string
  duration_minutes: string
  location: string
  file_url: string
  download_limit: string
  billing_period: 'monthly' | 'yearly'
  event_date: string
  capacity: string
}

export type ProductFormField = keyof ProductFormState
export type ProductFormErrors = Partial<Record<ProductFormField, string>>

export interface ProductFormApi {
  form: ProductFormState
  errors: ProductFormErrors
  saving: boolean
  isEdit: boolean
  channelAccountId: string
  setField: <K extends ProductFormField>(key: K, value: ProductFormState[K]) => void
  submit: (e: React.FormEvent) => void
}
