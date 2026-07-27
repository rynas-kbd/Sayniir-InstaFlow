import { describe, expect, it } from 'vitest'
import { sanitizeForByteString } from '@/lib/encoding/sanitize'

describe('sanitizeForByteString', () => {
  it('replaces bullets, removes control characters, and trims line endings', () => {
    const raw = 'Hello • world\u0007\nThis is a test  '
    const result = sanitizeForByteString(raw)

    expect(result).toBe('Hello - world\nThis is a test')
  })

  it('normalizes unicode to NFC and preserves valid text', () => {
    const raw = 'e\u0301clair • \u2023 test'
    const result = sanitizeForByteString(raw)

    expect(result).toBe('éclair - - test')
  })
})
