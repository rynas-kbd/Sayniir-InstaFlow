export interface Product {
  id: string
  channel_account_id: string
  name: string
  description: string | null
  price: number
  sizes: string[]
  colors: string[]
  image_url: string | null
  stock_quantity: number
  is_active: boolean
}

export interface Order {
  id: string
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
  payment_status: string
  shipping_status: string
  created_at: string
}

export interface AgentSettings {
  channel_account_id: string
  is_qa_active: boolean
  is_order_taking_active: boolean
  ai_provider: string
  ai_api_key: string
  ai_model: string
}
