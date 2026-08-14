'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Trash2, Pencil, ArrowRight, MessageSquare, GitBranch, Clock, Zap, Bot, Tag, Users } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AccountChipPicker, type PickableAccount } from '@/components/shared/account-chip-picker'
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
import { InsightBadge } from '@/components/ai/insight-badge'
import type { AiInsight } from '@/components/ai/types'
import { useT } from '@/components/i18n-provider'
import type { Translator } from '@/lib/i18n/translate'

// Map trigger types to readable labels
function getTriggerLabel(flow: FlowSummary, t: Translator): string {
  if (flow.trigger_type === 'any_message') return t('flows.flowCard.triggerAnyMessage')
  if (flow.trigger_type === 'keyword' && flow.trigger_keywords?.length) {
    const kws = flow.trigger_keywords.slice(0, 2).join(', ')
    return flow.trigger_keywords.length > 2 ? `${kws} +${flow.trigger_keywords.length - 2}` : kws
  }
  if (flow.trigger_type === 'comment') return t('flows.flowCard.triggerComment')
  return flow.trigger_type
}

// Status config
function getStatusConfig(t: Translator) {
  return {
    active: { label: t('flows.flowCard.statusActive'), dot: 'bg-success', badge: 'bg-success/10 text-success border-success/20' },
    paused: { label: t('flows.flowCard.statusPaused'), dot: 'bg-warning', badge: 'bg-warning/10 text-warning border-warning/20' },
    draft: { label: t('flows.flowCard.statusDraft'), dot: 'bg-muted-foreground/50', badge: 'bg-muted text-muted-foreground border-border' },
  } as const
}

// Node type icons for preview
const NODE_ICONS: Partial<Record<FlowNodeType, React.ElementType>> = {
  send_message: MessageSquare,
  condition: GitBranch,
  delay: Clock,
  ai_reply: Bot,
  set_tag: Tag,
  remove_tag: Tag,
}

export function FlowCard({
  flow: initialFlow,
  accountName,
  insights = [],
  allAccounts = [],
  initialTargetAccountIds = [],
}: {
  flow: FlowSummary
  accountName?: string | null
  insights?: AiInsight[]
  /** Every account the caller can assign this flow to, besides its owner — see PUT /api/flows/[id]/accounts. */
  allAccounts?: PickableAccount[]
  initialTargetAccountIds?: string[]
}) {
  const t = useT()
  const STATUS_CONFIG = getStatusConfig(t)
  const [flow, setFlow] = useState(initialFlow)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [targetAccountIds, setTargetAccountIds] = useState(initialTargetAccountIds)
  const [savingAccounts, setSavingAccounts] = useState(false)

  const otherAccounts = allAccounts.filter((a) => a.id !== flow.channel_account_id)

  async function toggleTargetAccount(accountId: string) {
    const next = targetAccountIds.includes(accountId) ? targetAccountIds.filter((id) => id !== accountId) : [...targetAccountIds, accountId]
    setTargetAccountIds(next)
    setSavingAccounts(true)
    try {
      const res = await fetch(`/api/flows/${flow.id}/accounts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountIds: next }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setTargetAccountIds(targetAccountIds) // rollback
      toast.error(t('flows.flowCard.accountsUpdateError'))
    } finally {
      setSavingAccounts(false)
    }
  }

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
      toast.success(checked ? t('flows.flowCard.activated') : t('flows.flowCard.paused'))
    } catch {
      toast.error(t('flows.flowCard.updateError'))
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
      toast.error(t('flows.flowCard.deleteError'))
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
            <div className="flex items-center gap-1.5">
              <InsightBadge insights={insights} />
              <Switch
                checked={flow.status === 'active'}
                onCheckedChange={toggleActive}
                disabled={toggling}
                aria-label={t('flows.flowCard.toggleAria')}
              />
            </div>
          </div>

          {/* Flow name */}
          <div>
            <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{flow.name}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="size-3 shrink-0" />
              {getTriggerLabel(flow, t)}
            </p>
            {accountName && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
                <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 px-2 py-0.5 font-medium">
                  {accountName}
                </span>
                {otherAccounts.length > 0 && (
                  <Popover>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border/60 px-2 py-0.5 font-medium transition-colors hover:border-primary/40 hover:text-primary"
                        />
                      }
                    >
                      <Users className="size-3" />
                      {targetAccountIds.length > 0 ? t('flows.flowCard.accountsCount', { count: targetAccountIds.length }) : t('flows.flowCard.addAccount')}
                    </PopoverTrigger>
                    <PopoverContent align="start">
                      <p className="font-semibold text-foreground">{t('flows.flowCard.additionalAccounts')}</p>
                      <p className="text-[11px] text-muted-foreground">{t('flows.flowCard.additionalAccountsDescription')}</p>
                      <AccountChipPicker accounts={otherAccounts} selectedIds={targetAccountIds} onToggle={toggleTargetAccount} />
                      {savingAccounts && <p className="text-[11px] text-muted-foreground">{t('flows.flowCard.saving')}</p>}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            )}
          </div>

          {/* Date */}
          <p className="text-[11px] text-muted-foreground/60">{t('flows.flowCard.createdOn', { date: createdAt })}</p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label={t('flows.flowCard.deleteAria')}
          >
            <Trash2 className="size-3.5" />
            {t('flows.flowCard.delete')}
          </button>

          <Link
            href={`/flows/${flow.id}`}
            className="flex items-center gap-1.5 rounded-md bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
          >
            <Pencil className="size-3.5" />
            {t('flows.flowCard.edit')}
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('flows.flowCard.deleteTitle', { name: flow.name })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('flows.flowCard.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('flows.flowCard.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t('flows.flowCard.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
