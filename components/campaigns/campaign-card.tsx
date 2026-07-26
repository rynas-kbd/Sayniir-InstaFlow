'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Rocket, Ban, Users, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import type { Campaign } from './types'
import { InsightBadge } from '@/components/ai/insight-badge'
import type { AiInsight } from '@/components/ai/types'

// Status styling config
const STATUS_CONFIG = {
  draft: {
    label: 'Brouillon',
    dot: 'bg-muted-foreground/50',
    badge: 'bg-muted text-muted-foreground border-border'
  },
  scheduled: {
    label: 'Planifiée',
    dot: 'bg-warning animate-pulse',
    badge: 'bg-warning/10 text-warning border-warning/20'
  },
  sending: {
    label: 'Envoi en cours',
    dot: 'bg-primary animate-ping',
    badge: 'bg-primary/5 text-primary border-primary/20 dark:bg-primary/10 dark:text-primary dark:border-primary/30'
  },
  sent: {
    label: 'Envoyée',
    dot: 'bg-success',
    badge: 'bg-success/10 text-success border-success/20'
  },
  cancelled: {
    label: 'Annulée',
    dot: 'bg-muted-foreground/50',
    badge: 'bg-muted text-muted-foreground border-border'
  },
  failed: {
    label: 'Échec',
    dot: 'bg-destructive',
    badge: 'bg-destructive/5 text-destructive border-destructive/20 dark:bg-destructive/10 dark:text-destructive dark:border-destructive/30'
  },
} as const

export function CampaignCard({
  campaign: initialCampaign,
  sendCounts,
  accountName,
  insights = [],
}: {
  campaign: Campaign
  sendCounts: { sent: number; pending: number; failed: number }
  accountName?: string | null
  insights?: AiInsight[]
}) {
  const [campaign, setCampaign] = useState(initialCampaign)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [relaunchOpen, setRelaunchOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const cfg = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.draft

  async function launchNow() {
    setBusy(true)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'scheduled', scheduled_at: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setCampaign(updated)
      toast.success('🚀 Campagne lancée !')
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      toast.error('Impossible de lancer la campagne')
    } finally {
      setBusy(false)
    }
  }

  async function relaunchNow() {
    setBusy(true)
    setRelaunchOpen(false)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relaunch: true }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setCampaign(updated)
      toast.success('🔁 Campagne renvoyée à tous les contacts !')
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      toast.error('Impossible de renvoyer la campagne')
    } finally {
      setBusy(false)
    }
  }

  async function cancel() {
    setBusy(true)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) throw new Error()
      setCampaign((prev) => ({ ...prev, status: 'cancelled' }))
      toast.success('Campagne annulée')
    } catch {
      toast.error('Impossible d’annuler la campagne')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      window.location.reload()
    } catch {
      toast.error('Impossible de supprimer la campagne')
    }
  }

  // Calculate progress stats
  const totalRecipients = sendCounts.sent + sendCounts.pending + sendCounts.failed
  const progressPercent = totalRecipients > 0 ? Math.round((sendCounts.sent / totalRecipients) * 100) : 0
  const hasCounts = totalRecipients > 0

  const createdAt = new Date(campaign.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <>
      <div
        className={`glass-stat group relative flex flex-col rounded-2xl transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 ${
          campaign.status === 'sent' ? 'border-success/10' : ''
        }`}
      >
        {/* Active color strip at the top */}
        {campaign.status === 'sent' && (
          <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gradient-to-r from-success/60 via-success to-success/60" />
        )}
        {campaign.status === 'sending' && (
          <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
        )}

        <div className="flex flex-1 flex-col gap-3 p-4">
          {/* Status and Action button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}
              >
                <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
              <InsightBadge insights={insights} />
            </div>

            {/* Inline controls */}
            {campaign.status === 'draft' && (
              <Button size="xs" onClick={launchNow} disabled={busy} className="h-7 gap-1">
                {busy ? <Loader2 className="size-3 animate-spin" /> : <Rocket className="size-3" />}
                Lancer
              </Button>
            )}
            {(campaign.status === 'scheduled' || campaign.status === 'sending') && (
              <Button size="xs" variant="outline" onClick={cancel} disabled={busy} className="h-7 gap-1 border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive">
                <Ban className="size-3" />
                Annuler
              </Button>
            )}
            {(campaign.status === 'sent' || campaign.status === 'failed' || campaign.status === 'cancelled') && (
              <Button size="xs" variant="outline" onClick={() => setRelaunchOpen(true)} disabled={busy} className="h-7 gap-1">
                {busy ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />}
                Renvoyer
              </Button>
            )}
          </div>

          {/* Title */}
          <div>
            <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{campaign.name}</h3>
            {accountName && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground/80">
                {accountName}
              </span>
            )}
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Users className="size-3 shrink-0" />
              {campaign.audience_tag_ids && campaign.audience_tag_ids.length > 0
                ? `${campaign.audience_tag_ids.length} tag(s) d'audience`
                : 'Tous les abonnés'}
            </p>
          </div>

          {/* Message Template Preview Box */}
          <div className="flex flex-col gap-1.5 pt-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
              Modèle de message
            </span>
            <div className="rounded-lg bg-muted/40 p-2.5 text-xs text-foreground/90 border border-border/40 min-h-[44px]">
              <p className="line-clamp-2 leading-relaxed italic">&ldquo;{campaign.message_template}&rdquo;</p>
            </div>
          </div>

          {/* Progress / Stats display */}
          {hasCounts && (
            <div className="mt-1 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-medium text-muted-foreground">Progression d&apos;envoi</span>
                <span className="font-semibold text-foreground">{progressPercent}%</span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    campaign.status === 'failed' ? 'bg-destructive' : 'bg-success'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {/* Status detail numbers */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 font-medium">
                <span>{sendCounts.sent} envoyé(s)</span>
                <span>{sendCounts.pending} en attente</span>
                {sendCounts.failed > 0 && <span className="text-destructive/90">{sendCounts.failed} échec(s)</span>}
              </div>
            </div>
          )}

          {/* Date */}
          <p className="mt-auto pt-1 text-[10px] text-muted-foreground/60">Créée le {createdAt}</p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end border-t border-border px-4 py-2">
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Supprimer"
          >
            <Trash2 className="size-3.5" />
            Supprimer
          </button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {campaign.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;historique des envois de cette campagne sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer la campagne
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={relaunchOpen} onOpenChange={setRelaunchOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renvoyer « {campaign.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;historique des envois précédents sera effacé et la campagne sera renvoyée à <strong>tous les contacts</strong> immédiatement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={relaunchNow}>
              🔁 Renvoyer maintenant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
