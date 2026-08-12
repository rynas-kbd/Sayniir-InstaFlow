import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/ai/conversations/[id]/messages — récupère tous les messages d'une conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: conversationId } = await params

  // Vérifier que l'utilisateur possède cette conversation
  const { data: conversation } = await supabase
    .from('ai_conversations')
    .select('id, channel_account_id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })
  }

  // Récupérer tous les messages
  const { data: messages, error } = await supabase
    .from('ai_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des messages' }, { status: 500 })
  }

  return NextResponse.json({ messages: messages ?? [] })
}
