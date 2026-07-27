// Utilities for sanitizing strings before converting to byte sequences or sending to external APIs.

export function sanitizeForByteString(input: string): string {
  if (!input) return input
  // Normalize unicode (NFC)
  try {
    input = input.normalize('NFC')
  } catch (err) {
    // ignore if normalize not supported
  }

  // Replace common problematic characters with safe ASCII equivalents
  // Replace bullet U+2022 and other bullets with '-'
  input = input.replace(/[\u2022\u2023\u25E6\u2043]/g, '-')

  // Remove control characters except newline, carriage return, tab
  input = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Trim trailing/leading whitespace on each line
  input = input.split('\n').map(line => line.trimEnd()).join('\n')

  return input
}

export function toUtf8Uint8Array(input: string): Uint8Array {
  const encoder = new TextEncoder()
  return encoder.encode(sanitizeForByteString(input))
}

export function toBase64(input: string): string {
  // Node/browser-safe base64 via Buffer when available
  try {
    // @ts-ignore
    if (typeof Buffer !== 'undefined') return Buffer.from(sanitizeForByteString(input), 'utf8').toString('base64')
  } catch (err) {
    // fall through
  }
  // Fallback: browser btoa on utf-8 (approx)
  const u8 = toUtf8Uint8Array(input)
  let binary = ''
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i])
  // @ts-ignore
  return typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64')
}
