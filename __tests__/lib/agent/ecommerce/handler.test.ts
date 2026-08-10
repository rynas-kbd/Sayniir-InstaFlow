import { describe, test, expect, vi, beforeEach } from 'vitest'
import type { AgentChannel } from '@/lib/agent/messaging'
import { getTemplate } from '@/lib/agent/ecommerce/templates'
import { getNextQuestion, type Product, type OrderSessionState } from '@/lib/agent/ecommerce/state'
import { makeFakeSupabase, type FakeSupabase } from '../../../helpers/fake-supabase'

/**
 * Regression coverage for handleEcommerceMessage's cross-cutting fixes from
 * the conversational audit (F6, F7, F10) — these are behaviors of the FULL
 * state machine (session lookups, DB writes, control flow) that the pure
 * unit tests on parse.ts/intent.ts/state.ts alone can't exercise, since
 * those only cover the deterministic helpers in isolation.
 */

const callAgentLLM = vi.fn()
vi.mock('@/lib/agent/engine', () => ({
  callAgentLLM: (...args: unknown[]) => callAgentLLM(...args),
}))

let fakeSupabase: FakeSupabase
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => fakeSupabase,
}))

// Imported AFTER the mocks above are registered, per vitest's hoisting contract.
const { handleEcommerceMessage } = await import('@/lib/agent/ecommerce/handler')

function makeChannel(): AgentChannel & { sendTextMock: ReturnType<typeof vi.fn> } {
  const sendTextMock = vi.fn(async () => ({ messageId: 'sent-1' }))
  return {
    sendTextMock,
    sendText: sendTextMock,
    sendCard: vi.fn(async () => ({ messageId: 'card-1' })),
    sendTyping: vi.fn(async () => {}),
  }
}

const shirt: Product = {
  id: 'prod-1',
  name: 'T-shirt Sasuke',
  price: 2500,
  currency: 'DZD',
  kind: 'physical',
  sizes: ['M', 'L'],
  colors: ['Noir'],
}

const t = getTemplate('fr')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleEcommerceMessage — greeting mid-flow does not cancel the session (audit finding F6)', () => {
  test('acknowledges the greeting and re-asks the exact field in progress, without touching order_sessions', async () => {
    const session: OrderSessionState & { id: string; status: string; awaiting_field: string | null; detected_language: string } = {
      id: 'sess-1',
      status: 'gathering_info',
      awaiting_field: 'nom complet',
      product_id: 'prod-1',
      selected_size: 'M',
      selected_color: 'Noir',
      customer_name: null,
      customer_phone: null,
      wilaya: null,
      delivery_mode: null,
      shipping_address: null,
      extra_data: {},
      detected_language: 'fr',
    }

    fakeSupabase = makeFakeSupabase({
      order_sessions: [{ data: session, error: null }],
    })
    // products is read via a bare await (no .maybeSingle()), so it resolves
    // through the chain's default `pending` value unless overridden here.
    fakeSupabase._bareOverrides.products = [{ data: [shirt], error: null }]

    const channel = makeChannel()
    const outcome = await handleEcommerceMessage({
      accountId: 'acct-1',
      senderId: 'sender-1',
      messageText: 'salam',
      channel,
      aiProvider: null,
      aiApiKey: null,
      aiModel: null,
    })

    // The core regression: before this fix, a greeting mid-checkout
    // cancelled order_sessions outright. Now nothing in order_sessions is
    // ever written for a greeting turn.
    expect(fakeSupabase._updated.order_sessions ?? []).toEqual([])
    expect(callAgentLLM).not.toHaveBeenCalled() // deterministic short-circuit, no LLM round-trip

    expect(outcome.status).toBe('replied')
    const nextQuestion = getNextQuestion('nom complet', session, [shirt], t, false)
    expect(outcome).toMatchObject({ status: 'replied', replyText: `${t.welcome}\n\n${nextQuestion.text}` })
    expect(channel.sendTextMock).toHaveBeenCalledTimes(1)
  })
})

describe('handleEcommerceMessage — a mid-flow question is answered, not stored as the slot value (audit finding F7)', () => {
  test('a question with no "?" and no greeting is routed to the LLM instead of overwriting "nom complet"', async () => {
    const session: OrderSessionState & { id: string; status: string; awaiting_field: string | null; detected_language: string } = {
      id: 'sess-1',
      status: 'gathering_info',
      awaiting_field: 'nom complet',
      product_id: 'prod-1',
      selected_size: 'M',
      selected_color: 'Noir',
      customer_name: null,
      customer_phone: null,
      wilaya: null,
      delivery_mode: null,
      shipping_address: null,
      extra_data: {},
      detected_language: 'fr',
    }

    fakeSupabase = makeFakeSupabase({
      order_sessions: [{ data: session, error: null }],
    })
    fakeSupabase._bareOverrides.products = [{ data: [shirt], error: null }]

    callAgentLLM.mockResolvedValue({
      extractedData: {},
      isQuestion: true,
      questionReply: 'La livraison coûte 500 DA.',
      detectedLanguage: 'fr',
    })

    const channel = makeChannel()
    const outcome = await handleEcommerceMessage({
      accountId: 'acct-1',
      senderId: 'sender-1',
      messageText: "c'est combien la livraison",
      channel,
      aiProvider: null,
      aiApiKey: null,
      aiModel: null,
    })

    expect(callAgentLLM).toHaveBeenCalledTimes(1) // deterministic parsing correctly refused this one

    const sessionUpdate = fakeSupabase._updated.order_sessions[0] as { customer_name: string | null; awaiting_field: string | null }
    // The actual F7 bug: this used to get silently stored as the name.
    expect(sessionUpdate.customer_name).toBeNull()
    expect(sessionUpdate.awaiting_field).toBe('nom complet') // still waiting on the same field

    expect(outcome.status).toBe('replied')
    if (outcome.status === 'replied') {
      expect(outcome.replyText).toContain('La livraison coûte 500 DA.')
      expect(outcome.replyText).toContain(t.askName)
    }
  })
})

describe('handleEcommerceMessage — confidence-based escalation to a human (Palier B)', () => {
  test('a second consecutive low-confidence answer hands off instead of guessing again, without touching order_sessions', async () => {
    const session: OrderSessionState & { id: string; status: string; awaiting_field: string | null; detected_language: string } = {
      id: 'sess-1',
      status: 'gathering_info',
      awaiting_field: 'nom complet',
      product_id: 'prod-1',
      selected_size: 'M',
      selected_color: 'Noir',
      customer_name: null,
      customer_phone: null,
      wilaya: null,
      delivery_mode: null,
      shipping_address: null,
      extra_data: {},
      detected_language: 'fr',
    }

    fakeSupabase = makeFakeSupabase({
      order_sessions: [{ data: session, error: null }],
      // Already at streak 1 — this turn is the second consecutive low-confidence one.
      contacts: [{ data: { low_confidence_streak: 1 }, error: null }],
    })
    fakeSupabase._bareOverrides.products = [{ data: [shirt], error: null }]

    callAgentLLM.mockResolvedValue({
      extractedData: {},
      isQuestion: true,
      questionReply: "Euh... je ne suis pas sûr de comprendre votre question.",
      detectedLanguage: 'fr',
      confidence: 0.2,
    })

    const channel = makeChannel()
    const outcome = await handleEcommerceMessage({
      accountId: 'acct-1',
      senderId: 'sender-1',
      messageText: 'vous faites la livraison internationale vers la lune ?',
      channel,
      aiProvider: null,
      aiApiKey: null,
      aiModel: null,
    })

    expect(outcome).toMatchObject({ status: 'replied', replyText: t.humanHandoff })
    expect(channel.sendTextMock).toHaveBeenCalledWith(t.humanHandoff, undefined)
    // The uncertain LLM answer itself is never sent to the customer.
    expect(channel.sendTextMock).not.toHaveBeenCalledWith(expect.stringContaining('pas sûr'), expect.anything())

    expect(fakeSupabase._updated.contacts).toContainEqual(
      expect.objectContaining({ bot_paused: true, low_confidence_streak: 0, bot_paused_at: expect.any(String) })
    )
    // Escalating short-circuits before any order_sessions write for this turn.
    expect(fakeSupabase._updated.order_sessions ?? []).toEqual([])
  })
})

describe('handleEcommerceMessage — the pre-confirmation stock re-check blocks overselling (audit finding F10)', () => {
  test('rejects confirmation when the atomic stock RPC reports insufficient stock, and never inserts an order', async () => {
    const session = {
      id: 'sess-2',
      status: 'gathering_info',
      awaiting_field: 'confirmation',
      product_id: 'prod-1',
      selected_size: 'M',
      selected_color: 'Noir',
      customer_name: 'Rynas Kebdi',
      customer_phone: '0794055836',
      wilaya: 'Béjaïa',
      delivery_mode: 'domicile',
      shipping_address: 'Akbou, rue des Frères',
      extra_data: {},
      detected_language: 'fr',
      quantity: 1,
      channel_account_id: 'acct-1',
      sender_id: 'sender-1',
    }
    const finalSessionWithProduct = {
      ...session,
      products: { name: shirt.name, price: shirt.price, kind: shirt.kind, currency: shirt.currency },
    }

    fakeSupabase = makeFakeSupabase({
      order_sessions: [
        { data: session, error: null }, // initial lookup
        { data: finalSessionWithProduct, error: null }, // post-confirmation join lookup
      ],
      contacts: [{ data: { id: 'contact-1' }, error: null }],
      product_variants: [{ data: { id: 'variant-1', price_override: null, stock_quantity: 0 }, error: null }],
    })
    fakeSupabase._bareOverrides.products = [{ data: [shirt], error: null }]
    // The atomic RPC is the actual guard under test: it reports the unit is gone.
    fakeSupabase._rpcResponses.decrement_variant_stock = [{ data: false, error: null }]

    const channel = makeChannel()
    const outcome = await handleEcommerceMessage({
      accountId: 'acct-1',
      senderId: 'sender-1',
      messageText: 'oui',
      channel,
      aiProvider: null,
      aiApiKey: null,
      aiModel: null,
    })

    expect(fakeSupabase.rpc).toHaveBeenCalledWith('decrement_variant_stock', { p_variant_id: 'variant-1', p_quantity: 1 })
    // The core regression: no order gets created for a unit stock says is gone.
    expect(fakeSupabase._inserted.orders ?? []).toEqual([])

    const lastSessionUpdate = fakeSupabase._updated.order_sessions.at(-1) as {
      status: string
      awaiting_field: string
      product_id: string | null
    }
    expect(lastSessionUpdate).toMatchObject({ status: 'gathering_info', awaiting_field: 'produit', product_id: null })

    expect(outcome.status).toBe('replied')
    if (outcome.status === 'replied') {
      expect(outcome.replyText).toBe(t.outOfStock(shirt.name))
    }
  })
})
