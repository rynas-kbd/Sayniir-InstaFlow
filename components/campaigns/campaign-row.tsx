'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Trash2, Rocket, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusDot, type StatusTone } from '@/components/ui/status-dot'
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

const STATUS_TONE: Record<Campaign['status'], StatusTone> = {
  draft: 'neutral',
  scheduled: 'warning',
  sending: 'primary',
  sent: 'success',
  cancelled: 'destructive',
  failed: 'destructive',
}
const STATUS_LABEL: Record<Campaign['status'], string> = {
  draft: 'Brouillon',
  scheduled: 'Planifiée',
  sending: 'Envoi en cours',
  sent: 'Envoyée',
  cancelled: 'Annulée',
  failed: 'Échec',
}

export function CampaignRow({
  campaign: initialCampaign,
  sendCounts,
}: {
  campaign: Campaign
  sendCounts: { sent: number; pending: number; failed: number }
}) {
  const [campaign, setCampaign] = useState(initialCampaign)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function launchNow() {
    setBusy(true)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'scheduled', scheduled_at: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error('Erreur')
      const updated = await res.json()
      setCampaign(updated)
      toast.success('Campagne envoyée avec succès !')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch {
      toast.error('Impossible de lancer la campagne')
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
      if (!res.ok) throw new Error('Erreur')
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
      if (!res.ok) throw new Error('Erreur')
      window.location.reload()
    } catch {
      toast.error('Impossible de supprimer la campagne')
    }
  }

  const hasCounts = sendCounts.sent > 0 || sendCounts.pending > 0 || sendCounts.failed > 0

  return (
    <div className="group flex items-center gap-3 border-b border-border px-4 py-3 transition-colors first:rounded-t-lg last:rounded-b-lg last:border-b-0 hover:bg-muted/40">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <span className="truncate text-[13px] font-medium text-foreground">{campaign.name}</span>
          <StatusDot tone={STATUS_TONE[campaign.status]} label={STATUS_LABEL[campaign.status]} />
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {campaign.message_template}
          {hasCounts && (
            <span className="text-muted-foreground/70">
              {' '}
              · {sendCounts.sent} envoyé{sendCounts.sent !== 1 ? 's' : ''} · {sendCounts.pending} en attente ·{' '}
              {sendCounts.failed} échec{sendCounts.failed !== 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {campaign.status === 'draft' && (
          <Button size="sm" variant="outline" onClick={launchNow} disabled={busy}>
            <Rocket className="size-3.5" /> Lancer
          </Button>
        )}
        {(campaign.status === 'scheduled' || campaign.status === 'sending') && (
          <Button size="sm" variant="outline" onClick={cancel} disabled={busy}>
            <Ban className="size-3.5" /> Annuler
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setConfirmOpen(true)}
          aria-label="Supprimer"
          className="text-muted-foreground hover:text-destructive md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette campagne ?</AlertDialogTitle>
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
