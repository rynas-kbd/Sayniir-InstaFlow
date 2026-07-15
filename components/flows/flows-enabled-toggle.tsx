'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export function FlowsEnabledToggle({ channelAccountId, initialEnabled }: { channelAccountId: string; initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)

  async function toggle(checked: boolean) {
    setEnabled(checked)
    try {
      const res = await fetch('/api/ecommerce-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_account_id: channelAccountId, flows_enabled: checked }),
      })
      if (!res.ok) throw new Error('Erreur')
      toast.success(checked ? 'Flows activés pour ce compte' : 'Flows désactivés')
    } catch {
      setEnabled(!checked)
      toast.error('Impossible de mettre à jour le réglage')
    }
  }

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-2.5">
      <Switch checked={enabled} onCheckedChange={toggle} id="flows-enabled" />
      <Label htmlFor="flows-enabled" className="text-sm">
        Activer les flows pour ce compte
      </Label>
    </div>
  )
}
