'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { RuleFormFields } from './rule-form-fields'
import type { ChannelAccountLite, RuleFormPayload } from './types'

export function CreateRulePageForm({ accounts }: { accounts: ChannelAccountLite[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') === 'comment' ? 'comment' : 'dm'

  async function handleCreate(data: RuleFormPayload) {
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erreur')
  }

  return (
    <RuleFormFields
      accounts={accounts}
      defaultTab={defaultTab}
      onSave={handleCreate}
      onSaved={() => router.push('/automation')}
      submitLabel="Créer la règle"
    />
  )
}
