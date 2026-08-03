import { describe, expect, test } from 'vitest'
import { renderConfirmPreview } from '@/lib/ai/tools/confirm-preview'

describe('renderConfirmPreview', () => {
  test('send_message_to_contact shows the actual recipient and message body', () => {
    const preview = renderConfirmPreview('send_message_to_contact', { contactId: 'c-1', text: 'Votre commande est prête !' })
    expect(preview).toContain('c-1')
    expect(preview).toContain('Votre commande est prête !')
  })

  test('delete_contact names the contact and flags irreversibility', () => {
    const preview = renderConfirmPreview('delete_contact', { contactId: 'c-42' })
    expect(preview).toContain('c-42')
    expect(preview.toLowerCase()).toContain('irréversible')
  })

  test('set_flow_status distinguishes activating a flow from other status changes', () => {
    const activating = renderConfirmPreview('set_flow_status', { flowId: 'f-1', status: 'active' })
    const pausing = renderConfirmPreview('set_flow_status', { flowId: 'f-1', status: 'paused' })
    expect(activating).toContain('immédiatement opérationnel')
    expect(pausing).not.toContain('immédiatement opérationnel')
  })

  test('falls back to a generic rendering for an unknown tool rather than throwing', () => {
    expect(() => renderConfirmPreview('some_future_tool', { foo: 'bar' })).not.toThrow()
    expect(renderConfirmPreview('some_future_tool', { foo: 'bar' })).toContain('some_future_tool')
  })

  test('never crashes on missing/undefined input', () => {
    expect(() => renderConfirmPreview('delete_contact', undefined)).not.toThrow()
  })
})
