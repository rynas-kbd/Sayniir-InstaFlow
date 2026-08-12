import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// DELETE /api/ai/conversations/[id] — supprime une conversation
export async function DELETE(
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
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })
  }

  // Supprimer la conversation (cascade supprimera les messages grâce à ON DELETE CASCADE)
  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('id', conversationId)

  if (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
