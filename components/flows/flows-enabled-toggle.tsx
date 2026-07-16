'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Zap } from 'lucide-react'

export function FlowsEnabledToggle({
  channelAccountId,
  initialEnabled,
}: {
  channelAccountId: string
  initialEnabled: boolean
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)

  async function toggle(checked: boolean) {
    setEnabled(checked)
    setLoading(true)
    try {
      const res = await fetch('/api/ecommerce-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_account_id: channelAccountId, flows_enabled: checked }),
      })
      if (!res.ok) throw new Error()
      toast.success(checked ? '⚡ Flows activés' : 'Flows désactivés')
    } catch {
      setEnabled(!checked)
      toast.error('Impossible de mettre à jour le réglage')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border px-5 py-4 transition-all ${
        enabled
          ? 'border-primary/25 bg-primary/5'
          : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
            enabled ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
          }`}
        >
          <Zap className="size-4" />
        </div>
        <div>
          <p className={`text-sm font-medium ${enabled ? 'text-foreground' : 'text-foreground'}`}>
            {enabled ? 'Flows activés pour ce compte' : 'Flows désactivés'}
          </p>
          <p className="text-xs text-muted-foreground">
            {enabled
              ? 'Les flows prennent le contrôle des messages entrants.'
              : 'Activez pour que les flows gèrent les messages entrants.'}
          </p>
        </div>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={toggle}
        disabled={loading}
        id="flows-enabled"
        aria-label="Activer les flows"
      />
    </div>
  )
}
