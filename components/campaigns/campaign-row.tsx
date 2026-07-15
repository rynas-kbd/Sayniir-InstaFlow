'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Megaphone, Trash2, Rocket, Ban } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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

const STATUS_VARIANT: Record<Campaign['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  scheduled: 'secondary',
  sending: 'secondary',
  sent: 'default',
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
      setCampaign((prev) => ({ ...prev, status: 'scheduled' }))
      toast.success('Campagne lancée — envoi dans les prochaines minutes')
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

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Megaphone className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{campaign.name}</span>
          <Badge variant={STATUS_VARIANT[campaign.status]}>{STATUS_LABEL[campaign.status]}</Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">{campaign.message_template}</p>
        {(sendCounts.sent > 0 || sendCounts.pending > 0 || sendCounts.failed > 0) && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            {sendCounts.sent} envoyé{sendCounts.sent !== 1 ? 's' : ''} · {sendCounts.pending} en attente · {sendCounts.failed} échec
            {sendCounts.failed !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
        {campaign.status === 'draft' && (
          <Button size="sm" onClick={launchNow} disabled={busy}>
            <Rocket className="size-3.5" /> Lancer
          </Button>
        )}
        {(campaign.status === 'scheduled' || campaign.status === 'sending') && (
          <Button size="sm" variant="outline" onClick={cancel} disabled={busy}>
            <Ban className="size-3.5" /> Annuler
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => setConfirmOpen(true)} className="text-destructive hover:text-destructive">
          <Trash2 className="size-4" />
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
