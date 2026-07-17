import type { Contact } from './contacts/types'

/**
 * Renders `{{variable}}` placeholders in a message using contact data.
 * Supported: {{nom}} (full name), {{prenom}} (first name), {{telephone}},
 * {{email}}, {{champ.KEY}} (custom_fields[KEY]). Unknown placeholders are
 * left as-is rather than silently blanked, so a typo is visible to the
 * person editing the flow/rule/campaign instead of vanishing in prod.
 * Falls back to the contact's @username when no name is set.
 */
export function renderTemplate(text: string, contact: Partial<Contact> | null | undefined): string {
  if (!text || !text.includes('{{')) return text

  const fullName = contact?.full_name?.trim() || ''
  const firstName = fullName ? fullName.split(/\s+/)[0] : ''
  const fallbackName = contact?.username ? `@${contact.username}` : ''

  const vars: Record<string, string> = {
    nom: fullName || fallbackName,
    prenom: firstName || fallbackName,
    telephone: contact?.phone || '',
    email: contact?.email || '',
  }

  return text.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key: string) => {
    if (key.startsWith('champ.')) {
      const fieldKey = key.slice('champ.'.length)
      const val = contact?.custom_fields?.[fieldKey]
      return val !== undefined && val !== null ? String(val) : ''
    }
    return key in vars ? vars[key] : match
  })
}
