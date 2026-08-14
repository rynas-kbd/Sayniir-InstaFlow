'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Sparkles, Key, Save, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { CreditMeter } from './credit-meter'
import { useT } from '@/components/i18n-provider'
import { PROVIDER_CONFIG, COPILOT_MODEL_CATALOG, type CopilotProviderKind } from '@/lib/ai/models'

const PROVIDER_KINDS = Object.keys(PROVIDER_CONFIG) as CopilotProviderKind[]

interface CopilotSettings {
  copilot_provider: CopilotProviderKind
  copilot_api_key: string
  copilot_model: string
  copilot_enabled: boolean
}

export function CopilotSettingsCard({
  channelAccountId,
  initialSettings,
  byokAllowed,
  creditsUsed,
  creditsLimit,
}: {
  channelAccountId: string
  initialSettings: CopilotSettings
  byokAllowed: boolean
  creditsUsed: number
  creditsLimit: number
}) {
  const t = useT()
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save(patch: Record<string, unknown>) {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/ai-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_account_id: channelAccountId, ...settings, ...patch }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setSettings(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      toast.error(t('copilotSettings.saveError'))
    } finally {
      setSaving(false)
    }
  }

  function changeProvider(provider: CopilotProviderKind) {
    const model = COPILOT_MODEL_CATALOG[provider][0]?.value ?? ''
    setSettings((s) => ({ ...s, copilot_provider: provider, copilot_model: model }))
    save({ copilot_provider: provider, copilot_model: model })
  }

  const providerLabel = PROVIDER_CONFIG[settings.copilot_provider]?.label ?? settings.copilot_provider
  const models = COPILOT_MODEL_CATALOG[settings.copilot_provider] ?? []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
          <CardTitle>{t('copilotSettings.cardTitle')}</CardTitle>
        </div>
        <CardDescription className="mt-1">{t('copilotSettings.cardDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CreditMeter used={creditsUsed} limit={creditsLimit} />

        {byokAllowed ? (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{t('copilotSettings.useOwnKeyTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('copilotSettings.useOwnKeyDescription')}</p>
              </div>
              <Switch
                checked={settings.copilot_enabled}
                onCheckedChange={(v) => {
                  setSettings((s) => ({ ...s, copilot_enabled: v }))
                  save({ copilot_enabled: v })
                }}
                disabled={saving}
              />
            </div>

            {settings.copilot_enabled && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{t('copilotSettings.providerLabel')}</Label>
                    <Select value={settings.copilot_provider} onValueChange={(v) => changeProvider(v as CopilotProviderKind)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDER_KINDS.map((kind) => (
                          <SelectItem key={kind} value={kind}>
                            {PROVIDER_CONFIG[kind].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">{t('copilotSettings.modelLabel')}</Label>
                    <Select
                      value={settings.copilot_model || models[0]?.value}
                      onValueChange={(v) => {
                        const model = v ?? ''
                        setSettings((s) => ({ ...s, copilot_model: model }))
                        save({ copilot_model: model })
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="copilot-key" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Key className="size-3" /> {t('copilotSettings.apiKeyLabel', { provider: providerLabel })}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="copilot-key"
                      type="password"
                      value={settings.copilot_api_key}
                      onChange={(e) => setSettings((s) => ({ ...s, copilot_api_key: e.target.value }))}
                      placeholder={t('copilotSettings.apiKeyPlaceholder')}
                      className="flex-1 font-mono text-sm"
                    />
                    <Button type="button" onClick={() => save({ copilot_api_key: settings.copilot_api_key })} disabled={saving} className="shrink-0 gap-1.5">
                      {saved ? (
                        <>
                          <CheckCircle2 className="size-4" /> {t('copilotSettings.saved')}
                        </>
                      ) : (
                        <>
                          <Save className="size-4" /> {t('copilotSettings.save')}
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground/60">{t('copilotSettings.keyEncryptedNote')}</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="border-t border-border pt-4 text-xs text-muted-foreground">
            {t('copilotSettings.upgradeToProNote')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
