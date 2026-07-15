'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { StatusDot } from '@/components/ui/status-dot'
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
    <div className="group flex items-center gap-3 border-b border-border px-4 py-3 transition-colors first:rounded-t-lg last:rounded-b-lg last:border-b-0 hover:bg-muted/40">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <Link href={`/flows/${flow.id}`} className="truncate text-[13px] font-medium text-foreground hover:underline">
            {flow.name}
          </Link>
          <StatusDot
            tone={flow.status === 'active' ? 'success' : flow.status === 'paused' ? 'warning' : 'neutral'}
            label={flow.status === 'active' ? 'Actif' : flow.status === 'paused' ? 'En pause' : 'Brouillon'}
          />
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {flow.trigger_type === 'any_message' ? 'Tout message' : flow.trigger_keywords?.join(', ')}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setConfirmOpen(true)}
          aria-label="Supprimer"
          className="text-muted-foreground hover:text-destructive md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </Button>
        <Switch
          checked={flow.status === 'active'}
          onCheckedChange={toggleActive}
          disabled={flow.status === 'draft'}
          className="ml-1.5"
        />
      </div>

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
