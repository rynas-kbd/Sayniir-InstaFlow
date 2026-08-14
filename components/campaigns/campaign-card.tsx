'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, Rocket, Ban, Users, Loader2, RotateCcw, Edit2, Copy } from 'lucide-react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AccountChipPicker, type PickableAccount } from '@/components/shared/account-chip-picker'
import { CampaignFormDialog } from './campaign-form-dialog'
import type { Campaign, Segment } from './types'
import type { Tag } from '@/components/contacts/types'
import { InsightBadge } from '@/components/ai/insight-badge'
import type { AiInsight } from '@/components/ai/types'
import { useT, useLocale } from '@/components/i18n-provider'

// Editing content (name/message/audience/schedule/card) doesn't make sense once a campaign is
// already dispatching or has finished — only these statuses expose the "Modifier" action.
const EDITABLE_STATUSES: Campaign['status'][] = ['draft', 'scheduled', 'cancelled', 'failed']

// Status styling config (dot/badge only — labels are resolved via t() at render time)
const STATUS_STYLES = {
  draft: {
    dot: 'bg-muted-foreground/50',
    badge: 'bg-muted text-muted-foreground border-border'
  },
  scheduled: {
    dot: 'bg-warning animate-pulse',
    badge: 'bg-warning/10 text-warning border-warning/20'
  },
  sending: {
    dot: 'bg-primary animate-ping',
    badge: 'bg-primary/5 text-primary border-primary/20 dark:bg-primary/10 dark:text-primary dark:border-primary/30'
  },
  sent: {
    dot: 'bg-success',
    badge: 'bg-success/10 text-success border-success/20'
  },
  cancelled: {
    dot: 'bg-muted-foreground/50',
    badge: 'bg-muted text-muted-foreground border-border'
  },
  failed: {
    dot: 'bg-destructive',
    badge: 'bg-destructive/5 text-destructive border-destructive/20 dark:bg-destructive/10 dark:text-destructive dark:border-destructive/30'
  },
} as const

export function CampaignCard({
  campaign: initialCampaign,
  sendCounts,
  accountName,
  channelAccountId,
  tags,
  segments: initialSegments,
  insights = [],
  allAccounts = [],
}: {
  campaign: Campaign
  sendCounts: { sent: number; pending: number; failed: number }
  accountName?: string | null
  channelAccountId: string
  tags: Tag[]
  segments: Segment[]
  insights?: AiInsight[]
  /** Every account the caller could duplicate this campaign into — see POST /api/campaigns/[id]/duplicate. */
  allAccounts?: PickableAccount[]
}) {
  const t = useT()
  const locale = useLocale()
  const router = useRouter()
  const [campaign, setCampaign] = useState(initialCampaign)
  const [segments, setSegments] = useState(initialSegments)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [relaunchOpen, setRelaunchOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [duplicateTargetIds, setDuplicateTargetIds] = useState<string[]>([])
  const [duplicating, setDuplicating] = useState(false)
  const otherAccounts = allAccounts.filter((a) => a.id !== channelAccountId)

  function toggleDuplicateTarget(accountId: string) {
    setDuplicateTargetIds((prev) => (prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]))
  }

  async function duplicateToAccounts() {
    if (duplicateTargetIds.length === 0) return
    setDuplicating(true)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds: duplicateTargetIds }),
      })
      if (!res.ok) throw new Error()
      toast.success(t.plural('campaigns.card.toastDuplicateSuccess', duplicateTargetIds.length))
      setDuplicateTargetIds([])
      router.refresh()
    } catch {
      toast.error(t('campaigns.card.toastDuplicateError'))
    } finally {
      setDuplicating(false)
    }
  }

  async function handleUpdate(data: Partial<Campaign> & { channel_account_id: string }) {
    const res = await fetch(`/api/campaigns/${campaign.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erreur')
    const updated: Campaign = await res.json()
    setCampaign(updated)
    router.refresh()
  }

  const cfg = STATUS_STYLES[campaign.status] ?? STATUS_STYLES.draft
  const statusLabel = t(`campaigns.card.status.${campaign.status in STATUS_STYLES ? campaign.status : 'draft'}`)

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
      toast.success(t('campaigns.card.toastLaunchSuccess'))
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      toast.error(t('campaigns.card.toastLaunchError'))
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
      toast.success(t('campaigns.card.toastRelaunchSuccess'))
      setTimeout(() => window.location.reload(), 1000)
    } catch {
      toast.error(t('campaigns.card.toastRelaunchError'))
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
      toast.success(t('campaigns.card.toastCancelSuccess'))
    } catch {
      toast.error(t('campaigns.card.toastCancelError'))
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
      toast.error(t('campaigns.card.toastDeleteError'))
    }
  }

  // Calculate progress stats
  const totalRecipients = sendCounts.sent + sendCounts.pending + sendCounts.failed
  const progressPercent = totalRecipients > 0 ? Math.round((sendCounts.sent / totalRecipients) * 100) : 0
  const hasCounts = totalRecipients > 0

  const dateLocale = locale === 'ar' ? 'ar' : locale === 'en' ? 'en-US' : 'fr-FR'
  const createdAt = new Date(campaign.created_at).toLocaleDateString(dateLocale, {
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
                {statusLabel}
              </span>
              <InsightBadge insights={insights} />
            </div>

            {/* Inline controls */}
            {campaign.status === 'draft' && (
              <Button size="xs" onClick={launchNow} disabled={busy} className="h-7 gap-1">
                {busy ? <Loader2 className="size-3 animate-spin" /> : <Rocket className="size-3" />}
                {t('campaigns.card.launch')}
              </Button>
            )}
            {(campaign.status === 'scheduled' || campaign.status === 'sending') && (
              <Button size="xs" variant="outline" onClick={cancel} disabled={busy} className="h-7 gap-1 border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive">
                <Ban className="size-3" />
                {t('campaigns.card.cancel')}
              </Button>
            )}
            {(campaign.status === 'sent' || campaign.status === 'failed' || campaign.status === 'cancelled') && (
              <Button size="xs" variant="outline" onClick={() => setRelaunchOpen(true)} disabled={busy} className="h-7 gap-1">
                {busy ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />}
                {t('campaigns.card.resend')}
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
                ? t.plural('campaigns.card.audienceTags', campaign.audience_tag_ids.length)
                : t('campaigns.card.audienceAll')}
            </p>
          </div>

          {/* Message Template Preview Box */}
          <div className="flex flex-col gap-1.5 pt-0.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
              {t('campaigns.card.messageTemplate')}
            </span>
            <div className="rounded-lg bg-muted/40 p-2.5 text-xs text-foreground/90 border border-border/40 min-h-[44px]">
              <p className="line-clamp-2 leading-relaxed italic">&ldquo;{campaign.message_template}&rdquo;</p>
            </div>
          </div>

          {/* Progress / Stats display */}
          {hasCounts && (
            <div className="mt-1 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-medium text-muted-foreground">{t('campaigns.card.progressLabel')}</span>
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
                <span>{t.plural('campaigns.card.sentCount', sendCounts.sent)}</span>
                <span>{t('campaigns.card.pendingCount', { count: sendCounts.pending })}</span>
                {sendCounts.failed > 0 && <span className="text-destructive/90">{t.plural('campaigns.card.failedCount', sendCounts.failed)}</span>}
              </div>
            </div>
          )}

          {/* Date */}
          <p className="mt-auto pt-1 text-[10px] text-muted-foreground/60">{t('campaigns.card.createdAt', { date: createdAt })}</p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <div className="flex items-center gap-1">
            {EDITABLE_STATUSES.includes(campaign.status) && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-label={t('campaigns.card.editAria')}
              >
                <Edit2 className="size-3.5" />
                {t('campaigns.card.edit')}
              </button>
            )}
            {otherAccounts.length > 0 && (
              <Popover>
                <PopoverTrigger
                  render={
                    <button
                      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      aria-label={t('campaigns.card.duplicateAria')}
                    />
                  }
                >
                  <Copy className="size-3.5" />
                  {t('campaigns.card.duplicate')}
                </PopoverTrigger>
                <PopoverContent align="start">
                  <p className="font-semibold text-foreground">{t('campaigns.card.duplicatePopoverTitle')}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t('campaigns.card.duplicatePopoverDescription')}
                  </p>
                  <AccountChipPicker accounts={otherAccounts} selectedIds={duplicateTargetIds} onToggle={toggleDuplicateTarget} />
                  <Button size="sm" onClick={duplicateToAccounts} disabled={duplicating || duplicateTargetIds.length === 0}>
                    {duplicating ? <Loader2 className="size-3 animate-spin" /> : <Copy className="size-3" />}
                    {t('campaigns.card.duplicateButton', { count: duplicateTargetIds.length })}
                  </Button>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label={t('campaigns.card.deleteAria')}
          >
            <Trash2 className="size-3.5" />
            {t('campaigns.card.deleteLabel')}
          </button>
        </div>
      </div>

      {editing && (
        <CampaignFormDialog
          open
          channelAccountId={channelAccountId}
          campaign={campaign}
          tags={tags}
          segments={segments}
          onSegmentsChange={setSegments}
          onSave={handleUpdate}
          onClose={() => setEditing(false)}
        />
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('campaigns.card.deleteDialogTitle', { name: campaign.name })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('campaigns.card.deleteDialogDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('campaigns.card.dialogCancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t('campaigns.card.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={relaunchOpen} onOpenChange={setRelaunchOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('campaigns.card.relaunchDialogTitle', { name: campaign.name })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('campaigns.card.relaunchDescriptionPrefix')} <strong>{t('campaigns.card.relaunchDescriptionBold')}</strong> {t('campaigns.card.relaunchDescriptionSuffix')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('campaigns.card.dialogCancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={relaunchNow}>
              {t('campaigns.card.relaunchConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
