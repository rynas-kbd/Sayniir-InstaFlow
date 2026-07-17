'use client'

import { useState } from 'react'
import { Edit2, Trash2, Loader2, MessageSquare, Hash, Sparkles, ImageIcon, Zap } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
import { getAvatarColor, getInitials } from '@/lib/avatar-color'
import type { AutomationRule, ChannelAccountLite } from './types'

export function RuleCard({
  rule,
  account,
  isToggling,
  isDeleting,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: AutomationRule
  account?: ChannelAccountLite
  isToggling: boolean
  isDeleting: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const triggerLabel =
    rule.trigger_type === 'any_message'
      ? 'Tout message reçu'
      : rule.trigger_type === 'any_comment'
        ? 'Tout commentaire'
        : rule.trigger_keywords?.slice(0, 3).join(', ') ?? ''

  const hasMoreKeywords = rule.trigger_keywords && rule.trigger_keywords.length > 3
  const extraKeywordsCount = rule.trigger_keywords ? rule.trigger_keywords.length - 3 : 0

  const replyLabel =
    rule.reply_method === 'both'
      ? 'Commentaire + DM'
      : rule.reply_method === 'dm'
        ? 'DM uniquement'
        : 'Commentaire uniquement'

  const isComment = rule.trigger_type.includes('comment')
  const accountLabel = account ? (account.platform === 'whatsapp' ? account.phone_number : `@${account.instagram_username ?? account.page_name}`) : null

  return (
    <>
      <div
        className={`group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 ${
          rule.is_active ? '' : 'border-border/60 opacity-75'
        }`}
      >
        {/* Active indicator bar */}
        {rule.is_active && (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
        )}

        <div className="flex flex-1 flex-col gap-3.5 p-4">
          {/* Top row: account avatar + name + toggle */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  account ? getAvatarColor(account.id) : 'bg-muted text-muted-foreground'
                }`}
              >
                {account ? getInitials(accountLabel ?? account.id) : <Zap className="size-4" strokeWidth={1.75} />}
              </div>
              <div className="min-w-0">
                <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{rule.name}</h3>
                {accountLabel && <p className="truncate text-xs text-muted-foreground">{accountLabel}</p>}
              </div>
            </div>
            <Switch
              checked={rule.is_active}
              onCheckedChange={onToggle}
              disabled={isToggling}
              aria-label="Activer/désactiver la règle"
              className="shrink-0"
            />
          </div>

          <span
            className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
              rule.is_active
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            <span className={`size-1.5 rounded-full ${rule.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
            {rule.is_active ? 'Active' : 'Désactivée'}
          </span>

          {/* Trigger display */}
          <div className="flex flex-col gap-1.5 rounded-lg border border-border/40 bg-muted/30 p-2.5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              <Zap className="size-3" /> Déclencheur
            </span>
            <div className="flex flex-wrap gap-1">
              {rule.trigger_type === 'any_message' || rule.trigger_type === 'any_comment' ? (
                <Badge variant="secondary" className="text-xs">
                  {triggerLabel}
                </Badge>
              ) : (
                <>
                  {rule.trigger_keywords?.slice(0, 3).map((kw) => (
                    <Badge key={kw} variant="outline" className="border-primary/20 bg-primary/8 text-primary text-xs max-w-[120px] truncate">
                      {kw}
                    </Badge>
                  ))}
                  {hasMoreKeywords && (
                    <Badge variant="outline" className="text-xs">
                      +{extraKeywordsCount}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Response preview */}
          <div className="flex flex-1 flex-col justify-end gap-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                {rule.response_type === 'card' ? <ImageIcon className="size-3" /> : <Sparkles className="size-3" />}
                Réponse automatique
              </span>
              {rule.response_type === 'card' && (
                <Badge variant="outline" className="border-primary/25 bg-primary/8 text-[10px] text-primary">
                  Carte
                </Badge>
              )}
            </div>
            <div className="flex min-h-[52px] flex-col justify-between rounded-lg border border-border/40 bg-gradient-to-br from-muted/50 to-muted/20 p-2.5 text-xs text-foreground/90">
              {rule.response_type === 'card' ? (
                <p className="line-clamp-2 italic leading-relaxed">&ldquo;{rule.card_title || 'Sans titre'}&rdquo;</p>
              ) : (
                <p className="line-clamp-2 italic leading-relaxed">&ldquo;{rule.response_text}&rdquo;</p>
              )}

              {/* Extra comment specific tags inside the card preview */}
              {isComment && (
                <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="size-3" /> {replyLabel}
                  </span>
                  {rule.target_post_ids && rule.target_post_ids.length > 0 && (
                    <span className="flex items-center gap-1 font-medium">
                      <Hash className="size-3" /> {rule.target_post_ids.length} post(s)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/20 px-4 py-2.5">
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            aria-label="Supprimer"
          >
            {isDeleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Supprimer
          </button>

          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-md bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
            aria-label="Modifier"
          >
            <Edit2 className="size-3.5" />
            Modifier
          </button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {rule.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;automatisation associée sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false)
                onDelete()
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
