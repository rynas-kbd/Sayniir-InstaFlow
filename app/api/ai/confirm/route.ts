import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNdjsonStream } from '@/lib/ai/stream'
import { resolveCopilotProvider } from '@/lib/ai/provider'
import { checkAiCreditLimit } from '@/lib/ai/credits/meter'
import { runCopilotTurn } from '@/lib/ai/loop'
import { executeAiTool } from '@/lib/ai/tools/execute'
import { AI_TOOLS, getToolByName } from '@/lib/ai/tools'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/ai/confirm — executes a pending write_live tool call and resumes the turn.
// The client sends only the opaque toolCallId; the validated input never leaves the server
// (see docs/AI_NATIVE_DESIGN.md §6.2).
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const toolCallId = body?.toolCallId as string | undefined
  if (!toolCallId) return NextResponse.json({ error: 'toolCallId requis' }, { status: 400 })

  const { data: pending } = await supabase
    .from('ai_tool_calls')
    .select('id, conversation_id, channel_account_id, tool_use_id, tool_name, input, status, expires_at')
    .eq('id', toolCallId)
    .maybeSingle()

  if (!pending) return NextResponse.json({ error: 'Action introuvable' }, { status: 404 })
  if (pending.status !== 'pending_confirmation') {
    return NextResponse.json({ error: 'Cette action a déjà été traitée' }, { status: 409 })
  }
  if (new Date(pending.expires_at).getTime() < Date.now()) {
    await supabase.from('ai_tool_calls').update({ status: 'expired', resolved_at: new Date().toISOString() }).eq('id', toolCallId)
    return NextResponse.json({ error: 'Cette action a expiré, redemandez-la au copilote' }, { status: 410 })
  }

  const tool = getToolByName(pending.tool_name)
  if (!tool || tool.risk !== 'write_live') {
    return NextResponse.json({ error: 'Outil invalide' }, { status: 400 })
  }

  const result = await executeAiTool(
    tool,
    pending.input as never,
    { supabase, channelAccountId: pending.channel_account_id, userId: user.id },
    { conversationId: pending.conversation_id }
  )

  await supabase
    .from('ai_tool_calls')
    .update({
      status: result.ok ? 'executed' : 'denied',
      result: result.ok ? (result.output as Record<string, unknown>) : { error: result.error },
      resolved_at: new Date().toISOString(),
    })
    .eq('id', toolCallId)

  await supabase.from('ai_messages').insert({
    conversation_id: pending.conversation_id,
    role: 'tool',
    content: [
      {
        type: 'tool_result',
        toolUseId: pending.tool_use_id,
        content: result.ok ? JSON.stringify(result.output) : result.error,
        ...(result.ok ? {} : { isError: true }),
      },
    ],
  })

  const credits = await checkAiCreditLimit(user.id)
  let provider: Awaited<ReturnType<typeof resolveCopilotProvider>>
  try {
    provider = await resolveCopilotProvider(pending.channel_account_id, credits.limits.byokAllowed)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Copilote indisponible' }, { status: 503 })
  }

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
      conversationId: pending.conversation_id,
      channelAccountId: pending.channel_account_id,
      userId: user.id,
      userMessage: '',
      mode: 'resume',
    },
  })
    .catch((err) => push({ t: 'error', message: err instanceof Error ? err.message : 'Erreur inconnue' }))
    .finally(() => close())

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache, no-transform',
      'X-Conversation-Id': pending.conversation_id,
    },
  })
}
