import { describe, test, expect } from 'vitest'
import { emptyForm, validateRuleForm, buildRulePayload } from '../../components/automation/rule-form/rule-form-schema'
import type { RuleFormState } from '../../components/automation/rule-form/types'
import type { Translator } from '../../lib/i18n/translate'

function form(overrides: Partial<RuleFormState> = {}): RuleFormState {
  return { ...emptyForm(undefined, 'dm', 'acct-1'), name: 'Bienvenue', response_text: 'Salut !', ...overrides }
}

// validateRuleForm only needs a Translator to resolve error message strings — tests only assert
// truthy/undefined, not exact copy, so a passthrough stub (returns the key path) is sufficient.
const t = ((path: string) => path) as Translator

describe('emptyForm', () => {
  test('defaults trigger_type by tab when there is no existing rule', () => {
    expect(emptyForm(undefined, 'dm', 'acct-1').trigger_type).toBe('any_message')
    expect(emptyForm(undefined, 'comment', 'acct-1').trigger_type).toBe('any_comment')
  })

  test('trigger_keywords/target_post_ids are real arrays, never comma-joined strings', () => {
    const f = emptyForm(
      {
        id: '1',
        channel_account_id: 'acct-1',
        name: 'x',
        trigger_type: 'keyword',
        trigger_keywords: ['bonjour', 'prix'],
        target_post_ids: ['p1', 'p2'],
        reply_method: 'comment',
        response_text: 'y',
        is_active: true,
      },
      'dm',
      'acct-1',
    )
    expect(f.trigger_keywords).toEqual(['bonjour', 'prix'])
    expect(f.target_post_ids).toEqual(['p1', 'p2'])
  })
})

describe('validateRuleForm', () => {
  test('requires an account and a name', () => {
    const errors = validateRuleForm(form({ channel_account_id: '', name: '  ' }), 'dm', t)
    expect(errors.channel_account_id).toBeTruthy()
    expect(errors.name).toBeTruthy()
  })

  test('trigger_keywords required only for keyword-based trigger types (kind-aware)', () => {
    expect(validateRuleForm(form({ trigger_type: 'any_message', trigger_keywords: [] }), 'dm', t).trigger_keywords).toBeUndefined()
    expect(validateRuleForm(form({ trigger_type: 'keyword', trigger_keywords: [] }), 'dm', t).trigger_keywords).toBeTruthy()
    expect(validateRuleForm(form({ trigger_type: 'keyword', trigger_keywords: ['hi'] }), 'dm', t).trigger_keywords).toBeUndefined()
  })

  test('response_text required for a pure DM rule, not required once switched to a card', () => {
    expect(validateRuleForm(form({ response_type: 'text', response_text: '' }), 'dm', t).response_text).toBeTruthy()
    expect(validateRuleForm(form({ response_type: 'card', response_text: '', card_title: 'T' }), 'dm', t).response_text).toBeUndefined()
  })

  test('comment tab: response_text is required across comment/dm/both — a rule always needs a message', () => {
    const commentForm = (overrides: Partial<RuleFormState> = {}) =>
      form({ trigger_type: 'any_comment', reply_method: 'comment', response_text: '', ...overrides })
    expect(validateRuleForm(commentForm(), 'comment', t).response_text).toBeTruthy()
    expect(validateRuleForm(commentForm({ reply_method: 'dm' }), 'comment', t).response_text).toBeTruthy()
    expect(validateRuleForm(commentForm({ reply_method: 'both' }), 'comment', t).response_text).toBeTruthy()
  })

  test('response_text_dm (the optional DM override) is never required, even in "both" mode', () => {
    const errors = validateRuleForm(
      form({ trigger_type: 'any_comment', reply_method: 'both', response_text: 'Merci !', response_text_dm: '' }),
      'comment',
      t,
    )
    expect(errors.response_text_dm).toBeUndefined()
  })

  test('card fields validated only when isCard (kind-aware)', () => {
    expect(validateRuleForm(form({ response_type: 'text', card_title: '' }), 'dm', t).card_title).toBeUndefined()
    expect(validateRuleForm(form({ response_type: 'card', card_title: '' }), 'dm', t).card_title).toBeTruthy()
  })

  test('card button needs a valid URL when type is web_url', () => {
    const errors = validateRuleForm(
      form({ response_type: 'card', card_title: 'T', card_buttons: [{ type: 'web_url', title: 'Go', url: 'not-a-url' }] }),
      'dm',
      t,
    )
    expect(errors.card_buttons).toBeTruthy()
  })
})

describe('buildRulePayload', () => {
  test('trigger_keywords is null (not []) when trigger_type does not use keywords', () => {
    const payload = buildRulePayload(form({ trigger_type: 'any_message', trigger_keywords: ['stale'] }), 'dm')
    expect(payload.trigger_keywords).toBeNull()
  })

  test('target_post_ids is null when empty, an array otherwise — never a comma string', () => {
    expect(buildRulePayload(form({ target_post_ids: [] }), 'dm').target_post_ids).toBeNull()
    expect(buildRulePayload(form({ target_post_ids: ['p1'] }), 'dm').target_post_ids).toEqual(['p1'])
  })

  test('a DM card rule falls back response_text to card_title (or name) for the notification text', () => {
    const payload = buildRulePayload(form({ response_type: 'card', card_title: 'Promo', response_text: '' }), 'dm')
    expect(payload.response_type).toBe('card')
    expect(payload.response_text).toBe('Promo')
  })

  test('payload key set matches the PATCH allowlist in app/api/rules/[id]/route.ts', () => {
    const payload = buildRulePayload(form(), 'dm')
    const patchAllowlist = [
      'name',
      'trigger_type',
      'trigger_keywords',
      'response_text',
      'target_post_ids',
      'reply_method',
      'response_text_dm',
      'response_type',
      'card_title',
      'card_subtitle',
      'card_image_url',
      'card_buttons',
    ]
    for (const key of patchAllowlist) {
      expect(payload).toHaveProperty(key)
    }
  })
})
