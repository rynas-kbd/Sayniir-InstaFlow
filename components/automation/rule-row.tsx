'use client'

import { useState } from 'react'
import { Hash, MessageSquare, ImageIcon, Edit2, Trash2, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import type { AutomationRule, ChannelAccountLite } from './types'

export function RuleRow({
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
      ? 'Tout DM'
      : rule.trigger_type === 'any_comment'
        ? 'Tout commentaire'
        : `Mots-clés: ${rule.trigger_keywords?.join(', ')}`

  const replyLabel =
    rule.reply_method === 'both' ? 'Commentaire + DM' : rule.reply_method === 'dm' ? 'DM uniquement' : 'Commentaire uniquement'

  const isComment = rule.trigger_type.includes('comment')

  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-nowrap ${rule.is_active ? '' : 'opacity-50'}`}
    >
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
          rule.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        }`}
      >
        {isComment ? <Hash className="size-4" /> : <MessageSquare className="size-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{rule.name}</span>
          <Badge variant="outline">{triggerLabel}</Badge>
          {isComment && rule.target_post_ids && rule.target_post_ids.length > 0 && (
            <Badge variant="secondary">
              <ImageIcon className="size-3" /> {rule.target_post_ids.length} post(s)
            </Badge>
          )}
          {isComment && <Badge variant="secondary">{replyLabel}</Badge>}
          {account && (
            <span className="text-[11px] text-muted-foreground">
              @{account.instagram_username ?? account.page_name}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">{rule.response_text}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Switch checked={rule.is_active} onCheckedChange={onToggle} disabled={isToggling} />
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Modifier">
          <Edit2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setConfirmOpen(true)}
          disabled={isDeleting}
          aria-label="Supprimer"
          className="text-destructive hover:text-destructive"
        >
          {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette règle ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {rule.name} » sera supprimée définitivement.
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
    </div>
  )
}
