/**
 * Pure reducer helpers for CopilotPanel's assistant message model. Extracted
 * from the component so the "how do text deltas and tool-result cards
 * interleave" logic is unit-testable without mounting React — text and
 * tool results arrive as separate stream events (lib/ai/types.ts) in
 * whatever order the model produces them (prose, then a tool call, then
 * more prose, ...), and the UI needs to render them in that same order
 * rather than lumping all text together and all cards at the end.
 */
export type AssistantPart = { type: 'text'; text: string } | { type: 'tool_result'; name: string; output: unknown }

/**
 * Appends a streamed text delta, merging into the last part if it's already
 * text (the common case — most deltas continue the sentence in progress)
 * instead of fragmenting one paragraph into dozens of parts.
 */
export function appendTextDelta(parts: readonly AssistantPart[], delta: string): AssistantPart[] {
  const last = parts[parts.length - 1]
  if (last?.type === 'text') {
    return [...parts.slice(0, -1), { type: 'text', text: last.text + delta }]
  }
  return [...parts, { type: 'text', text: delta }]
}

/**
 * Appends a displayable tool result as its own part — always a new part,
 * never merged, so it renders as a distinct card between whatever text
 * came before it and whatever text follows.
 */
export function appendToolResult(parts: readonly AssistantPart[], name: string, output: unknown): AssistantPart[] {
  return [...parts, { type: 'tool_result', name, output }]
}
