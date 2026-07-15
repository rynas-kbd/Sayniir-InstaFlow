import { encodeBase64, decodeBase64 } from 'jsr:@std/encoding/base64'

function hexToBytes(hex: string): Uint8Array {
  if (hex.length !== 64) {
    throw new Error('SETTINGS_ENCRYPTION_KEY must be a 64‑character hex string (256‑bit)');
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function getKey(): Promise<CryptoKey> {
  const hex = Deno.env.get('SETTINGS_ENCRYPTION_KEY');
  if (!hex) {
    throw new Error('Missing SETTINGS_ENCRYPTION_KEY environment variable');
  }
  const raw = hexToBytes(hex);
  return await crypto.subtle.importKey(
    'raw', 
    raw.buffer as ArrayBuffer, 
    { name: 'AES-GCM' }, 
    false, 
    ['encrypt', 'decrypt']
  );
}

export async function encryptApiKey(plain: string): Promise<string> {
  if (!plain) return '';
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, 
    key, 
    data
  );
  const cipherArray = new Uint8Array(cipherBuffer);
  return `${encodeBase64(iv)}:${encodeBase64(cipherArray)}`;
}

export async function decryptApiKey(enc: string): Promise<string> {
  if (!enc) return '';
  const [ivB64, cipherB64] = enc.split(':');
  if (!ivB64 || !cipherB64) {
    throw new Error('Invalid encrypted value format');
  }
  const iv = decodeBase64(ivB64);
  const cipher = decodeBase64(cipherB64);
  const key = await getKey();
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv }, 
    key, 
    cipher
  );
  const decoder = new TextDecoder();
  return decoder.decode(plainBuffer);
}

export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(':');
  if (parts.length !== 2) return false;
  try {
    decodeBase64(parts[0]);
    decodeBase64(parts[1]);
    return true;
  } catch {
    return false;
  }
}
