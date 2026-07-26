'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { FormFooter } from '@/components/shared/form-footer'
import { useRuleForm } from './rule-form/use-rule-form'
import { RuleFormBody } from './rule-form/rule-form-body'
import { RuleLivePreview } from './rule-form/rule-live-preview'
import type { ChannelAccountLite, RuleFormPayload } from './types'

export function CreateRulePageForm({ accounts }: { accounts: ChannelAccountLite[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') === 'comment' ? 'comment' : 'dm'
  const [postSelectorActive, setPostSelectorActive] = useState(false)

  async function handleCreate(data: RuleFormPayload) {
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erreur')
  }

  const api = useRuleForm({ accounts, defaultTab, onSave: handleCreate, onSaved: () => router.push('/automation') })

  return (
    <form onSubmit={api.submit} noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-4 lg:max-w-2xl">
        <Card>
          <CardContent className="pt-2">
            <RuleFormBody api={api} autoFocusName onPostSelectorToggle={setPostSelectorActive} />
          </CardContent>
        </Card>
        {!postSelectorActive && (
          <FormFooter saving={api.saving} submitLabel="Créer la règle" onCancel={() => router.push('/automation')} className="justify-end" />
        )}
      </div>
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <RuleLivePreview form={api.form} />
      </aside>
    </form>
  )
}
