'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
function describeAction(action: RuleAction): string {
  switch (action.type) {
    case 'reply':
      return action.payload.text ? `Répondre : « ${action.payload.text} »` : 'Répondre'
    case 'ask':
      return action.payload.question ? `Demander : « ${action.payload.question} »` : 'Poser une question'
    case 'tag':
      return action.payload.tag ? `Ajouter le tag "${action.payload.tag}"` : 'Ajouter un tag'
    case 'goto':
      return 'Aller à une autre étape'
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
            <span className="font-medium text-foreground">Déclencheur :</span>
            <Badge variant="secondary">{trigger.type === 'keyword' ? 'Mot-clé' : 'Tout message'}</Badge>
            {trigger.keywords?.map((k) => (
              <Badge key={k} variant="outline">
                {k}
              </Badge>
            ))}
          </div>
        )}

        {Array.isArray(actions) && actions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-foreground">Actions</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {actions.map((a, i) => (
                <li key={i}>{describeAction(a)}</li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(examples) && examples.length > 0 && (
          <div>
            <p className="text-xs font-medium text-foreground">Exemples</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {examples.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={() => onPrefill(suggestion)}>
            Préremplir le formulaire
          </Button>
          <Button type="button" size="sm" onClick={() => void onPublish(suggestion)}>
            Publier
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
