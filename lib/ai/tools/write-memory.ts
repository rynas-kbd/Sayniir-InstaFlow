import { writeMemory } from '../memory/service.ts'
import type { MemoryKind } from '../memory/types.ts'
import type { AiTool } from './types.ts'

interface Input {
  kind: MemoryKind
  key: string
  value: string
}

export const writeMemoryTool: AiTool<Input, { saved: boolean }> = {
  name: 'write_memory',
  description: "Retient un fait, une préférence, un terme de glossaire, ou une correction pour les prochaines conversations sur ce compte.",
  risk: 'write_reversible',
  inputSchema: {
    type: 'object',
    properties: {
      kind: { type: 'string', enum: ['preference', 'glossary', 'fact', 'correction'] },
      key: { type: 'string', description: 'Identifiant court de cette entrée (ex: "ton", "nom_produit_principal")' },
      value: { type: 'string', description: 'Contenu, 280 caractères max' },
    },
    required: ['kind', 'key', 'value'],
    additionalProperties: false,
  },
  run: async (input, ctx) => {
    await writeMemory(ctx.supabase, ctx.channelAccountId, { kind: input.kind, key: input.key, value: input.value, source: 'explicit' })
    return { saved: true }
  },
}
