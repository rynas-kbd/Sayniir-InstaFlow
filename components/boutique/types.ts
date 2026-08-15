export type ProductKind = 'physical' | 'service' | 'digital' | 'subscription' | 'event'

/** Per-kind free-form fields — see supabase/migrations/20260813_generalize_products.sql for the convention. */
export interface ProductMetadata {
  // service
  duration_minutes?: number
  location?: string
  // digital
  file_url?: string
  download_limit?: number
  // subscription
  billing_period?: 'monthly' | 'yearly'
  // event
  event_date?: string
  capacity?: number
  remaining?: number
}

export interface Product {
  id: string
  channel_account_id: string
  name: string
  description: string | null
  price: number
  currency: string
  kind: ProductKind
  metadata: ProductMetadata
  /** physical-only — meaningful only when kind === 'physical' */
  sizes: string[]
  colors: string[]
  image_url: string | null
  /** Supplementary gallery images — image_url stays the cover image for backward compatibility. */
  images: string[]
  category: string | null
  stock_quantity: number
  is_active: boolean
}

export interface Order {
  id: string
  contact_id: string | null
  /** Joined from contacts — null if the order predates the link or the contact was deleted. */
  contact: { id: string; full_name: string | null; username: string | null } | null
  customer_name: string
  customer_phone: string
  wilaya: string | null
  delivery_mode: string | null
  shipping_address: string
  product_name: string
  price: number
  size: string | null
  color: string | null
  quantity: number
  total_amount: number
  discount_percent_off: number | null
  discount_amount_off: number | null
  currency: string
  payment_status: string
  shipping_status: string
  created_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id?: string
  order_id?: string
  product_id: string | null
  variant_id?: string | null
  product_name: string
  size: string | null
  color: string | null
  quantity: number
  unit_price: number
  currency: string
  position: number
  extra_data?: Record<string, unknown>
  created_at?: string
}

/** A stale, non-confirmed order_session — the ready-made abandoned-cart signal that was never surfaced anywhere. */
export interface AbandonedSession {
  id: string
  sender_id: string
  customer_name: string | null
  status: string
  last_message_at: string
  items?: Array<{ product_name?: string | null; quantity?: number | null }>
  products: { name: string } | null
}

export interface AgentSettings {
  channel_account_id: string
  is_qa_active: boolean
  is_order_taking_active: boolean
  is_availability_check_active: boolean
  ai_provider: string
  ai_api_key: string
  ai_model: string
  instructions: string[]
  infos_to_collect: string[]
  vertical_config: {
    faqs?: Array<{ question: string; answer: string }>
    persona?: string
  }
}
