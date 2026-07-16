'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Workflow, MessageSquare, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'

const TRIGGER_OPTIONS = [
  {
    value: 'any_message',
    label: 'Tout message',
    description: 'Se déclenche sur n\'importe quel message reçu',
    icon: MessageSquare,
  },
  {
    value: 'keyword',
    label: 'Mot-clé',
    description: 'Se déclenche si le message contient un mot-clé',
    icon: Hash,
  },
] as const

type TriggerType = (typeof TRIGGER_OPTIONS)[number]['value']

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
  const [triggerType, setTriggerType] = useState<TriggerType>('any_message')
  const [saving, setSaving] = useState(false)

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
          trigger_type: triggerType,
        }),
      })
      if (!res.ok) throw new Error()
      const flow = await res.json()
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
      setTriggerType('any_message')
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

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Workflow className="size-5 text-primary" />
          </div>
          <DialogTitle className="text-lg">Créer un flow</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Donnez un nom à votre flow et choisissez son déclencheur.
          </p>
        </DialogHeader>

        <form onSubmit={handleCreate} className="mt-2 flex flex-col gap-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="flow-name">Nom du flow</Label>
            <Input
              id="flow-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Accueil nouveaux contacts"
              maxLength={80}
            />
          </div>

          {/* Trigger type */}
          <div className="space-y-2">
            <Label>Déclencheur</Label>
            <div className="grid grid-cols-2 gap-2">
              {TRIGGER_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const selected = triggerType === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTriggerType(opt.value)}
                    className={`flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-all ${
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
          </div>

          <DialogFooter className="gap-2">
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
