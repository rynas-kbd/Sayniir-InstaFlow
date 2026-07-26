// lib/crypto.ts
// AES‑GCM (256‑bit) encryption utilities for API keys.
// The key is read from process.env.SETTINGS_ENCRYPTION_KEY as a 64‑char hex string.
// Output format: `${ivBase64}:${cipherBase64}` where iv is 12 bytes (96 bit).

/** Helper: convert a hex string (64 chars) to a Uint8Array of 32 bytes */
function hexToBytes(hex: string): Uint8Array {
  if (hex.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('SETTINGS_ENCRYPTION_KEY must be a 64‑character hex string (256‑bit)');
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/** Get the CryptoKey used for encryption/decryption */
async function getKey(): Promise<CryptoKey> {
  const hex = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error('Missing SETTINGS_ENCRYPTION_KEY environment variable');
  }
  const raw = hexToBytes(hex);
  return await crypto.subtle.importKey('raw', raw.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/** Base64 encode a Uint8Array */
function base64Encode(buf: Uint8Array): string {
  // Node environment – Buffer is available
  return Buffer.from(buf).toString('base64');
}
/** Base64 decode to Uint8Array */
function base64Decode(str: string): Uint8Array {
  return new Uint8Array(Buffer.from(str, 'base64'));
}

/**
 * Encrypt a plain API key.
 * Returns `${ivBase64}:${cipherBase64}`.
 */
export async function encryptApiKey(plain: string): Promise<string> {
  if (!plain) return '';
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96‑bit IV as recommended
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  // Cast to BufferSource for TypeScript compatibility
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data as unknown as BufferSource);
  const cipherArray = new Uint8Array(cipherBuffer);
  return `${base64Encode(iv)}:${base64Encode(cipherArray)}`;
}

/**
 * Decrypt a previously encrypted API key.
 */
export async function decryptApiKey(enc: string): Promise<string> {
  if (!enc) return '';
  const [ivB64, cipherB64] = enc.split(':');
  if (!ivB64 || !cipherB64) {
    throw new Error('Invalid encrypted value format');
  }
  const iv = base64Decode(ivB64);
  const cipher = base64Decode(cipherB64);
  const key = await getKey();
  const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as unknown as Uint8Array<ArrayBuffer> }, key, cipher.buffer as ArrayBuffer);
  const decoder = new TextDecoder();
  return decoder.decode(plainBuffer);
}

const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * Heuristic to decide if a stored value is already encrypted.
 *
 * Buffer.from(str, 'base64') never throws in Node — invalid characters are
 * silently dropped — so the previous version's try/catch around it was dead
 * code and this returned true for any string containing exactly one colon.
 * This checks the base64 charset explicitly and additionally verifies the
 * IV segment decodes to exactly 12 bytes (AES-GCM's fixed IV length here —
 * see encryptApiKey), which a plaintext value with a stray colon won't
 * coincidentally satisfy.
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(':');
  if (parts.length !== 2) return false;
  const [ivB64, cipherB64] = parts;
  if (!BASE64_RE.test(ivB64) || !BASE64_RE.test(cipherB64)) return false;
  if (ivB64.length % 4 !== 0 || cipherB64.length % 4 !== 0) return false;
  return base64Decode(ivB64).length === 12;
}
