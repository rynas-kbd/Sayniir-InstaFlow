'use client'

import { useState } from 'react'
import { Edit2, Trash2, Loader2, MessageSquare, Hash, Sparkles, ImageIcon, Zap, ArrowDown } from 'lucide-react'
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
import type { AutomationRule } from './types'

export function RuleCard({
  rule,
  isToggling,
  isDeleting,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: AutomationRule
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

  return (
    <>
      <div
        className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 ${
          rule.is_active 
            ? 'border-[color-mix(in_srgb,var(--organic-terracotta)_20%,transparent)] bg-[color-mix(in_srgb,var(--organic-bg)_15%,var(--card))] shadow-sm hover:shadow-md hover:border-[color-mix(in_srgb,var(--organic-terracotta)_40%,transparent)]' 
            : 'border-border/50 bg-card/60 opacity-80 hover:opacity-100 hover:border-border'
        }`}
      >
        {/* Glow effect when active */}
        {rule.is_active && (
          <div 
            className="absolute -right-16 -top-16 size-32 rounded-full blur-2xl opacity-10 pointer-events-none transition-all duration-300 group-hover:opacity-15"
            style={{ background: 'var(--organic-terracotta)' }}
          />
        )}

        <div className="flex flex-1 flex-col gap-3.5 p-4 md:p-5">
          {/* Header row: Account & Switch */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground shadow-sm transition-transform duration-300 group-hover:scale-105">
                <Zap className="size-4" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 className="line-clamp-1 text-[13.5px] font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                  {rule.name}
                </h3>
              </div>
            </div>
            <Switch
              checked={rule.is_active}
              onCheckedChange={onToggle}
              disabled={isToggling}
              aria-label="Activer/désactiver la règle"
              className="shrink-0 data-[state=checked]:bg-primary"
            />
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                rule.is_active
                  ? 'border-success/20 bg-success/8 text-success'
                  : 'border-border bg-muted text-muted-foreground'
              }`}
            >
              <span className={`size-1.5 rounded-full ${rule.is_active ? 'bg-success animate-pulse' : 'bg-muted-foreground/50'}`} />
              {rule.is_active ? 'Active' : 'Désactivée'}
            </span>
          </div>

          {/* Interactive Flow Diagram */}
          <div className="flex flex-col gap-2 relative mt-1">
            
            {/* Step 1: Trigger */}
            <div className="flex flex-col gap-1.5 rounded-xl border border-border/30 bg-muted/20 p-3">
              <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">
                <Zap className="size-3 text-primary/70" /> Si le client écrit
              </span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {rule.trigger_type === 'any_message' || rule.trigger_type === 'any_comment' ? (
                  <Badge variant="secondary" className="text-[11px] font-medium px-2 py-0.5 bg-muted-foreground/10 text-foreground border-0">
                    {triggerLabel}
                  </Badge>
                ) : (
                  <>
                    {rule.trigger_keywords?.slice(0, 3).map((kw) => (
                      <Badge key={kw} variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[11px] font-medium max-w-[120px] truncate px-2 py-0.5">
                        {kw}
                      </Badge>
                    ))}
                    {hasMoreKeywords && (
                      <Badge variant="outline" className="text-[11px] font-medium border-border/80 text-muted-foreground px-1.5">
                        +{extraKeywordsCount}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Visual connector */}
            <div className="flex justify-center -my-1 z-10 pointer-events-none">
              <div className="flex size-5 items-center justify-center rounded-full border border-border/40 bg-card shadow-sm text-muted-foreground/60">
                <ArrowDown className="size-3" strokeWidth={2.5} />
              </div>
            </div>

            {/* Step 2: Response */}
            <div className="flex flex-col gap-1.5 rounded-xl border border-border/30 bg-[color-mix(in_srgb,var(--organic-terracotta)_3%,var(--card))] p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {rule.response_type === 'card' ? <ImageIcon className="size-3" /> : <Sparkles className="size-3" />}
                  Alors l&apos;IA répond
                </span>
                {rule.response_type === 'card' && (
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[9px] font-semibold text-primary py-0">
                    Carte
                  </Badge>
                )}
              </div>
              <div className="mt-1 text-[12px] text-foreground/80 leading-relaxed font-serif italic border-l-2 border-primary/20 pl-2.5 py-0.5">
                {rule.response_type === 'card' ? (
                  <p className="line-clamp-2">&ldquo;{rule.card_title || 'Sans titre'}&rdquo;</p>
                ) : (
                  <p className="line-clamp-2">&ldquo;{rule.response_text}&rdquo;</p>
                )}
              </div>

              {/* Extras */}
              {isComment && (
                <div className="mt-2.5 flex items-center justify-between border-t border-border/30 pt-2 text-[10px] text-muted-foreground/80">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="size-2.5" /> {replyLabel}
                  </span>
                  {rule.target_post_ids && rule.target_post_ids.length > 0 && (
                    <span className="flex items-center gap-1 font-semibold text-[10px]">
                      <Hash className="size-2.5" /> {rule.target_post_ids.length} post(s)
                    </span>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between gap-2 border-t border-border/30 bg-muted/10 px-4 py-2.5 transition-colors group-hover:bg-muted/15">
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-destructive/8 hover:text-destructive active:scale-95 transition-all disabled:opacity-50"
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
            className="flex items-center gap-1.5 rounded-lg bg-primary/8 hover:bg-primary/14 px-3.5 py-1.5 text-[11px] font-bold text-primary active:scale-95 transition-all"
            aria-label="Modifier"
          >
            <Edit2 className="size-3.5" />
            Modifier
          </button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl border-0 shadow-2xl bg-[color-mix(in_srgb,var(--organic-bg)_85%,var(--card))] backdrop-blur-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-lg font-normal">Supprimer « {rule.name} » ?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Cette action est irréversible. L&apos;automatisation associée sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false)
                onDelete()
              }}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-xl"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
