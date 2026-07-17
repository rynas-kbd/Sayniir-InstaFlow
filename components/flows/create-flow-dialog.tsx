'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Workflow, FileText, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FormDialogHeader, FormSection } from '@/components/shared/form-section'
import { FLOW_TEMPLATES, BLANK_TEMPLATE } from '@/lib/flows/templates'

const TEMPLATE_OPTIONS = [BLANK_TEMPLATE, ...FLOW_TEMPLATES]

export function CreateFlowDialog({
  channelAccountId,
  asCard = false,
}: {
  channelAccountId: string
  asCard?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [templateId, setTemplateId] = useState<string>('blank')
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

      setOpen(false)
      router.push(`/flows/${flow.id}`)
    } catch {
      toast.error('Impossible de créer le flow')
    } finally {
      setSaving(false)
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) {
      setName('')
      setTemplateId('blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          asCard ? (
            <button className="group flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-transparent text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/4 hover:text-primary" />
          ) : (
            <Button />
          )
        }
      >
        {asCard ? (
          <>
            <div className="flex size-10 items-center justify-center rounded-xl border border-dashed border-current/30 transition-colors group-hover:border-primary/40 group-hover:bg-primary/8">
              <Plus className="size-5" />
            </div>
            <span className="text-sm font-medium">Nouveau flow</span>
          </>
        ) : (
          <>
            <Plus className="size-4" />
            Nouveau flow
          </>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <FormDialogHeader icon={Workflow} title="Créer un flow" description="Partez d'un template ou d'une toile vide." />
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex flex-col gap-3">
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

          <DialogFooter className="mt-1 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Création…' : 'Créer le flow'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
