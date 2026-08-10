import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ChannelAdapter, NormalizedInboundMessage } from '@/lib/channels/types'

// handleWebhookRequest resolves the account BEFORE locking the conversation
// (see lib/channels/shared/handle-webhook.ts) — the regression this file
// exists to pin down (audit finding F1) is that it must pass the resolved
// account's UUID to tryLockConversation/unlockConversation, never Meta's
// page_id/phone_number_id (msg.channelExternalId), which is not a UUID and
// made every lock attempt fail silently, dropping the message.
const findChannelAccountByExternalId = vi.fn()
vi.mock('@/lib/channels/shared/lookup', () => ({
  findChannelAccountByExternalId: (...args: unknown[]) => findChannelAccountByExternalId(...args),
}))

const claimInboundEvent = vi.fn()
const markEventDone = vi.fn()
const markEventFailed = vi.fn()
const tryLockConversation = vi.fn()
const unlockConversation = vi.fn()
vi.mock('@/lib/channels/shared/inbound-queue', () => ({
  claimInboundEvent: (...args: unknown[]) => claimInboundEvent(...args),
  markEventDone: (...args: unknown[]) => markEventDone(...args),
  markEventFailed: (...args: unknown[]) => markEventFailed(...args),
  tryLockConversation: (...args: unknown[]) => tryLockConversation(...args),
  unlockConversation: (...args: unknown[]) => unlockConversation(...args),
}))

const dispatchInboundMessage = vi.fn()
const dispatchInboundComment = vi.fn()
vi.mock('@/lib/channels/shared/inbound', () => ({
  dispatchInboundMessage: (...args: unknown[]) => dispatchInboundMessage(...args),
  dispatchInboundComment: (...args: unknown[]) => dispatchInboundComment(...args),
}))

function makeAdapter(overrides: Partial<ChannelAdapter> = {}): ChannelAdapter {
  return {
    platform: 'instagram',
    getLoginUrl: () => '',
    exchangeToken: async () => ({ accessToken: '' }),
    getAccountInfo: async () => ({ externalId: '', displayName: '' }),
    subscribeToWebhooks: async () => {},
    verifyWebhookSignature: () => true,
    parseWebhookMessages: () => [],
    parseWebhookComments: () => [],
    sendMessage: async () => null,
    ...overrides,
  }
}

let adapter: ChannelAdapter
vi.mock('@/lib/channels/registry', () => ({
  getAdapter: () => adapter,
}))

// Imported AFTER the mocks above are registered, per vitest's hoisting contract.
const { handleWebhookRequest } = await import('@/lib/channels/shared/handle-webhook')

const ORIGINAL_ENV = { ...process.env }

function postRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://example.com/api/webhooks/instagram', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

const testMessage: NormalizedInboundMessage = {
  platform: 'instagram',
  channelExternalId: '17841400000000000', // Meta page id — NOT a UUID
  senderId: 'sender-1',
  recipientId: 'recipient-1',
  messageId: 'mid-1',
  text: 'bonjour',
  timestamp: Date.now(),
}

describe('handleWebhookRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.META_INSTAGRAM_APP_SECRET = 'app-secret'
    adapter = makeAdapter()
    claimInboundEvent.mockResolvedValue(true)
    tryLockConversation.mockResolvedValue(true)
    findChannelAccountByExternalId.mockResolvedValue({
      id: 'a1b2c3d4-0000-0000-0000-000000000001', // a real UUID
      user_id: 'user-1',
      platform: 'instagram',
      page_id: testMessage.channelExternalId,
      phone_number_id: null,
      access_token: 'decrypted-token',
      is_active: true,
    })
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  test('locks the conversation with the resolved account UUID, never the raw channelExternalId (regression for F1)', async () => {
    adapter.parseWebhookMessages = () => [testMessage]
    const waited: Promise<unknown>[] = []

    const res = await handleWebhookRequest('instagram', postRequest({}), (p) => waited.push(p))
    expect(res.status).toBe(200)
    await Promise.all(waited)

    expect(tryLockConversation).toHaveBeenCalledTimes(1)
    const [lockAccountId] = tryLockConversation.mock.calls[0]
    expect(lockAccountId).toBe('a1b2c3d4-0000-0000-0000-000000000001')
    expect(lockAccountId).not.toBe(testMessage.channelExternalId)

    expect(unlockConversation).toHaveBeenCalledWith('a1b2c3d4-0000-0000-0000-000000000001', testMessage.senderId)
    expect(dispatchInboundMessage).toHaveBeenCalledWith(testMessage)
    expect(markEventDone).toHaveBeenCalledWith(testMessage.messageId)
  })

  test('drops the message (marked done, never dispatched) when no active account matches the external id', async () => {
    adapter.parseWebhookMessages = () => [testMessage]
    findChannelAccountByExternalId.mockResolvedValue(null)
    const waited: Promise<unknown>[] = []

    await handleWebhookRequest('instagram', postRequest({}), (p) => waited.push(p))
    await Promise.all(waited)

    expect(tryLockConversation).not.toHaveBeenCalled()
    expect(dispatchInboundMessage).not.toHaveBeenCalled()
    expect(markEventDone).toHaveBeenCalledWith(testMessage.messageId)
  })

  test('a redelivered message (duplicate mid) is claimed once and dispatched once', async () => {
    adapter.parseWebhookMessages = () => [testMessage]
    claimInboundEvent.mockResolvedValueOnce(true) // first delivery
    const waited: Promise<unknown>[] = []
    await handleWebhookRequest('instagram', postRequest({}), (p) => waited.push(p))
    await Promise.all(waited)
    expect(dispatchInboundMessage).toHaveBeenCalledTimes(1)

    claimInboundEvent.mockResolvedValueOnce(false) // Meta redelivery of the same mid
    const waited2: Promise<unknown>[] = []
    await handleWebhookRequest('instagram', postRequest({}), (p) => waited2.push(p))
    await Promise.all(waited2)
    expect(dispatchInboundMessage).toHaveBeenCalledTimes(1) // still just once
  })

  test('a failed dispatch marks the event failed and still unlocks the conversation', async () => {
    adapter.parseWebhookMessages = () => [testMessage]
    dispatchInboundMessage.mockRejectedValue(new Error('boom'))
    const waited: Promise<unknown>[] = []

    await handleWebhookRequest('instagram', postRequest({}), (p) => waited.push(p))
    await Promise.all(waited)

    expect(markEventFailed).toHaveBeenCalledWith(testMessage.messageId, expect.any(Error))
    expect(unlockConversation).toHaveBeenCalledWith('a1b2c3d4-0000-0000-0000-000000000001', testMessage.senderId)
  })

  test('returns 503 without touching the adapter when the app secret is not configured', async () => {
    delete process.env.META_INSTAGRAM_APP_SECRET
    const res = await handleWebhookRequest('instagram', postRequest({}), () => {})
    expect(res.status).toBe(503)
    expect(dispatchInboundMessage).not.toHaveBeenCalled()
  })

  test('returns 401 when the adapter rejects the signature', async () => {
    adapter.verifyWebhookSignature = () => false
    const res = await handleWebhookRequest('instagram', postRequest({}), () => {})
    expect(res.status).toBe(401)
  })

  test('returns 400 on an unparsable body', async () => {
    const res = await handleWebhookRequest(
      'instagram',
      new Request('https://example.com', { method: 'POST', body: 'not json' }),
      () => {}
    )
    expect(res.status).toBe(400)
  })

  test('GET verification challenge: 200 with the challenge when the token matches', async () => {
    process.env.META_WEBHOOK_VERIFY_TOKEN = 'verify-me'
    const url = 'https://example.com/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=echo-123'
    const res = await handleWebhookRequest('instagram', new Request(url), () => {})
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('echo-123')
  })

  test('GET verification challenge: 403 when the token does not match', async () => {
    process.env.META_WEBHOOK_VERIFY_TOKEN = 'verify-me'
    const url = 'https://example.com/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=echo-123'
    const res = await handleWebhookRequest('instagram', new Request(url), () => {})
    expect(res.status).toBe(403)
  })
})
