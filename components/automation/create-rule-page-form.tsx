'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FormFooter } from '@/components/shared/form-footer'
import { useRuleForm } from './rule-form/use-rule-form'
import { RuleFormBody } from './rule-form/rule-form-body'
import { RuleLivePreview } from './rule-form/rule-live-preview'
import SuggestedRulePreview from './suggested-rule-preview'
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

  const [intent, setIntent] = useState('')
  const [suggestion, setSuggestion] = useState<any | null>(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)
  const draftId = 'a60699fa-26e3-475c-9932-3cad10847cf6' // existing draft flow id provided by user

  async function handleSuggest() {
    if (!intent) return
    setLoadingSuggestion(true)
    try {
      const res = await fetch('/api/rules/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ intent }) })
      if (!res.ok) throw new Error('Suggestion failed')
      const data = await res.json()
      setSuggestion(data)
    } catch (err) {
      console.error(err)
      setSuggestion(null)
    } finally {
      setLoadingSuggestion(false)
    }
  }

  async function applyToDraft(s: any) {
    if (!draftId) return
    const payload: any = {
      name: s.title,
      trigger_type: s.trigger?.type === 'keyword' ? 'keyword' : 'any_message',
      trigger_keywords: s.trigger?.keywords ?? null,
      response_text: (s.actions?.find((a: any) => a.type === 'reply')?.payload?.text) ?? s.summary ?? '',
    }
    const res = await fetch(`/api/rules/${draftId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) throw new Error('Apply failed')
    const updated = await res.json()
    // Prefill local form as well
    api.setField('name', updated.name)
    api.setField('trigger_type', updated.trigger_type)
    api.setField('trigger_keywords', updated.trigger_keywords)
    api.setField('response_text', updated.response_text)
    setSuggestion(null)
    alert('Brouillon mis à jour.')
  }

  async function publishSuggestion(s: any) {
    const payload: any = {
      channel_account_id: api.form.channel_account_id,
      name: s.title,
      trigger_type: s.trigger?.type === 'keyword' ? 'keyword' : 'any_message',
      trigger_keywords: s.trigger?.keywords ?? null,
      response_text: (s.actions?.find((a: any) => a.type === 'reply')?.payload?.text) ?? s.summary ?? '',
      reply_method: api.form.reply_method,
      response_type: 'text'
    }
    const res = await fetch('/api/rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) throw new Error('Publish failed')
    const created = await res.json()
    router.push('/automation')
  }

  function prefillForm(s: any) {
    api.setField('name', s.title)
    api.setField('trigger_type', s.trigger?.type === 'keyword' ? 'keyword' : 'any_message')
    api.setField('trigger_keywords', s.trigger?.keywords ?? '')
    api.setField('response_text', (s.actions?.find((a: any) => a.type === 'reply')?.payload?.text) ?? s.summary ?? '')
    setSuggestion(null)
  }

  return (
    <form onSubmit={api.submit} noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-4 lg:max-w-2xl">
        <Card>
          <CardContent className="pt-2">
            <RuleFormBody api={api} autoFocusName onPostSelectorToggle={setPostSelectorActive} />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h4 className="font-semibold">Suggérer depuis une phrase d'intention</h4>
            <p className="text-sm text-muted-foreground">Donne une phrase courte décrivant la règle (ex: "Répondre au mot 'prix' avec le tarif").</p>
            <textarea value={intent} onChange={(e) => setIntent(e.target.value)} className="w-full mt-2 p-2 border rounded" rows={3} />
            <div className="mt-2 flex gap-2">
              <Button onClick={handleSuggest} disabled={loadingSuggestion}>{loadingSuggestion ? 'Génération...' : 'Suggérer'}</Button>
              <Button variant="ghost" onClick={() => { setIntent(''); setSuggestion(null) }}>Réinitialiser</Button>
            </div>
          </CardContent>
        </Card>

        {!postSelectorActive && (
          <FormFooter saving={api.saving} submitLabel="Créer la règle" onCancel={() => router.push('/automation')} className="justify-end" />
        )}
      </div>
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <RuleLivePreview form={api.form} />
        {suggestion && (
          <div className="mt-4">
            <SuggestedRulePreview suggestion={suggestion} onPrefill={prefillForm} onApplyDraft={applyToDraft} draftId={draftId} onPublish={publishSuggestion} onCancel={() => setSuggestion(null)} />
          </div>
        )}
      </aside>
    </form>
  )
}

