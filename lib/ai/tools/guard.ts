// Anthropic's strict:true JSON Schema already enforces required/additionalProperties on
// tool_use.input, so these are a thin defense-in-depth layer for the confirm-resume path
// (where stored input is re-read) — not a full validation library. See
// docs/AI_NATIVE_DESIGN.md §8.8 for why zod is deliberately not used here.

export function assertString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${field} must be a non-empty string`)
  return value
}

export function assertOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined
  return assertString(value, field)
}

export function assertObject(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${field} must be an object`)
  return value as Record<string, unknown>
}
