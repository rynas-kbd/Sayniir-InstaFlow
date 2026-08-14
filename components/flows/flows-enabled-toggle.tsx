'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Zap } from 'lucide-react'
import { useT } from '@/components/i18n-provider'

export function FlowsEnabledToggle({
  channelAccountId,
  initialEnabled,
}: {
  channelAccountId: string
  initialEnabled: boolean
}) {
  const t = useT()
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
      toast.success(checked ? t('flows.flowsEnabledToggle.enabledToast') : t('flows.flowsEnabledToggle.disabledToast'))
    } catch {
      setEnabled(!checked)
      toast.error(t('flows.flowsEnabledToggle.updateError'))
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
            {enabled ? t('flows.flowsEnabledToggle.enabledTitle') : t('flows.flowsEnabledToggle.disabledTitle')}
          </p>
          <p className="text-xs text-muted-foreground">
            {enabled
              ? t('flows.flowsEnabledToggle.enabledDescription')
              : t('flows.flowsEnabledToggle.disabledDescription')}
          </p>
        </div>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={toggle}
        disabled={loading}
        id="flows-enabled"
        aria-label={t('flows.flowsEnabledToggle.ariaLabel')}
      />
    </div>
  )
}
