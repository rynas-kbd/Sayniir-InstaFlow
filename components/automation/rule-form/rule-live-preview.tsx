'use client'

import { Eye, ArrowDown, MessageSquare } from 'lucide-react'
import { MessagePreview } from '@/components/shared/message-preview'
import type { TriggerType } from '../types'
import type { RuleFormState } from './types'

const TRIGGER_LABELS: Record<TriggerType, string> = {
  any_message: 'Tout DM reçu',
  keyword: 'DM contenant un mot-clé',
  story_reply: 'Réponse à une story',
  story_mention: 'Mention en story',
  any_comment: 'Tout commentaire',
  comment_keyword: 'Commentaire contenant un mot-clé',
}

/** Reconstructs the "Si le client écrit → Alors l'IA répond" flow diagram (in the visual language
 * of rule-card.tsx) from live form state, instead of reusing RuleCard itself — that component
 * expects a full saved AutomationRule plus onToggle/onEdit/onDelete callbacks it doesn't have here. */
export function RuleLivePreview({ form }: { form: RuleFormState }) {
  const triggerLabel = TRIGGER_LABELS[form.trigger_type]
  const isKeywordTrigger = form.trigger_type === 'keyword' || form.trigger_type === 'comment_keyword'
  const keywordsSuffix =
    isKeywordTrigger && form.trigger_keywords.length > 0
      ? ` : "${form.trigger_keywords.slice(0, 3).join(', ')}${form.trigger_keywords.length > 3 ? '…' : ''}"`
      : ''

  return (
    <div className="flex flex-col gap-2.5">
      <span className="flex items-center gap-1.5 pl-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        <Eye className="size-3" /> Aperçu de la règle
      </span>
      <div className="flex flex-col gap-2 rounded-xl border border-border/40 bg-card/50 p-3">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>
            Si le client déclenche : <strong className="text-foreground">{triggerLabel}</strong>
            {keywordsSuffix}
          </span>
        </div>
        <ArrowDown className="size-3.5 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">Alors l&apos;IA répond :</p>
        <MessagePreview
          responseType={form.response_type}
          text={form.response_text}
          card={{ title: form.card_title, subtitle: form.card_subtitle, imageUrl: form.card_image_url, buttons: form.card_buttons }}
          placeholder
        />
      </div>
    </div>
  )
}
