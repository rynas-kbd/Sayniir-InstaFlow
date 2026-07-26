import { describe, test, expect } from 'vitest'
import { checkContactsUntagged } from '../../../../lib/ai/lint/rules/contacts-untagged'

describe('checkContactsUntagged', () => {
  test('flags when fewer than 50% of a large contact base is tagged', () => {
    const findings = checkContactsUntagged({ id: 'a1' }, 100, 20)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ ruleId: 'contacts/untagged', subjectId: 'a1', severity: 'info' })
  })

  test('returns no findings when tagged ratio is at or above 50%', () => {
    expect(checkContactsUntagged({ id: 'a1' }, 100, 50)).toEqual([])
  })

  test('returns no findings when the contact base is small', () => {
    expect(checkContactsUntagged({ id: 'a1' }, 20, 0)).toEqual([])
  })
})
