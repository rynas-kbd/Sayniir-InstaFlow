import { encryptApiKey, decryptApiKey, isEncrypted } from '../../crypto.ts'

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

/**
 * channel_accounts.webhook_app_secret — the Meta App Secret for a manually
 * admin-connected WhatsApp account (their own Meta app). NULL for accounts
 * connected via the shared self-serve Embedded Signup app; same
 * encrypt-at-rest treatment as access_token, symmetric helper naming.
 */
export async function resolveWebhookSecret(storedValue: string | null): Promise<string | null> {
  if (!storedValue) return storedValue
  return isEncrypted(storedValue) ? decryptApiKey(storedValue) : storedValue
}

/** Always encrypt before writing a secret to channel_accounts.webhook_app_secret. */
export async function sealWebhookSecret(plainSecret: string): Promise<string> {
  return encryptApiKey(plainSecret)
}
