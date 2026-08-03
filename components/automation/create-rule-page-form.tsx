'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FormFooter } from '@/components/shared/form-footer'
import { useRuleForm } from './rule-form/use-rule-form'
import { RuleFormBody } from './rule-form/rule-form-body'
import { RuleLivePreview } from './rule-form/rule-live-preview'
import SuggestedRulePreview, { type RuleSuggestion } from './suggested-rule-preview'
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
  const [suggestion, setSuggestion] = useState<RuleSuggestion | null>(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)

  async function handleSuggest() {
    if (!intent.trim() || !api.form.channel_account_id) {
      if (!api.form.channel_account_id) toast.error('Sélectionnez un compte avant de générer une suggestion.')
      return
    }
    setLoadingSuggestion(true)
    try {
      const res = await fetch('/api/rules/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, channel_account_id: api.form.channel_account_id }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? 'Suggestion impossible')
      }
      const data = await res.json()
      setSuggestion(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de générer la suggestion. Réessayez.')
      setSuggestion(null)
    } finally {
      setLoadingSuggestion(false)
    }
  }

  async function publishSuggestion(s: RuleSuggestion) {
    try {
      const payload = {
        channel_account_id: api.form.channel_account_id,
        name: s.title,
        trigger_type: s.trigger?.type === 'keyword' ? 'keyword' : 'any_message',
        trigger_keywords: s.trigger?.keywords ?? null,
        response_text: s.actions?.find((a) => a.type === 'reply')?.payload?.text ?? s.summary ?? '',
        reply_method: api.form.reply_method,
        response_type: 'text',
      }
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Échec de la publication de la règle')
      toast.success('Règle publiée.')
      router.push('/automation')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Échec de la publication. Réessayez.')
    }
  }

  function prefillForm(s: RuleSuggestion) {
    api.setField('name', s.title)
    api.setField('trigger_type', s.trigger?.type === 'keyword' ? 'keyword' : 'any_message')
    api.setField('trigger_keywords', s.trigger?.keywords ?? [])
    api.setField('response_text', s.actions?.find((a) => a.type === 'reply')?.payload?.text ?? s.summary ?? '')
    setSuggestion(null)
    toast.success('Formulaire préempli depuis la suggestion.')
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
            <p className="text-sm text-muted-foreground">
              Donne une phrase courte décrivant la règle (ex: "Répondre au mot 'prix' avec le tarif").
            </p>
            <div className="mt-2 space-y-1.5">
              <Label htmlFor="rule-intent" className="sr-only">
                Phrase d'intention
              </Label>
              <Textarea
                id="rule-intent"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="Ex : Répondre au mot 'prix' avec le tarif"
                rows={3}
                maxLength={500}
              />
            </div>
            <div className="mt-2 flex gap-2">
              <Button type="button" onClick={handleSuggest} disabled={loadingSuggestion || !intent.trim()}>
                {loadingSuggestion ? 'Génération...' : 'Suggérer'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIntent('')
                  setSuggestion(null)
                }}
              >
                Réinitialiser
              </Button>
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
            <SuggestedRulePreview
              suggestion={suggestion}
              onPrefill={prefillForm}
              onPublish={publishSuggestion}
              onCancel={() => setSuggestion(null)}
            />
          </div>
        )}
      </aside>
    </form>
  )
}
