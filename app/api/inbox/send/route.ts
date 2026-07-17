import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdapter } from '@/lib/channels/registry'
import type { ChannelAccountRef, Platform } from '@/lib/channels/types'

// POST /api/inbox/send — manually send a message from the inbox (human reply)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { channel_account_id, sender_id, text } = body
  if (!channel_account_id || !sender_id || !text?.trim()) {
    return NextResponse.json({ error: 'channel_account_id, sender_id et text sont requis' }, { status: 400 })
  }

  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id, access_token, platform, page_id, instagram_business_id, phone_number_id')
    .eq('id', channel_account_id)
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const externalId =
    (account.platform === 'whatsapp' ? account.phone_number_id : account.instagram_business_id || account.page_id) || ''

  if (!externalId) return NextResponse.json({ error: 'Compte mal configuré (externalId manquant)' }, { status: 500 })

  const ref: ChannelAccountRef = { id: account.id, externalId, accessToken: account.access_token }
  const adapter = getAdapter(account.platform as Platform)

  const result = await adapter.sendMessage(ref, sender_id, text.trim())
  if (!result) return NextResponse.json({ error: "Échec de l'envoi" }, { status: 502 })

  const { data: contactRow } = await supabase
    .from('contacts')
    .select('id')
    .eq('channel_account_id', account.id)
    .eq('sender_id', sender_id)
    .maybeSingle()

  const { data: logged } = await supabase
    .from('message_logs')
    .insert({
      channel_account_id: account.id,
      contact_id: contactRow?.id ?? null,
      sender_id,
      message_id: result.messageId,
      message_text: text.trim(),
      direction: 'outgoing',
    })
    .select()
    .single()

  return NextResponse.json(logged ?? { success: true })
}
