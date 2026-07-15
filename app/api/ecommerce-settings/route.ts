import { NextRequest, NextResponse } from 'next/server'
import { encryptApiKey, decryptApiKey, isEncrypted } from '@/lib/crypto'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId')
  if (!accountId) return NextResponse.json({ error: 'Missing accountId' }, { status: 400 })

  // Verify the account belongs to this user
  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', accountId)
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const { data: settings, error } = await supabase
    .from('agent_settings')
    .select('*')
    .eq('channel_account_id', accountId)
    .single()

  // If no settings exist yet, return a default empty object
  if (!settings || error?.code === 'PGRST116') {
    return NextResponse.json({
      channel_account_id: accountId,
      is_active: false,
      is_qa_active: false,
      is_order_taking_active: false,
      instructions: [],
      infos_to_collect: [],
      ai_provider: 'gemini',
      ai_api_key: '',
      ai_model: 'gemini-1.5-flash',
      default_message_enabled: true,
      default_message_text: 'Merci pour votre message ! Nous vous répondrons bientôt. 🙏',
      default_message_frequency: 'always'
    })
  }

  const responseData = { ...settings };
  // Decrypt API key if stored encrypted
  if (responseData.ai_api_key && isEncrypted(responseData.ai_api_key)) {
    try {
      responseData.ai_api_key = await decryptApiKey(responseData.ai_api_key);
    } catch (e) {
      console.error('Failed to decrypt ai_api_key', e);
      responseData.ai_api_key = '';
    }
  }
  // Mask before sending to client
  if (responseData.ai_api_key) {
    responseData.ai_api_key = '••••••••••••';
  }

  return NextResponse.json(responseData)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    channel_account_id,
    is_active,
    is_qa_active,
    is_order_taking_active,
    instructions,
    infos_to_collect,
    ai_provider,
    ai_api_key,
    ai_model,
    default_message_enabled,
    default_message_text,
    default_message_frequency,
    flows_enabled
  } = body

  if (!channel_account_id) {
    return NextResponse.json({ error: 'Missing channel_account_id' }, { status: 400 })
  }

  // Verify the account belongs to this user
  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', channel_account_id)
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  // Fetch existing to handle partial updates
  const { data: existing } = await supabase
    .from('agent_settings')
    .select('*')
    .eq('channel_account_id', channel_account_id)
    .single()

  let finalApiKey = existing?.ai_api_key;
  if (ai_api_key !== '••••••••••••') {
    // New value provided, encrypt it before storing
    const plain = ai_api_key || null;
    finalApiKey = plain ? await encryptApiKey(plain) : null;
  } else {
    // Preserve existing encrypted value
    finalApiKey = existing?.ai_api_key ?? null;
  }

  const { data: settings, error } = await supabase
    .from('agent_settings')
    .upsert({
      channel_account_id,
      is_active: is_active ?? existing?.is_active ?? false,
      is_qa_active: is_qa_active ?? existing?.is_qa_active ?? false,
      is_order_taking_active: is_order_taking_active ?? existing?.is_order_taking_active ?? false,
      instructions: instructions ?? existing?.instructions ?? [],
      infos_to_collect: infos_to_collect ?? existing?.infos_to_collect ?? [],
      ai_provider: ai_provider ?? existing?.ai_provider ?? 'gemini',
      ai_api_key: finalApiKey,
      ai_model: ai_model ?? existing?.ai_model ?? 'gemini-1.5-flash',
      default_message_enabled: default_message_enabled ?? existing?.default_message_enabled ?? true,
      default_message_text: default_message_text ?? existing?.default_message_text ?? 'Merci pour votre message ! Nous vous répondrons bientôt. 🙏',
      default_message_frequency: default_message_frequency ?? existing?.default_message_frequency ?? 'always',
      flows_enabled: flows_enabled ?? existing?.flows_enabled ?? false,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const responseData = { ...settings };
  // Decrypt before masking for internal use if needed
  if (responseData.ai_api_key && isEncrypted(responseData.ai_api_key)) {
    try {
      responseData.ai_api_key = await decryptApiKey(responseData.ai_api_key);
    } catch {
      responseData.ai_api_key = '';
    }
  }
  // Mask for client
  if (responseData.ai_api_key) {
    responseData.ai_api_key = '••••••••••••';
  }
  return NextResponse.json(responseData)
}
