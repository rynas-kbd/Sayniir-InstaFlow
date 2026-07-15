export interface Contact {
  id: string
  channel_account_id: string
  sender_id: string
  full_name: string | null
  username: string | null
  profile_pic: string | null
  phone: string | null
  email: string | null
  custom_fields: Record<string, unknown>
  is_subscribed: boolean
  last_seen_at: string | null
  last_inbound_at: string | null
  first_seen_at: string
  created_at: string
}

export interface Tag {
  id: string
  channel_account_id: string
  name: string
  color: string
  created_at: string
}

export interface SenderProfile {
  username?: string | null
  name?: string | null
  profilePic?: string | null
}
