/**
 * Renders what used to be a Meta "card" (generic template: title, subtitle,
 * image attachment, buttons) as plain text instead. Used everywhere a
 * card-style send was replaced with a text send carrying the image URL as a
 * plain link — see lib/agent/ecommerce/handler.ts, lib/campaigns/service.ts,
 * lib/flows/nodes.ts. Image links render as native link previews on every
 * channel, unlike generic templates which Instagram silently drops
 * (lib/meta/messaging.ts) and WhatsApp never supported at all.
 *
 * Not used by lib/channels/shared/inbound.ts's classic automation rules —
 * those still send real card attachments on purpose.
 */
export interface CardTextInput {
  title?: string | null
  subtitle?: string | null
  imageUrl?: string | null
  buttons?: Array<{ title: string; url?: string | null }>
}

export function renderCardAsText(input: CardTextInput): string {
  const lines: string[] = []
  if (input.title) lines.push(input.title)
  if (input.subtitle) lines.push(input.subtitle)
  if (input.imageUrl) lines.push(input.imageUrl)
  for (const button of input.buttons ?? []) {
    if (button.url) lines.push(`${button.title} : ${button.url}`)
  }
  return lines.join('\n')
}
