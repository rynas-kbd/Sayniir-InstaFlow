/**
 * Escapes a value for safe inclusion in a CSV cell.
 *
 * Two layers:
 * 1. Formula-injection guard — a value starting with =, +, -, @, TAB, or CR
 *    is interpreted as a formula by Excel/LibreOffice/Sheets when the file
 *    is opened. Prefixing with a single quote forces it to render as text.
 *    Without this, an attacker-controlled field (e.g. a contact's display
 *    name synced from an inbound message) can execute code on the merchant's
 *    machine the moment they open an exported CSV.
 * 2. RFC-4180 quoting for values containing a comma, quote, or newline.
 */
export function csvEscape(value: string): string {
  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  if (/[",\n\r]/.test(guarded)) return `"${guarded.replace(/"/g, '""')}"`
  return guarded
}
