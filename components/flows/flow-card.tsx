'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Trash2, Pencil, ArrowRight, MessageSquare, GitBranch, Clock, Zap, Bot, Tag } from 'lucide-react'
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
import type { FlowSummary, FlowNodeType } from './types'

// Map trigger types to readable labels
function getTriggerLabel(flow: FlowSummary): string {
  if (flow.trigger_type === 'any_message') return 'Tout message reçu'
  if (flow.trigger_type === 'keyword' && flow.trigger_keywords?.length) {
    const kws = flow.trigger_keywords.slice(0, 2).join(', ')
    return flow.trigger_keywords.length > 2 ? `${kws} +${flow.trigger_keywords.length - 2}` : kws
  }
  if (flow.trigger_type === 'comment') return 'Commentaire reçu'
  return flow.trigger_type
}

// Status config
const STATUS_CONFIG = {
  active: { label: 'Actif', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' },
  paused: { label: 'En pause', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' },
  draft:  { label: 'Brouillon', dot: 'bg-zinc-400', badge: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700' },
} as const

// Node type icons for preview
const NODE_ICONS: Partial<Record<FlowNodeType, React.ElementType>> = {
  send_message: MessageSquare,
  condition: GitBranch,
  delay: Clock,
  ai_reply: Bot,
  set_tag: Tag,
  remove_tag: Tag,
}

export function FlowCard({ flow: initialFlow }: { flow: FlowSummary }) {
  const [flow, setFlow] = useState(initialFlow)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toggling, setToggling] = useState(false)

  const cfg = STATUS_CONFIG[flow.status] ?? STATUS_CONFIG.draft

  async function toggleActive(checked: boolean) {
    const nextStatus = checked ? 'active' : 'paused'
    setToggling(true)
    try {
      const res = await fetch(`/api/flows/${flow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) throw new Error()
      setFlow((prev) => ({ ...prev, status: nextStatus }))
      toast.success(checked ? '✅ Flow activé' : '⏸️ Flow mis en pause')
    } catch {
      toast.error('Impossible de mettre à jour le flow')
    } finally {
      setToggling(false)
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/flows/${flow.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      window.location.reload()
    } catch {
      toast.error('Impossible de supprimer le flow')
    }
  }

  const createdAt = new Date(flow.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <>
      <div className="group relative flex flex-col rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
        {/* Active indicator bar */}
        {flow.status === 'active' && (
          <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
        )}

        {/* Card body */}
        <div className="flex flex-1 flex-col gap-3 p-4">
          {/* Top row: status badge + toggle */}
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}>
              <span className={`size-1.5 rounded-full ${cfg.dot} ${flow.status === 'active' ? 'animate-pulse' : ''}`} />
              {cfg.label}
            </span>
            <Switch
              checked={flow.status === 'active'}
              onCheckedChange={toggleActive}
              disabled={toggling}
              aria-label="Activer/désactiver le flow"
            />
          </div>

          {/* Flow name */}
          <div>
            <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{flow.name}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="size-3 shrink-0" />
              {getTriggerLabel(flow)}
            </p>
          </div>

          {/* Date */}
          <p className="text-[11px] text-muted-foreground/60">Créé le {createdAt}</p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Supprimer"
          >
            <Trash2 className="size-3.5" />
            Supprimer
          </button>

          <Link
            href={`/flows/${flow.id}`}
            className="flex items-center gap-1.5 rounded-md bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
          >
            <Pencil className="size-3.5" />
            Modifier
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {flow.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données associées à ce flow seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
