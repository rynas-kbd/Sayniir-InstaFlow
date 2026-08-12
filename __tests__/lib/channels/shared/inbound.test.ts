import { describe, test, expect, vi, beforeEach } from 'vitest'
import type { AgentChannel } from '@/lib/agent/messaging'
import type { NormalizedInboundMessage } from '@/lib/channels/types'
import { makeFakeSupabase, type FakeSupabase } from '../../../helpers/fake-supabase'

/**
 * Routing regression coverage for dispatchInboundMessage — the audit's F1
 * fix (handle-webhook.test.ts) makes messages reach this function again;
 * these tests pin down what it does with them: a paused conversation stays
 * untouched by automation, flows take priority over the Q&A/tunnel agent,
 * an LLM failure falls back to the default message instead of leaving the
 * customer with silence (F3), and voice reaches the exact same routing as
 * text (F8).
 */

const findChannelAccountByExternalId = vi.fn()
vi.mock('@/lib/channels/shared/lookup', () => ({
  findChannelAccountByExternalId: (...args: unknown[]) => findChannelAccountByExternalId(...args),
}))

const resolveDispatchContext = vi.fn()
vi.mock('@/lib/channels/shared/context', () => ({
  resolveDispatchContext: (...args: unknown[]) => resolveDispatchContext(...args),
  isSubscriptionValid: vi.fn(async () => true),
}))

let botPausedCheckSupabase: FakeSupabase
vi.mock('@/lib/supabase/dispatch-admin', () => ({
  createDispatchAdminClient: () => botPausedCheckSupabase,
}))

const runFlowsForInbound = vi.fn()
const runFlowsForInboundComment = vi.fn()
const continueRunFromPostback = vi.fn()
const tryContinueRunFromTextCapture = vi.fn()
const startRunFromGrowthLink = vi.fn()
vi.mock('@/lib/flows/engine', () => ({
  runFlowsForInbound: (...args: unknown[]) => runFlowsForInbound(...args),
  runFlowsForInboundComment: (...args: unknown[]) => runFlowsForInboundComment(...args),
  continueRunFromPostback: (...args: unknown[]) => continueRunFromPostback(...args),
  tryContinueRunFromTextCapture: (...args: unknown[]) => tryContinueRunFromTextCapture(...args),
  startRunFromGrowthLink: (...args: unknown[]) => startRunFromGrowthLink(...args),
}))

const handleEcommerceMessage = vi.fn()
const handleQaMessage = vi.fn()
vi.mock('@/lib/agent/ecommerce/handler', () => ({
  handleEcommerceMessage: (...args: unknown[]) => handleEcommerceMessage(...args),
  handleQaMessage: (...args: unknown[]) => handleQaMessage(...args),
}))

const handleAgentMessage = vi.fn()
vi.mock('@/lib/agent/router', () => ({
  handleAgentMessage: (...args: unknown[]) => handleAgentMessage(...args),
}))

const handleAvailabilityMessage = vi.fn()
vi.mock('@/lib/agent/ecommerce/availability', () => ({
  handleAvailabilityMessage: (...args: unknown[]) => handleAvailabilityMessage(...args),
}))

vi.mock('@/lib/agent/history', () => ({
  loadHistory: vi.fn(async () => []),
  renderHistoryBlock: vi.fn(() => ''),
}))

const upsertContact = vi.fn(async () => 'contact-1')
const getContact = vi.fn(async () => null)
vi.mock('@/lib/contacts/service', () => ({
  upsertContact: () => upsertContact(),
  getContact: () => getContact(),
}))

const checkAutoReplyLimit = vi.fn(async () => true)
vi.mock('@/lib/plans/restrictions', () => ({
  checkAutoReplyLimit: () => checkAutoReplyLimit(),
}))

vi.mock('@/lib/agent/telemetry', () => ({ logTurn: vi.fn() }))

const transcribeInbound = vi.fn()
vi.mock('@/lib/agent/voice', () => ({
  transcribeInbound: (...args: unknown[]) => transcribeInbound(...args),
}))

const downloadAudio = vi.fn(async () => Buffer.from('fake-audio'))
vi.mock('@/lib/meta/voice', () => ({
  downloadAudio: () => downloadAudio(),
}))

// Imported AFTER the mocks above are registered, per vitest's hoisting contract.
const { dispatchInboundMessage } = await import('@/lib/channels/shared/inbound')

function makeChannel(): AgentChannel & { sendTextMock: ReturnType<typeof vi.fn> } {
  const sendTextMock = vi.fn(async () => ({ messageId: 'sent-1' }))
  return { sendTextMock, sendText: sendTextMock, sendTyping: vi.fn(async () => {}) }
}

const baseMsg: NormalizedInboundMessage = {
  platform: 'instagram',
  channelExternalId: '17841400000000000',
  senderId: 'sender-1',
  recipientId: 'page-recipient', // deliberately different from senderId — dispatchInboundMessage no-ops on echo events otherwise
  messageId: 'mid-1',
  text: 'bonjour',
  timestamp: Date.now(),
}

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    supabase: makeFakeSupabase(),
    account: { id: 'acct-1', user_id: 'user-1', access_token: 'tok', platform: 'instagram', page_id: baseMsg.channelExternalId, phone_number_id: null, is_active: true },
    adapter: { sendButtons: vi.fn(), sendCard: vi.fn(), sendTypingIndicator: vi.fn() },
    ref: { id: 'acct-1', externalId: baseMsg.channelExternalId, accessToken: 'tok' },
    channel: makeChannel(),
    settings: {},
    aiApiKey: null,
    businessType: 'ecommerce',
    botPaused: false,
    contactId: 'contact-1',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  upsertContact.mockResolvedValue('contact-1')
  getContact.mockResolvedValue(null)
  checkAutoReplyLimit.mockResolvedValue(true)
  botPausedCheckSupabase = makeFakeSupabase({ contacts: [{ data: null, error: null }] })
})

describe('dispatchInboundMessage — bot_paused (human handling the conversation)', () => {
  test('logs the message but never resolves a dispatch context or runs any automation', async () => {
    findChannelAccountByExternalId.mockResolvedValue({ id: 'acct-1', user_id: 'user-1', access_token: 'tok' })
    botPausedCheckSupabase = makeFakeSupabase({ contacts: [{ data: { id: 'contact-1', bot_paused: true }, error: null }] })

    await dispatchInboundMessage(baseMsg)

    expect(resolveDispatchContext).not.toHaveBeenCalled()
    expect(runFlowsForInbound).not.toHaveBeenCalled()
    expect(handleQaMessage).not.toHaveBeenCalled()
    const logged = botPausedCheckSupabase._inserted.message_logs?.[0] as { message_text: string } | undefined
    expect(logged?.message_text).toBe('bonjour')
  })
})

describe('dispatchInboundMessage — flows take priority over the Q&A/tunnel agent', () => {
  test('a matched flow answers the turn; the smart agents are never invoked', async () => {
    const ctx = makeCtx({ settings: { flows_enabled: true, is_qa_active: true } })
    resolveDispatchContext.mockResolvedValue(ctx)
    tryContinueRunFromTextCapture.mockResolvedValue(false)
    runFlowsForInbound.mockResolvedValue(true)

    await dispatchInboundMessage(baseMsg)

    expect(runFlowsForInbound).toHaveBeenCalledTimes(1)
    expect(handleQaMessage).not.toHaveBeenCalled()
    expect(handleEcommerceMessage).not.toHaveBeenCalled()

    const logged = ctx.supabase._updated.message_logs?.[0] as { handled_by: string; reply_text: string } | undefined
    expect(logged).toMatchObject({ handled_by: 'flow', reply_text: '[Géré par Flow]' })
  })
})

describe('dispatchInboundMessage — a Q&A failure falls back to the default message instead of silence (audit finding F3)', () => {
  test('sends the configured default message when handleQaMessage reports an error outcome', async () => {
    const ctx = makeCtx({
      settings: { is_qa_active: true, is_order_taking_active: false, flows_enabled: false, default_message_enabled: true },
    })
    ctx.supabase = makeFakeSupabase({
      order_sessions: [{ data: null, error: null }],
    })
    ctx.supabase._bareOverrides.products = [{ data: [], error: null }]
    ctx.supabase._bareOverrides.automation_rules = [{ data: [], error: null }]
    resolveDispatchContext.mockResolvedValue(ctx)
    tryContinueRunFromTextCapture.mockResolvedValue(false)
    handleQaMessage.mockResolvedValue({
      hasPurchaseIntent: false,
      productNameHint: null,
      outcome: { status: 'error', error: new Error('llm down'), route: 'ecommerce.qa' },
    })

    await dispatchInboundMessage(baseMsg)

    expect(ctx.channel.sendTextMock).toHaveBeenCalledWith('Merci pour votre message ! Nous vous répondrons bientôt. 🙏')
    const logged = ctx.supabase._updated.message_logs?.at(-1) as { handled_by: string; reply_text: string } | undefined
    expect(logged).toMatchObject({ handled_by: 'rules.default_message', reply_text: 'Merci pour votre message ! Nous vous répondrons bientôt. 🙏' })
  })
})

describe('dispatchInboundMessage — voice reaches the exact same routing as text (audit finding F8)', () => {
  test('a transcribed voice note runs through flows just like a typed message would', async () => {
    const ctx = makeCtx({ settings: { flows_enabled: true } })
    resolveDispatchContext.mockResolvedValue(ctx)
    transcribeInbound.mockResolvedValue('je veux commander')
    runFlowsForInbound.mockResolvedValue(true)

    const voiceMsg: NormalizedInboundMessage = { ...baseMsg, text: undefined, audioUrl: 'https://lookaside.example/audio.m4a' }
    await dispatchInboundMessage(voiceMsg)

    expect(runFlowsForInbound).toHaveBeenCalledTimes(1)
    const flowsCallArg = runFlowsForInbound.mock.calls[0][0] as { messageText: string }
    expect(flowsCallArg.messageText).toBe('je veux commander')

    const logged = ctx.supabase._inserted.message_logs?.[0] as { message_text: string } | undefined
    expect(logged?.message_text).toBe('[🎙️ Vocal] : je veux commander')
  })
})

describe('dispatchInboundMessage — availability check (système de détection des intentions)', () => {
  test('feature off: an availability-shaped message never reaches the availability handler, Q&A answers it as before', async () => {
    const ctx = makeCtx({
      settings: { is_qa_active: true, is_availability_check_active: false, flows_enabled: false },
    })
    ctx.supabase = makeFakeSupabase({ order_sessions: [{ data: null, error: null }] })
    ctx.supabase._bareOverrides.products = [{ data: [], error: null }]
    resolveDispatchContext.mockResolvedValue(ctx)
    tryContinueRunFromTextCapture.mockResolvedValue(false)
    handleQaMessage.mockResolvedValue({
      hasPurchaseIntent: false,
      productNameHint: null,
      outcome: { status: 'replied', replyText: 'Réponse Q&A', route: 'ecommerce.qa' },
    })

    await dispatchInboundMessage({ ...baseMsg, text: 'dispo ?' })

    expect(handleAvailabilityMessage).not.toHaveBeenCalled()
    expect(handleQaMessage).toHaveBeenCalledTimes(1)
  })

  test('feature on: an availability question is answered by the availability handler before Q&A ever runs', async () => {
    const ctx = makeCtx({
      settings: { is_availability_check_active: true, is_qa_active: true, is_order_taking_active: false, flows_enabled: false },
    })
    ctx.supabase = makeFakeSupabase({ order_sessions: [{ data: null, error: null }] })
    resolveDispatchContext.mockResolvedValue(ctx)
    tryContinueRunFromTextCapture.mockResolvedValue(false)
    handleAvailabilityMessage.mockResolvedValue({
      outcome: { status: 'replied', replyText: 'Oui, disponible ✅', route: 'ecommerce.availability' },
      availableProductId: null,
    })

    await dispatchInboundMessage({ ...baseMsg, text: 'Il est disponible ?' })

    expect(handleAvailabilityMessage).toHaveBeenCalledTimes(1)
    expect(handleQaMessage).not.toHaveBeenCalled()
    const logged = ctx.supabase._updated.message_logs?.at(-1) as { handled_by: string; reply_text: string } | undefined
    expect(logged).toMatchObject({ handled_by: 'ecommerce.availability', reply_text: 'Oui, disponible ✅' })
  })

  test('an explicit purchase commitment on the same message chains availability into the order-taking tunnel (requirement §6)', async () => {
    const ctx = makeCtx({
      settings: { is_availability_check_active: true, is_order_taking_active: true, is_qa_active: false, flows_enabled: false },
    })
    ctx.supabase = makeFakeSupabase({ order_sessions: [{ data: null, error: null }] })
    resolveDispatchContext.mockResolvedValue(ctx)
    tryContinueRunFromTextCapture.mockResolvedValue(false)
    handleAvailabilityMessage.mockResolvedValue({
      outcome: { status: 'replied', replyText: 'Oui, disponible ✅', route: 'ecommerce.availability' },
      availableProductId: 'prod-1',
    })
    handleEcommerceMessage.mockResolvedValue({ status: 'replied', replyText: 'Quel est votre nom complet ?', route: 'ecommerce.tunnel' })

    await dispatchInboundMessage({ ...baseMsg, text: 'Il est dispo ? Si oui je le prends' })

    expect(handleAvailabilityMessage).toHaveBeenCalledTimes(1)
    expect(handleEcommerceMessage).toHaveBeenCalledTimes(1)
    expect(handleEcommerceMessage.mock.calls[0][0]).toMatchObject({ prefillProductId: 'prod-1', isAvailabilityActive: true })

    const logged = ctx.supabase._updated.message_logs?.at(-1) as { handled_by: string; reply_text: string } | undefined
    expect(logged).toMatchObject({ handled_by: 'ecommerce.tunnel', reply_text: 'Quel est votre nom complet ?' })
  })

  test('no purchase commitment does NOT chain into the tunnel, even when order-taking is active', async () => {
    const ctx = makeCtx({
      settings: { is_availability_check_active: true, is_order_taking_active: true, is_qa_active: false, flows_enabled: false },
    })
    ctx.supabase = makeFakeSupabase({ order_sessions: [{ data: null, error: null }] })
    resolveDispatchContext.mockResolvedValue(ctx)
    tryContinueRunFromTextCapture.mockResolvedValue(false)
    handleAvailabilityMessage.mockResolvedValue({
      outcome: { status: 'replied', replyText: 'Oui, disponible ✅', route: 'ecommerce.availability' },
      availableProductId: 'prod-1',
    })

    await dispatchInboundMessage({ ...baseMsg, text: 'Il est disponible ?' })

    expect(handleAvailabilityMessage).toHaveBeenCalledTimes(1)
    expect(handleEcommerceMessage).not.toHaveBeenCalled()
  })
})
