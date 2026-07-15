'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Workflow, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { FlowSummary } from './types'

export function FlowRow({ flow: initialFlow }: { flow: FlowSummary }) {
  const [flow, setFlow] = useState(initialFlow)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function toggleActive(checked: boolean) {
    const nextStatus = checked ? 'active' : 'paused'
    try {
      const res = await fetch(`/api/flows/${flow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) throw new Error('Erreur')
      setFlow((prev) => ({ ...prev, status: nextStatus }))
      toast.success(checked ? 'Flow activé' : 'Flow mis en pause')
    } catch {
      toast.error('Impossible de mettre à jour le flow')
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/flows/${flow.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur')
      window.location.reload()
    } catch {
      toast.error('Impossible de supprimer le flow')
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Workflow className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/flows/${flow.id}`} className="text-sm font-semibold text-foreground hover:underline">
          {flow.name}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant={flow.status === 'active' ? 'default' : flow.status === 'paused' ? 'secondary' : 'outline'}>
            {flow.status === 'active' ? 'Actif' : flow.status === 'paused' ? 'En pause' : 'Brouillon'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {flow.trigger_type === 'any_message' ? 'Tout message' : flow.trigger_keywords?.join(', ')}
          </span>
        </div>
      </div>
      <Switch checked={flow.status === 'active'} onCheckedChange={toggleActive} disabled={flow.status === 'draft'} />
      <Button variant="ghost" size="icon" onClick={() => setConfirmOpen(true)} className="text-destructive hover:text-destructive">
        <Trash2 className="size-4" />
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce flow ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
