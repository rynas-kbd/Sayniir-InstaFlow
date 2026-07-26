import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNdjsonStream } from '@/lib/ai/stream'
import { resolveCopilotProvider } from '@/lib/ai/provider'
import { resolveAiContext } from '@/lib/ai/context/resolve'
import { getVolatileMemoryBlock } from '@/lib/ai/memory/service'
import { checkAiCreditLimit } from '@/lib/ai/credits/meter'
import { runCopilotTurn } from '@/lib/ai/loop'
import { AI_TOOLS } from '@/lib/ai/tools'
import type { AiContext } from '@/lib/ai/context/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/ai/chat — streams one copilot turn as newline-delimited JSON.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const channelAccountId = body?.channelAccountId as string | undefined
  const message = body?.message as string | undefined
  const context = (body?.context as AiContext | undefined) ?? { kind: 'none' }
  let conversationId = body?.conversationId as string | undefined

  if (!channelAccountId || !message?.trim()) {
    return NextResponse.json({ error: 'channelAccountId et message sont requis' }, { status: 400 })
  }

  const { data: account } = await supabase.from('channel_accounts').select('id').eq('id', channelAccountId).maybeSingle()
  if (!account) return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 })

  if (conversationId) {
    const { data: conversation } = await supabase.from('ai_conversations').select('id').eq('id', conversationId).maybeSingle()
    if (!conversation) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })
  } else {
    const { data: conversation, error } = await supabase
      .from('ai_conversations')
      .insert({ channel_account_id: channelAccountId, user_id: user.id })
      .select('id')
      .single()
    if (error || !conversation) return NextResponse.json({ error: 'Impossible de créer la conversation' }, { status: 500 })
    conversationId = conversation.id
  }
  if (!conversationId) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 500 })
  const resolvedConversationId = conversationId

  const credits = await checkAiCreditLimit(user.id)
  if (!credits.allowed) {
    return NextResponse.json({ error: 'Quota IA mensuel atteint. Passez à un plan supérieur ou ajoutez votre propre clé API.' }, { status: 402 })
  }

  let provider: Awaited<ReturnType<typeof resolveCopilotProvider>>
  try {
    provider = await resolveCopilotProvider(channelAccountId, credits.limits.byokAllowed)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Copilote indisponible' }, { status: 503 })
  }

  const [pageContextText, volatileMemory] = await Promise.all([
    resolveAiContext(supabase, channelAccountId, context),
    getVolatileMemoryBlock(supabase, channelAccountId),
  ])
  const combinedContextText = [pageContextText, volatileMemory].filter(Boolean).join('\n\n')
  const { stream, push, close } = createNdjsonStream()

  runCopilotTurn({
    provider: { kind: provider.kind, apiKey: provider.apiKey, model: provider.model },
    tools: AI_TOOLS,
    maxIterations: credits.limits.maxIterationsPerTurn,
    maxToolCalls: credits.limits.maxToolCallsPerTurn,
    byok: provider.byok,
    push,
    supabase,
    input: {
      conversationId: resolvedConversationId,
      channelAccountId,
      userId: user.id,
      userMessage: message.trim(),
      pageContextText: combinedContextText || undefined,
    },
  })
    .catch((err) => push({ t: 'error', message: err instanceof Error ? err.message : 'Erreur inconnue' }))
    .finally(() => close())

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache, no-transform',
      'X-Conversation-Id': resolvedConversationId,
    },
  })
}
