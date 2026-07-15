#!/usr/bin/env node
/**
 * One-off migration: encrypt any plaintext channel_accounts.access_token
 * rows (AES-GCM, same scheme as lib/crypto.ts) after the Phase 0
 * channel_generalization migration renames instagram_accounts ->
 * channel_accounts. Safe to re-run — rows already encrypted are skipped.
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 * SETTINGS_ENCRYPTION_KEY (64-char hex — same key used for AI provider keys).
 *
 * Usage: node --env-file=.env.local scripts/encrypt-channel-tokens.mjs
 */
import { createClient } from '@supabase/supabase-js'

function hexToBytes(hex) {
  if (hex.length !== 64) {
    throw new Error('SETTINGS_ENCRYPTION_KEY must be a 64-character hex string (256-bit)')
  }
  const bytes = new Uint8Array(32)
  for (let i = 0; i < 32; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  return bytes
}

async function getKey() {
  const hex = process.env.SETTINGS_ENCRYPTION_KEY
  if (!hex) throw new Error('Missing SETTINGS_ENCRYPTION_KEY environment variable')
  return crypto.subtle.importKey('raw', hexToBytes(hex), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

async function encryptApiKey(plain) {
  if (!plain) return ''
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = new TextEncoder().encode(plain)
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
  return `${Buffer.from(iv).toString('base64')}:${Buffer.from(cipherBuffer).toString('base64')}`
}

function isEncrypted(value) {
  if (!value) return false
  const parts = value.split(':')
  if (parts.length !== 2) return false
  try {
    Buffer.from(parts[0], 'base64')
    Buffer.from(parts[1], 'base64')
    return true
  } catch {
    return false
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: accounts, error } = await supabase
    .from('channel_accounts')
    .select('id, access_token')

  if (error) throw error

  let encrypted = 0
  let skipped = 0

  for (const account of accounts ?? []) {
    if (!account.access_token || isEncrypted(account.access_token)) {
      skipped++
      continue
    }

    const sealed = await encryptApiKey(account.access_token)
    const { error: updateError } = await supabase
      .from('channel_accounts')
      .update({ access_token: sealed })
      .eq('id', account.id)

    if (updateError) {
      console.error(`[encrypt-channel-tokens] Failed to update account ${account.id}:`, updateError.message)
      continue
    }
    encrypted++
  }

  console.log(`[encrypt-channel-tokens] Done. Encrypted: ${encrypted}, already encrypted (skipped): ${skipped}, total: ${accounts?.length ?? 0}`)
}

main().catch((err) => {
  console.error('[encrypt-channel-tokens] Fatal error:', err)
  process.exit(1)
})
