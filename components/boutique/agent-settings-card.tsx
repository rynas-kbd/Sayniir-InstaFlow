'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { AgentSettings } from './types'

const PROVIDERS = ['gemini', 'groq', 'openai', 'anthropic', 'openrouter']

export function AgentSettingsCard({ channelAccountId, initialSettings }: { channelAccountId: string; initialSettings: AgentSettings }) {
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)

  async function save(partial: Partial<AgentSettings>) {
    const next = { ...settings, ...partial }
    setSettings(next)
    setSaving(true)
    try {
      const res = await fetch(`/api/ecommerce-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...next, channel_account_id: channelAccountId }),
      })
      if (!res.ok) throw new Error('Erreur')
      toast.success('Configuration mise à jour')
    } catch {
      toast.error('Impossible de sauvegarder la configuration')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Configuration IA</CardTitle>
        <CardDescription>Activez les agents automatiques pour ce compte.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <Label>Assistant Q&amp;A</Label>
            <p className="text-xs text-muted-foreground">Répond aux questions sur le catalogue.</p>
          </div>
          <Switch checked={settings.is_qa_active} onCheckedChange={(v) => save({ is_qa_active: v })} disabled={saving} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Prise de commande</Label>
            <p className="text-xs text-muted-foreground">Collecte taille, adresse, téléphone et confirme la commande.</p>
          </div>
          <Switch
            checked={settings.is_order_taking_active}
            onCheckedChange={(v) => save({ is_order_taking_active: v })}
            disabled={saving}
          />
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Fournisseur IA</Label>
            <Select value={settings.ai_provider} onValueChange={(v) => v && save({ ai_provider: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-model">Modèle</Label>
            <Input id="ai-model" value={settings.ai_model} onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })} onBlur={() => save({ ai_model: settings.ai_model })} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ai-key">Clé API</Label>
          <div className="flex gap-2">
            <Input
              id="ai-key"
              type="password"
              value={settings.ai_api_key}
              onChange={(e) => setSettings({ ...settings, ai_api_key: e.target.value })}
              placeholder="••••••••••••"
            />
            <Button type="button" variant="outline" onClick={() => save({ ai_api_key: settings.ai_api_key })} disabled={saving}>
              Sauvegarder
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
