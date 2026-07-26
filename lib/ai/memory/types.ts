export type MemoryKind = 'preference' | 'glossary' | 'fact' | 'correction'
export type MemorySource = 'explicit' | 'inferred' | 'correction'

export interface MemoryEntry {
  kind: MemoryKind
  key: string
  value: string
  source: MemorySource
  confidence?: number
}
