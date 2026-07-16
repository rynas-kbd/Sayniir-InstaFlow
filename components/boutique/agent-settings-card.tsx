'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Bot, Cpu, Key, MessageCircleQuestion, ShoppingBag, Save, CheckCircle2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AgentSettings } from './types'

const PROVIDERS = ['gemini', 'groq', 'openai', 'anthropic', 'openrouter'] as const

const PROVIDER_COLORS: Record<string, string> = {
  gemini: 'text-blue-500',
  groq: 'text-emerald-500',
  openai: 'text-teal-500',
  anthropic: 'text-orange-500',
  openrouter: 'text-violet-500',
}

function SettingRow({
  icon: Icon,
  title,
  description,
  control,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  control: React.ReactNode
  accent?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/20">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted', accent)}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}

export function AgentSettingsCard({ channelAccountId, initialSettings }: { channelAccountId: string; initialSettings: AgentSettings }) {
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save(partial: Partial<AgentSettings>) {
    const next = { ...settings, ...partial }
    setSettings(next)
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/ecommerce-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...next, channel_account_id: channelAccountId }),
      })
      if (!res.ok) throw new Error('Erreur')
      toast.success('Configuration mise à jour')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      toast.error('Impossible de sauvegarder la configuration')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* Section — Agents */}
      <div>
        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Bot className="size-3.5" /> Agents automatiques
        </p>
        <div className="flex flex-col gap-2">
          <SettingRow
            icon={MessageCircleQuestion}
            title="Assistant Q&A"
            description="Répond aux questions sur le catalogue automatiquement."
            accent="text-blue-500"
            control={
              <Switch
                checked={settings.is_qa_active}
                onCheckedChange={(v) => save({ is_qa_active: v })}
                disabled={saving}
              />
            }
          />
          <SettingRow
            icon={ShoppingBag}
            title="Prise de commande"
            description="Collecte taille, adresse, téléphone et confirme la commande."
            accent="text-violet-500"
            control={
              <Switch
                checked={settings.is_order_taking_active}
                onCheckedChange={(v) => save({ is_order_taking_active: v })}
                disabled={saving}
              />
            }
          />
        </div>
      </div>

      {/* Section — Provider */}
      <div>
        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Cpu className="size-3.5" /> Modèle IA
        </p>
        <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Fournisseur</Label>
            <Select value={settings.ai_provider} onValueChange={(v) => v && save({ ai_provider: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p} value={p}>
                    <span className={cn('font-medium capitalize', PROVIDER_COLORS[p] ?? '')}>{p}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-model" className="text-xs font-medium text-muted-foreground">Modèle</Label>
            <Input
              id="ai-model"
              value={settings.ai_model}
              onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
              onBlur={() => save({ ai_model: settings.ai_model })}
              placeholder="ex: gemini-1.5-flash"
            />
          </div>
        </div>
      </div>

      {/* Section — API Key */}
      <div>
        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Key className="size-3.5" /> Authentification
        </p>
        <div className="rounded-xl border border-border bg-card p-4">
          <Label htmlFor="ai-key" className="mb-1.5 block text-xs font-medium text-muted-foreground">Clé API</Label>
          <div className="flex gap-2">
            <Input
              id="ai-key"
              type="password"
              value={settings.ai_api_key}
              onChange={(e) => setSettings({ ...settings, ai_api_key: e.target.value })}
              placeholder="••••••••••••"
              className="flex-1 font-mono text-sm"
            />
            <Button
              type="button"
              onClick={() => save({ ai_api_key: settings.ai_api_key })}
              disabled={saving}
              className="shrink-0 gap-1.5"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="size-4" />
                  Sauvegardé
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground/60">
            La clé est chiffrée avant d&apos;être stockée. Elle ne sera jamais visible en clair.
          </p>
        </div>
      </div>
    </div>
  )
}
