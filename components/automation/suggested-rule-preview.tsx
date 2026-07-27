'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function SuggestedRulePreview({
  suggestion,
  onPrefill,
  onApplyDraft,
  draftId,
  onPublish,
  onCancel,
}: {
  suggestion: any
  onPrefill: (s: any) => void
  onApplyDraft: (s: any) => Promise<void>
  draftId?: string | null
  onPublish: (s: any) => Promise<void>
  onCancel: () => void
}) {
  if (!suggestion) return null
  const { title, summary, trigger, actions, examples, uiOptions } = suggestion

  return (
    <Card>
      <CardContent>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{summary}</p>
        <div className="mt-3">
          <strong>Trigger:</strong> <span>{trigger?.type}{trigger?.keywords?.length ? ` — ${trigger.keywords.join(', ')}` : ''}</span>
        </div>
        <div className="mt-3">
          <strong>Actions</strong>
          <ul className="list-disc list-inside">
            {Array.isArray(actions) && actions.map((a: any, i: number) => (
              <li key={i} className="text-sm">{a.type}: {JSON.stringify(a.payload)}</li>
            ))}
          </ul>
        </div>
        <div className="mt-3">
          <strong>Exemples</strong>
          <ul className="list-disc list-inside">
            {Array.isArray(examples) && examples.map((e: any, i: number) => (
              <li key={i} className="text-sm">{e}</li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => onPrefill(suggestion)}>Préremplir le formulaire</Button>
          {draftId && <Button onClick={async () => await onApplyDraft(suggestion)}>Appliquer au brouillon</Button>}
          <Button onClick={async () => await onPublish(suggestion)}>Publier</Button>
          <Button variant="ghost" onClick={onCancel}>Annuler</Button>
        </div>
      </CardContent>
    </Card>
  )
}
