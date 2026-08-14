'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useT } from '@/components/i18n-provider'
import type { Translator } from '@/lib/i18n/translate'

interface RuleAction {
  type: 'reply' | 'ask' | 'tag' | 'goto'
  payload: { text?: string; question?: string; tag?: string; nodeId?: string }
}

export interface RuleSuggestion {
  title: string
  summary: string
  trigger?: { type: 'keyword' | 'any'; keywords?: string[] }
  actions?: RuleAction[]
  examples?: string[]
}

/** Renders one action's payload as readable text instead of raw JSON — the field that matters differs per action type. */
function describeAction(action: RuleAction, t: Translator): string {
  switch (action.type) {
    case 'reply':
      return action.payload.text
        ? t('automation.suggestedRulePreview.actionReplyWithText', { text: action.payload.text })
        : t('automation.suggestedRulePreview.actionReply')
    case 'ask':
      return action.payload.question
        ? t('automation.suggestedRulePreview.actionAskWithQuestion', { question: action.payload.question })
        : t('automation.suggestedRulePreview.actionAsk')
    case 'tag':
      return action.payload.tag
        ? t('automation.suggestedRulePreview.actionTagWithName', { tag: action.payload.tag })
        : t('automation.suggestedRulePreview.actionTag')
    case 'goto':
      return t('automation.suggestedRulePreview.actionGoto')
    default:
      return action.type
  }
}

export default function SuggestedRulePreview({
  suggestion,
  onPrefill,
  onPublish,
  onCancel,
}: {
  suggestion: RuleSuggestion
  onPrefill: (s: RuleSuggestion) => void
  onPublish: (s: RuleSuggestion) => Promise<void>
  onCancel: () => void
}) {
  const t = useT()
  if (!suggestion) return null
  const { title, summary, trigger, actions, examples } = suggestion

  return (
    <Card>
      <CardContent className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{summary}</p>
        </div>

        {trigger && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-medium text-foreground">{t('automation.suggestedRulePreview.trigger')}</span>
            <Badge variant="secondary">
              {trigger.type === 'keyword'
                ? t('automation.suggestedRulePreview.triggerKeyword')
                : t('automation.suggestedRulePreview.triggerAnyMessage')}
            </Badge>
            {trigger.keywords?.map((k) => (
              <Badge key={k} variant="outline">
                {k}
              </Badge>
            ))}
          </div>
        )}

        {Array.isArray(actions) && actions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-foreground">{t('automation.suggestedRulePreview.actions')}</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {actions.map((a, i) => (
                <li key={i}>{describeAction(a, t)}</li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(examples) && examples.length > 0 && (
          <div>
            <p className="text-xs font-medium text-foreground">{t('automation.suggestedRulePreview.examples')}</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {examples.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={() => onPrefill(suggestion)}>
            {t('automation.suggestedRulePreview.prefill')}
          </Button>
          <Button type="button" size="sm" onClick={() => void onPublish(suggestion)}>
            {t('automation.suggestedRulePreview.publish')}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            {t('automation.suggestedRulePreview.cancel')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
