import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/ai/conversations — récupère toutes les conversations de l'utilisateur pour un compte
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const channelAccountId = request.nextUrl.searchParams.get('channelAccountId')
  if (!channelAccountId) {
    return NextResponse.json({ error: 'channelAccountId est requis' }, { status: 400 })
  }

  // Vérifier que l'utilisateur possède ce compte
  const { data: account } = await supabase
    .from('channel_accounts')
    .select('id')
    .eq('id', channelAccountId)
    .eq('user_id', user.id)
    .maybeSingle()
  
  if (!account) {
    return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 })
  }

  // Récupérer toutes les conversations pour ce compte
  const { data: conversations, error } = await supabase
    .from('ai_conversations')
    .select('id, title, created_at, updated_at')
    .eq('channel_account_id', channelAccountId)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des conversations' }, { status: 500 })
  }

  return NextResponse.json({ conversations: conversations ?? [] })
}
