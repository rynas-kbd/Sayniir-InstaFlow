import { describe, test, expect } from 'vitest'
import { emptyForm, validateCampaignForm, buildCampaignPayload } from '../../components/campaigns/campaign-form/campaign-form-schema'
import type { CampaignFormState } from '../../components/campaigns/campaign-form/types'

function form(overrides: Partial<CampaignFormState> = {}): CampaignFormState {
  return { ...emptyForm(), name: 'Promo', message: 'Bonjour !', ...overrides }
}

describe('emptyForm', () => {
  test('derives audience_mode from a saved campaign: segment takes priority over tags', () => {
    const f = emptyForm({
      id: '1',
      name: 'x',
      message_template: 'y',
      audience_tag_ids: ['t1'],
      segment_id: 'seg1',
      status: 'draft',
      scheduled_at: null,
      created_at: '',
    })
    expect(f.audience_mode).toBe('segment')
  })

  test('falls back to "all" when neither tags nor segment are set', () => {
    expect(emptyForm().audience_mode).toBe('all')
  })

  test('schedule_mode reflects presence of scheduled_at, rendered in local time', () => {
    expect(emptyForm().schedule_mode).toBe('now')
    const iso = '2026-08-01T10:00:00.000Z'
    const f = emptyForm({
      id: '1',
      name: 'x',
      message_template: 'y',
      audience_tag_ids: [],
      status: 'scheduled',
      scheduled_at: iso,
      created_at: '',
    })
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    const expected = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    expect(f.schedule_mode).toBe('later')
    expect(f.scheduled_at).toBe(expected)
  })
})

describe('validateCampaignForm', () => {
  test('requires name and message', () => {
    const errors = validateCampaignForm(form({ name: '  ', message: '' }))
    expect(errors.name).toBeTruthy()
    expect(errors.message).toBeTruthy()
  })

  test('card fields are only validated when response_type is card', () => {
    expect(validateCampaignForm(form({ response_type: 'text', card_title: '' })).card_title).toBeUndefined()
    expect(validateCampaignForm(form({ response_type: 'card', card_title: '' })).card_title).toBeTruthy()
  })

  test('card image URL must be http(s) when non-empty', () => {
    expect(
      validateCampaignForm(form({ response_type: 'card', card_title: 'T', card_image_url: 'not-a-url' })).card_image_url,
    ).toBeTruthy()
    expect(
      validateCampaignForm(form({ response_type: 'card', card_title: 'T', card_image_url: 'https://x.test/i.png' })).card_image_url,
    ).toBeUndefined()
  })

  test('card buttons need a title, and a valid URL when type is web_url', () => {
    const errors = validateCampaignForm(
      form({ response_type: 'card', card_title: 'T', card_buttons: [{ type: 'web_url', title: 'Go', url: 'not-a-url' }] }),
    )
    expect(errors.card_buttons).toBeTruthy()
  })

  test('switching back to text drops any stale card error (kind-aware)', () => {
    const cardErrors = validateCampaignForm(form({ response_type: 'card', card_title: '' }))
    expect(cardErrors.card_title).toBeTruthy()
    const textErrors = validateCampaignForm(form({ response_type: 'text', card_title: '' }))
    expect(textErrors.card_title).toBeUndefined()
  })

  test('scheduled_at required and must be in the future only when schedule_mode is later', () => {
    expect(validateCampaignForm(form({ schedule_mode: 'now', scheduled_at: '' })).scheduled_at).toBeUndefined()
    expect(validateCampaignForm(form({ schedule_mode: 'later', scheduled_at: '' })).scheduled_at).toBeTruthy()
    expect(validateCampaignForm(form({ schedule_mode: 'later', scheduled_at: '2020-01-01T00:00' })).scheduled_at).toBeTruthy()
    const future = new Date(Date.now() + 86400000).toISOString().slice(0, 16)
    expect(validateCampaignForm(form({ schedule_mode: 'later', scheduled_at: future })).scheduled_at).toBeUndefined()
  })
})

describe('buildCampaignPayload', () => {
  test('never sends non-empty audience_tag_ids alongside a segment_id', () => {
    const payload = buildCampaignPayload(form({ audience_mode: 'segment', segment_id: 'seg1', tag_ids: ['t1', 't2'] }), 'acct-1')
    expect(payload.audience_tag_ids).toEqual([])
    expect(payload.segment_id).toBe('seg1')
  })

  test('tags mode sends tag_ids and null segment_id', () => {
    const payload = buildCampaignPayload(form({ audience_mode: 'tags', tag_ids: ['t1'], segment_id: 'seg1' }), 'acct-1')
    expect(payload.audience_tag_ids).toEqual(['t1'])
    expect(payload.segment_id).toBeNull()
  })

  test('card fields are cleared when response_type is text, even if stale state lingers', () => {
    const payload = buildCampaignPayload(form({ response_type: 'text', card_title: 'stale', card_buttons: [{ type: 'web_url', title: 'x', url: 'https://x.test' }] }), 'acct-1')
    expect(payload.card_title).toBe('')
    expect(payload.card_buttons).toEqual([])
  })

  test('later schedule converts the datetime-local value to ISO', () => {
    const payload = buildCampaignPayload(form({ schedule_mode: 'later', scheduled_at: '2026-08-01T10:00' }), 'acct-1')
    expect(payload.scheduled_at).toBe(new Date('2026-08-01T10:00').toISOString())
  })

  test('now schedule sends null scheduled_at', () => {
    const payload = buildCampaignPayload(form({ schedule_mode: 'now', scheduled_at: '2026-08-01T10:00' }), 'acct-1')
    expect(payload.scheduled_at).toBeNull()
  })
})
