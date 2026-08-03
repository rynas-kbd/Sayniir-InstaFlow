import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptApiKey } from '@/lib/crypto'
import { PROVIDER_CONFIG, type CopilotProviderKind } from '@/lib/ai/models'
import { jsonError } from '@/lib/api/errors'

const MASK = '••••••••••••'
const VALID_PROVIDER_KINDS = new Set<CopilotProviderKind>(Object.keys(PROVIDER_CONFIG) as CopilotProviderKind[])

// GET /api/ai-settings?channelAccountId=... — copilot BYOK settings, key always masked.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const channelAccountId = request.nextUrl.searchParams.get('channelAccountId')
  if (!channelAccountId) return NextResponse.json({ error: 'channelAccountId requis' }, { status: 400 })

  const { data } = await supabase
    .from('agent_settings')
    .select('copilot_provider, copilot_api_key, copilot_model, copilot_enabled')
    .eq('channel_account_id', channelAccountId)
    .maybeSingle()

  return NextResponse.json({
    copilot_provider: data?.copilot_provider ?? 'openrouter',
    copilot_api_key: data?.copilot_api_key ? MASK : '',
    copilot_model: data?.copilot_model ?? '',
    copilot_enabled: data?.copilot_enabled ?? false,
  })
}

// PATCH /api/ai-settings — updates copilot BYOK settings. copilot_api_key === mask leaves the stored key untouched.
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const channelAccountId = body?.channel_account_id as string | undefined
  if (!channelAccountId) return NextResponse.json({ error: 'channel_account_id requis' }, { status: 400 })

  if (typeof body.copilot_provider === 'string' && !VALID_PROVIDER_KINDS.has(body.copilot_provider as CopilotProviderKind)) {
    return NextResponse.json({ error: 'Provider IA invalide' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('agent_settings')
    .select('copilot_api_key')
    .eq('channel_account_id', channelAccountId)
    .maybeSingle()

  let copilotApiKey = existing?.copilot_api_key ?? null
  if (typeof body.copilot_api_key === 'string' && body.copilot_api_key !== MASK) {
    copilotApiKey = body.copilot_api_key ? await encryptApiKey(body.copilot_api_key) : null
  }

  const patch: Record<string, unknown> = { channel_account_id: channelAccountId, copilot_api_key: copilotApiKey }
  if (typeof body.copilot_provider === 'string') patch.copilot_provider = body.copilot_provider
  if (typeof body.copilot_model === 'string') patch.copilot_model = body.copilot_model || null
  if (typeof body.copilot_enabled === 'boolean') patch.copilot_enabled = body.copilot_enabled

  const { data: updated, error } = await supabase
    .from('agent_settings')
    .upsert(patch, { onConflict: 'channel_account_id' })
    .select('copilot_provider, copilot_api_key, copilot_model, copilot_enabled')
    .single()

  if (error) return jsonError(500, 'Échec de la sauvegarde', error)
  if (!updated) return jsonError(500, 'Échec de la sauvegarde')

  return NextResponse.json({
    copilot_provider: updated.copilot_provider ?? 'openrouter',
    copilot_api_key: updated.copilot_api_key ? MASK : '',
    copilot_model: updated.copilot_model ?? '',
    copilot_enabled: updated.copilot_enabled ?? false,
  })
}
