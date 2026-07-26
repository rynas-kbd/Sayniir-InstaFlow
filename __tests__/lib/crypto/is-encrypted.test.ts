import { describe, it, expect, beforeAll } from 'vitest'
import { isEncrypted, encryptApiKey, decryptApiKey } from '@/lib/crypto'

// AES-256-GCM requires a real 64-hex-char key — generate one for the test run.
beforeAll(() => {
  process.env.SETTINGS_ENCRYPTION_KEY = '0'.repeat(63) + '1'
})

describe('isEncrypted', () => {
  it('rejects a plaintext value with a single colon (the old heuristic\'s false positive)', () => {
    expect(isEncrypted('a:b')).toBe(false)
  })

  it('rejects an arbitrary string with no colon', () => {
    expect(isEncrypted('IGQVJarbitrarytoken')).toBe(false)
  })

  it('rejects an empty string', () => {
    expect(isEncrypted('')).toBe(false)
  })

  it('rejects a value with more than one colon', () => {
    expect(isEncrypted('a:b:c')).toBe(false)
  })

  it('recognizes a real encrypted value round-tripped through encryptApiKey', async () => {
    const encrypted = await encryptApiKey('super-secret-token')
    expect(isEncrypted(encrypted)).toBe(true)
    expect(await decryptApiKey(encrypted)).toBe('super-secret-token')
  })

  it('rejects a value whose IV segment is valid base64 but not 12 bytes', () => {
    // "QUFBQQ==" decodes to 4 bytes ("AAAA"), not the required 12-byte IV.
    expect(isEncrypted('QUFBQQ==:U29tZUNpcGhlcnRleHQ=')).toBe(false)
  })
})
