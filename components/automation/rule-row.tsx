'use client'

import { useState } from 'react'
import { Edit2, Trash2, Loader2 } from 'lucide-react'
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
        : rule.trigger_keywords?.join(', ') ?? ''

  const replyLabel =
    rule.reply_method === 'both' ? 'Commentaire + DM' : rule.reply_method === 'dm' ? 'DM' : 'Commentaire'

  const isComment = rule.trigger_type.includes('comment')

  return (
    <div
      className={`group flex items-center gap-3 border-b border-border px-4 py-3 transition-colors first:rounded-t-lg last:rounded-b-lg last:border-b-0 hover:bg-muted/40 ${rule.is_active ? '' : 'opacity-55'}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium text-foreground">{rule.name}</span>
          <Badge variant="secondary">{triggerLabel}</Badge>
          {isComment && rule.target_post_ids && rule.target_post_ids.length > 0 && (
            <Badge variant="secondary">{rule.target_post_ids.length} post(s)</Badge>
          )}
          {isComment && <Badge variant="outline">{replyLabel}</Badge>}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {account && <span>@{account.instagram_username ?? account.page_name} · </span>}
          {rule.response_text}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <div className="flex items-center gap-0.5 md:opacity-0 md:transition-opacity md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Modifier">
            <Edit2 className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
            aria-label="Supprimer"
            className="text-muted-foreground hover:text-destructive"
          >
            {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </Button>
        </div>
        <Switch checked={rule.is_active} onCheckedChange={onToggle} disabled={isToggling} className="ml-1.5" />
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette règle ?</AlertDialogTitle>
            <AlertDialogDescription>« {rule.name} » sera supprimée définitivement.</AlertDialogDescription>
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
