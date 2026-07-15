export interface Conversation {
  senderId: string
  senderUsername: string | null
  senderFullName: string | null
  senderProfilePic: string | null
  accountUsername: string | null
  lastMessage: string | null
  lastMessageAt: string
  lastDirection: 'incoming' | 'outgoing'
  messageCount: number
  hasUnreplied: boolean
  hasAutoReplied: boolean
}

export interface MessageItem {
  id: string
  direction: 'incoming' | 'outgoing'
  message_text: string | null
  message_type: string
  reply_text: string | null
  auto_reply_sent: boolean
  created_at: string
  sender_username: string | null
  sender_full_name: string | null
  sender_profile_pic: string | null
  sender_id: string
}
