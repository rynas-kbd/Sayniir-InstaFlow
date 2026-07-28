'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileText, Workflow, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormSection } from '@/components/shared/form-section'
import { FLOW_TEMPLATES, BLANK_TEMPLATE } from '@/lib/flows/templates'

const TEMPLATE_OPTIONS = [BLANK_TEMPLATE, ...FLOW_TEMPLATES]

export function CreateFlowForm({
  channelAccountId,
  defaultTemplateId,
  activateOnCreate,
  onCreated,
}: {
  channelAccountId: string
  /** Pre-selects a template (e.g. from the onboarding questionnaire's primary_goal) instead of defaulting to 'blank'. */
  defaultTemplateId?: string
  /** Immediately PATCHes the new flow to status:'active' — used by the onboarding checklist, where "created" must mean "live" for the activation check to pass, not left as a draft the user has to remember to publish. */
  activateOnCreate?: boolean
  /** Called instead of navigating to the flow editor — lets the onboarding checklist stay on /dashboard and advance to the next step inline. */
  onCreated?: (flowId: string) => void
}) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [templateId, setTemplateId] = useState<string>(defaultTemplateId ?? 'blank')
  const [saving, setSaving] = useState(false)

  const selectedTemplate = FLOW_TEMPLATES.find((t) => t.id === templateId)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_account_id: channelAccountId,
          name: name.trim(),
          trigger_type: selectedTemplate?.triggerType ?? 'any_message',
          trigger_keywords: selectedTemplate?.triggerKeywords ?? null,
        }),
      })
      if (!res.ok) throw new Error()
      const flow = await res.json()

      if (selectedTemplate) {
        const graphRes = await fetch(`/api/flows/${flow.id}/graph`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodes: [
              { node_key: 'trigger', type: 'trigger', config: {}, position: { x: 0, y: 0 } },
              ...selectedTemplate.nodes,
            ],
            edges: selectedTemplate.edges,
          }),
        })
        if (!graphRes.ok) toast.error('Flow créé, mais le template n\'a pas pu être chargé')
      }

      if (activateOnCreate) {
        const activateRes = await fetch(`/api/flows/${flow.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active' }),
        })
        if (!activateRes.ok) toast.error("Flow créé, mais n'a pas pu être activé — activez-le depuis la liste des flows.")
      }

      if (onCreated) {
        onCreated(flow.id)
      } else {
        router.push(`/flows/${flow.id}`)
      }
    } catch {
      toast.error('Impossible de créer le flow')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleCreate} className="flex flex-col gap-4">
      <FormSection icon={Sparkles} label="Modèle">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TEMPLATE_OPTIONS.map((opt) => {
            const Icon = opt.icon ?? FileText
            const selected = templateId === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTemplateId(opt.id)}
                className={`flex cursor-pointer flex-col gap-1.5 rounded-lg border p-3 text-left transition-all ${
                  selected
                    ? 'border-primary bg-primary/6 text-primary'
                    : 'border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50'
                }`}
              >
                <Icon className={`size-4 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-xs font-medium">{opt.label}</div>
                <div className={`text-[11px] leading-tight ${selected ? 'text-primary/70' : 'text-muted-foreground'}`}>
                  {opt.description}
                </div>
              </button>
            )
          })}
        </div>
      </FormSection>

      <FormSection icon={Workflow} label="Nom">
        <div className="space-y-1.5">
          <Label htmlFor="flow-name">Nom du flow</Label>
          <Input
            id="flow-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={selectedTemplate?.namePlaceholder ?? 'Ex : Accueil nouveaux contacts'}
            maxLength={80}
          />
        </div>
      </FormSection>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? 'Création…' : 'Créer le flow'}
        </Button>
      </div>
    </form>
  )
}
