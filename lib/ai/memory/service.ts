import type { SupabaseClient } from '@supabase/supabase-js'
import type { MemoryEntry } from './types'

const MAX_ENTRIES_PER_ACCOUNT = 40
const VOLATILE_LIMIT = 10

interface MemoryRow {
  kind: string
  key: string
  value: string
}

/** preference/glossary — stable across turns, goes into the cached system block (§8.9). */
export async function getMemoryBlock(supabase: SupabaseClient, channelAccountId: string): Promise<string | undefined> {
  const { data } = await supabase
    .from('ai_memory')
    .select('kind, key, value')
    .eq('channel_account_id', channelAccountId)
    .in('kind', ['preference', 'glossary'])
    .order('updated_at', { ascending: false })

  const rows = (data ?? []) as MemoryRow[]
  if (rows.length === 0) return undefined
  return ['MÉMOIRE (préférences apprises pour ce compte) :', ...rows.map((r) => `- [${r.kind}] ${r.key}: ${r.value}`)].join('\n')
}

/** correction/fact — volatile, the 10 most recent, meant for the page-context block rather than the cached system prefix. */
export async function getVolatileMemoryBlock(supabase: SupabaseClient, channelAccountId: string): Promise<string | undefined> {
  const { data } = await supabase
    .from('ai_memory')
    .select('kind, key, value')
    .eq('channel_account_id', channelAccountId)
    .in('kind', ['fact', 'correction'])
    .order('updated_at', { ascending: false })
    .limit(VOLATILE_LIMIT)

  const rows = (data ?? []) as MemoryRow[]
  if (rows.length === 0) return undefined
  return ['NOTES RÉCENTES :', ...rows.map((r) => `- [${r.kind}] ${r.key}: ${r.value}`)].join('\n')
}

/** Upserts one entry and, if the account is over the cap, prunes the oldest low-confidence rows first. */
export async function writeMemory(supabase: SupabaseClient, channelAccountId: string, entry: MemoryEntry): Promise<void> {
  await supabase.from('ai_memory').upsert(
    {
      channel_account_id: channelAccountId,
      kind: entry.kind,
      key: entry.key,
      value: entry.value.slice(0, 280),
      source: entry.source,
      confidence: entry.confidence ?? 0.5,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'channel_account_id,kind,key' }
  )

  const { count } = await supabase
    .from('ai_memory')
    .select('*', { count: 'exact', head: true })
    .eq('channel_account_id', channelAccountId)
  if (!count || count <= MAX_ENTRIES_PER_ACCOUNT) return

  const { data: overflow } = await supabase
    .from('ai_memory')
    .select('id')
    .eq('channel_account_id', channelAccountId)
    .order('confidence', { ascending: true })
    .order('updated_at', { ascending: true })
    .limit(count - MAX_ENTRIES_PER_ACCOUNT)

  const overflowIds = (overflow ?? []).map((r) => r.id)
  if (overflowIds.length > 0) {
    await supabase.from('ai_memory').delete().in('id', overflowIds)
  }
}
