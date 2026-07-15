import { encryptApiKey, decryptApiKey, isEncrypted } from '../../crypto'

/**
 * channel_accounts.access_token is stored AES-GCM encrypted going forward.
 * Legacy rows written before this migration are still plaintext — decrypt
 * only recognizes and unwraps encrypted values, so reads stay backward
 * compatible until every row has been re-encrypted (see
 * scripts/encrypt-channel-tokens.ts).
 */
export async function resolveAccessToken(storedValue: string): Promise<string> {
  if (!storedValue) return storedValue
  return isEncrypted(storedValue) ? decryptApiKey(storedValue) : storedValue
}

/** Always encrypt before writing a token to channel_accounts.access_token. */
export async function sealAccessToken(plainToken: string): Promise<string> {
  return encryptApiKey(plainToken)
}
