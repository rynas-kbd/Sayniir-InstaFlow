import { NextRequest, NextResponse } from 'next/server'
import { jsonError, badRequest } from '@/lib/api/errors'
import { requireUser, requireAccountOwnership } from '@/lib/api/auth'

// GET /api/discount-codes?accountId=...
export async function GET(request: NextRequest) {
  const auth = await requireUser()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const accountId = request.nextUrl.searchParams.get('accountId')
  if (!accountId) return badRequest('accountId requis')
  const ownership = await requireAccountOwnership(supabase, accountId, user.id)
  if (ownership !== true) return ownership

  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('channel_account_id', accountId)
    .order('created_at', { ascending: false })
  if (error) return jsonError(500, 'Une erreur est survenue', error)
  return NextResponse.json(data)
}

// POST /api/discount-codes — { channel_account_id, code, percent_off?, amount_off?, expires_at?, max_uses? }
export async function POST(request: NextRequest) {
  const auth = await requireUser()
  if (auth instanceof NextResponse) return auth
  const { supabase, user } = auth

  const body = await request.json().catch(() => ({}))
  const { channel_account_id, code, percent_off, amount_off, expires_at, max_uses } = body

  if (!channel_account_id || !code || typeof code !== 'string' || !code.trim()) {
    return badRequest('channel_account_id et code sont requis')
  }
  if (!percent_off && !amount_off) {
    return badRequest('percent_off ou amount_off requis')
  }
  const ownership = await requireAccountOwnership(supabase, channel_account_id, user.id)
  if (ownership !== true) return ownership

  const { data, error } = await supabase
    .from('discount_codes')
    .insert({
      channel_account_id,
      code: code.trim().toUpperCase(),
      percent_off: percent_off || null,
      amount_off: amount_off || null,
      expires_at: expires_at || null,
      max_uses: max_uses || null,
    })
    .select()
    .single()

  if (error) return jsonError(500, "Impossible de créer le code promo (peut-être déjà utilisé)", error)
  return NextResponse.json(data, { status: 201 })
}
