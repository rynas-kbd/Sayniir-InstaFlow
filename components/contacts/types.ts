export interface Tag {
  id: string
  name: string
  color: string
}

export interface Contact {
  id: string
  sender_id: string
  full_name: string | null
  username: string | null
  profile_pic: string | null
  phone: string | null
  email: string | null
  is_subscribed: boolean
  last_inbound_at: string | null
  contact_tags: { tag_id: string; tags: Tag }[]
}
