'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Bot,
  Cpu,
  Key,
  MessageCircleQuestion,
  ShoppingBag,
  PackageSearch,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  BookOpen,
  ListChecks,
  Settings2,
  Info,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { TagInput } from '@/components/shared/tag-input'
import { cn } from '@/lib/utils'
import type { AgentSettings } from './types'

/* ─────────────── constants ─────────────── */

const PROVIDERS = ['gemini', 'groq', 'openai', 'anthropic', 'openrouter'] as const

const PROVIDER_META: Record<string, { color: string; badge: string; defaultModel: string }> = {
  gemini:     { color: 'text-terracotta-500',  badge: 'bg-terracotta-50 text-terracotta-600 border-terracotta-200',  defaultModel: 'gemini-1.5-flash' },
  groq:       { color: 'text-sage-600',        badge: 'bg-sage-50 text-sage-700 border-sage-200',                    defaultModel: 'llama3-70b-8192' },
  openai:     { color: 'text-emerald-600',     badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',           defaultModel: 'gpt-4o-mini' },
  anthropic:  { color: 'text-terracotta-700',  badge: 'bg-terracotta-50 text-terracotta-700 border-terracotta-300', defaultModel: 'claude-3-haiku-20240307' },
  openrouter: { color: 'text-sand-600',        badge: 'bg-sand-50 text-sand-700 border-sand-200',                    defaultModel: 'nvidia/nemotron-3-ultra-550b-a55b:free' },
}

const DEFAULT_INFOS = ['Nom', 'Téléphone', 'Adresse', 'Wilaya']

/* ─────────────── sub-components ─────────────── */

function SectionHeader({
  icon: Icon,
  title,
  description,
  badge,
  expanded,
  onToggle,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  badge?: string | number
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Icon className="size-4 text-foreground/70" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {badge !== undefined && (
            <span className="inline-flex items-center rounded-full bg-terracotta-100 px-2 py-0.5 text-[10px] font-semibold text-terracotta-700">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0 text-muted-foreground">
        {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
      </div>
    </button>
  )
}

/* ─────────────── main component ─────────────── */

export function AgentSettingsCard({
  channelAccountId,
  initialSettings,
}: {
  channelAccountId: string
  initialSettings: AgentSettings
}) {
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Local draft for FAQ & infos (only saved on explicit action)
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(
    initialSettings.vertical_config?.faqs ?? []
  )
  const [newFaqQ, setNewFaqQ] = useState('')
  const [newFaqA, setNewFaqA] = useState('')
  const [editingFaqIdx, setEditingFaqIdx] = useState<number | null>(null)

  // Expanded sections state
  const [openSections, setOpenSections] = useState({
    agents: true,
    persona: false,
    knowledge: false,
    infos: false,
    llm: false,
  })

  type SectionKey = keyof typeof openSections
  function toggleSection(k: SectionKey) {
    setOpenSections((s) => ({ ...s, [k]: !s[k] }))
  }

  /* ── save helper ── */
  async function save(patch: Record<string, unknown>) {
    const payload = {
      ...settings,
      channel_account_id: channelAccountId,
      ...patch,
    }
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/ecommerce-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Erreur')
      const updated = await res.json()
      setSettings((prev) => ({ ...prev, ...updated, ai_api_key: updated.ai_api_key ?? prev.ai_api_key }))
      toast.success('Configuration mise à jour')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      toast.error('Impossible de sauvegarder')
    } finally {
      setSaving(false)
    }
  }

  /* ── FAQ helpers ── */
  function addFaq() {
    if (!newFaqQ.trim() || !newFaqA.trim()) return
    const next = [...faqs, { question: newFaqQ.trim(), answer: newFaqA.trim() }]
    setFaqs(next)
    setNewFaqQ('')
    setNewFaqA('')
    save({ vertical_config: { ...settings.vertical_config, faqs: next } })
  }

  function updateFaq(idx: number, field: 'question' | 'answer', val: string) {
    const next = faqs.map((f, i) => (i === idx ? { ...f, [field]: val } : f))
    setFaqs(next)
  }

  function saveFaq() {
    save({ vertical_config: { ...settings.vertical_config, faqs } })
    setEditingFaqIdx(null)
  }

  function removeFaq(idx: number) {
    const next = faqs.filter((_, i) => i !== idx)
    setFaqs(next)
    save({ vertical_config: { ...settings.vertical_config, faqs: next } })
  }

  /* ── render ── */
  return (
    <div className="mt-4 flex flex-col gap-2">

      {/* ══════════════ 1. AGENTS TOGGLE ══════════════ */}
      <SectionHeader
        icon={Bot}
        title="Agents automatiques"
        description="Active les réponses IA sur vos canaux connectés."
        expanded={openSections.agents}
        onToggle={() => toggleSection('agents')}
      />
      {openSections.agents && (
        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3 ml-2 border-l-2 border-l-terracotta-200">
          {/* Q&A toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-terracotta-50">
                <MessageCircleQuestion className="size-4 text-terracotta-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Assistant Q&amp;A</p>
                <p className="text-xs text-muted-foreground">Répond aux questions sur le catalogue.</p>
              </div>
            </div>
            <Switch
              checked={settings.is_qa_active}
              onCheckedChange={(v) => {
                setSettings((s) => ({ ...s, is_qa_active: v }))
                save({ is_qa_active: v })
              }}
              disabled={saving}
            />
          </div>
          {/* Order taking toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sage-50">
                <ShoppingBag className="size-4 text-sage-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Prise de commande</p>
                <p className="text-xs text-muted-foreground">Collecte les infos et confirme la commande.</p>
              </div>
            </div>
            <Switch
              checked={settings.is_order_taking_active}
              onCheckedChange={(v) => {
                setSettings((s) => ({ ...s, is_order_taking_active: v }))
                save({ is_order_taking_active: v })
              }}
              disabled={saving}
            />
          </div>
          {/* Availability check toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sky-50">
                <PackageSearch className="size-4 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Vérification de disponibilité</p>
                <p className="text-xs text-muted-foreground">Répond aux questions de stock à partir des données réelles, jamais deviné.</p>
              </div>
            </div>
            <Switch
              checked={settings.is_availability_check_active}
              onCheckedChange={(v) => {
                setSettings((s) => ({ ...s, is_availability_check_active: v }))
                save({ is_availability_check_active: v })
              }}
              disabled={saving}
            />
          </div>
        </div>
      )}

      {/* ══════════════ 2. PERSONA / BEHAVIOR ══════════════ */}
      <SectionHeader
        icon={Sparkles}
        title="Persona & Comportement"
        description="Définissez le ton, le style et les consignes de votre IA."
        badge={settings.instructions.length > 0 ? settings.instructions.length : undefined}
        expanded={openSections.persona}
        onToggle={() => toggleSection('persona')}
      />
      {openSections.persona && (
        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-4 ml-2 border-l-2 border-l-terracotta-200">

          {/* Persona text / system prompt */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Info className="size-3" /> Description de votre assistant
            </Label>
            <Textarea
              rows={3}
              placeholder="Ex: Tu es Lyna, assistante chaleureuse de la boutique Dahlia. Tu réponds en darija et français. Tu es enthousiaste et patiente."
              value={settings.vertical_config?.persona ?? ''}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  vertical_config: { ...s.vertical_config, persona: e.target.value },
                }))
              }
              onBlur={() => save({ vertical_config: settings.vertical_config })}
              className="resize-none text-sm"
            />
            <p className="text-[11px] text-muted-foreground/70">
              Décrivez en quelques phrases le caractère et le rôle de votre IA.
            </p>
          </div>

          {/* Custom instructions (tags) */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ListChecks className="size-3" /> Instructions spécifiques
            </Label>
            <TagInput
              id="agent-instructions"
              value={settings.instructions}
              onChange={(v) => {
                setSettings((s) => ({ ...s, instructions: v }))
                save({ instructions: v })
              }}
              placeholder="Appuyer sur Entrée pour ajouter..."
            />
            <div className="flex flex-wrap gap-1">
              {[
                'Toujours saluer le client',
                'Ne jamais donner de réductions',
                'Répondre en darija',
                'Proposer de livraison express',
                'Ne pas mentionner les concurrents',
              ]
                .filter((s) => !settings.instructions.includes(s))
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      const v = [...settings.instructions, s]
                      setSettings((prev) => ({ ...prev, instructions: v }))
                      save({ instructions: v })
                    }}
                    className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:border-terracotta-400 hover:text-terracotta-600 transition-colors"
                  >
                    + {s}
                  </button>
                ))}
            </div>
            <p className="text-[11px] text-muted-foreground/70">
              Règles que l&apos;IA doit toujours respecter — séparées par Entrée.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════ 3. BASE DE CONNAISSANCES ══════════════ */}
      <SectionHeader
        icon={BookOpen}
        title="Base de connaissances"
        description="Questions / Réponses que l'IA connaît par cœur."
        badge={faqs.length > 0 ? faqs.length : undefined}
        expanded={openSections.knowledge}
        onToggle={() => toggleSection('knowledge')}
      />
      {openSections.knowledge && (
        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-4 ml-2 border-l-2 border-l-sage-200">

          {/* FAQ list */}
          {faqs.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
              <BookOpen className="size-8 opacity-30" />
              <p className="text-sm font-medium">Aucune connaissance ajoutée</p>
              <p className="text-xs opacity-70">Ajoutez des Q&amp;R pour que l&apos;IA réponde précisément.</p>
            </div>
          )}

          {faqs.map((faq, idx) => (
            <div key={idx} className="group rounded-xl border border-border bg-background p-3 space-y-2 transition-shadow hover:shadow-sm">
              {editingFaqIdx === idx ? (
                <>
                  <Input
                    value={faq.question}
                    onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                    placeholder="Question"
                    className="text-sm font-medium"
                  />
                  <Textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                    placeholder="Réponse de l'IA"
                    className="resize-none text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditingFaqIdx(null)}>
                      Annuler
                    </Button>
                    <Button size="sm" onClick={saveFaq} disabled={saving}>
                      <CheckCircle2 className="size-3.5 mr-1" /> Enregistrer
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-3 items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{faq.question}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setEditingFaqIdx(idx)}
                      aria-label={`Modifier la question "${faq.question}"`}
                    >
                      <Settings2 className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => removeFaq(idx)}
                      aria-label={`Supprimer la question "${faq.question}"`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add new FAQ */}
          <div className="rounded-xl border border-dashed border-border p-3 space-y-2 bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nouvelle connaissance</p>
            <Input
              value={newFaqQ}
              onChange={(e) => setNewFaqQ(e.target.value)}
              placeholder="Ex: Livrez-vous à Alger ?"
              className="text-sm"
            />
            <Textarea
              rows={2}
              value={newFaqA}
              onChange={(e) => setNewFaqA(e.target.value)}
              placeholder="Ex: Oui ! Nous livrons dans toutes les wilayas via Yalidine et Zaki Express."
              className="resize-none text-sm"
            />
            <Button
              type="button"
              size="sm"
              disabled={!newFaqQ.trim() || !newFaqA.trim() || saving}
              onClick={addFaq}
              className="w-full gap-1.5"
            >
              <Plus className="size-3.5" /> Ajouter à la base de connaissances
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════ 4. INFOS À COLLECTER ══════════════ */}
      <SectionHeader
        icon={ListChecks}
        title="Informations à collecter"
        description="Données que l'IA doit obligatoirement demander au client."
        badge={settings.infos_to_collect.length > 0 ? settings.infos_to_collect.length : undefined}
        expanded={openSections.infos}
        onToggle={() => toggleSection('infos')}
      />
      {openSections.infos && (
        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3 ml-2 border-l-2 border-l-sand-300">
          <p className="text-xs text-muted-foreground">
            Ces champs sont collectés <strong>en plus</strong> des informations de commande standard (produit, taille, couleur, adresse, wilaya).
          </p>
          <Label htmlFor="agent-infos-to-collect" className="text-xs font-medium text-muted-foreground">Champs supplémentaires</Label>
          <TagInput
            id="agent-infos-to-collect"
            value={settings.infos_to_collect}
            onChange={(v) => {
              setSettings((s) => ({ ...s, infos_to_collect: v }))
              save({ infos_to_collect: v })
            }}
            placeholder="Ex: Code promo, Préférence couleur…"
          />
          <div className="flex flex-wrap gap-1">
            {['Email', 'Réseaux sociaux', 'Code promo', 'Date de livraison souhaitée', 'Commentaire']
              .filter((s) => !settings.infos_to_collect.includes(s))
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    const v = [...settings.infos_to_collect, s]
                    setSettings((prev) => ({ ...prev, infos_to_collect: v }))
                    save({ infos_to_collect: v })
                  }}
                  className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:border-terracotta-400 hover:text-terracotta-600 transition-colors"
                >
                  + {s}
                </button>
              ))}
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <p className="text-[11px] text-muted-foreground/70 w-full">Inclus par défaut :</p>
            {DEFAULT_INFOS.map((d) => (
              <span key={d} className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════ 5. MODÈLE LLM ══════════════ */}
      <SectionHeader
        icon={Cpu}
        title="Modèle IA & Clé API"
        description="Fournisseur, modèle et authentification de votre IA."
        expanded={openSections.llm}
        onToggle={() => toggleSection('llm')}
      />
      {openSections.llm && (
        <div className="rounded-xl border border-border bg-card/50 p-4 space-y-4 ml-2 border-l-2 border-l-muted">

          {/* Provider */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Fournisseur</Label>
              <Select
                value={settings.ai_provider}
                onValueChange={(v) => {
                  const provider = v as string
                  const model = PROVIDER_META[provider]?.defaultModel ?? settings.ai_model
                  setSettings((s) => ({ ...s, ai_provider: provider || s.ai_provider, ai_model: model }))
                  save({ ai_provider: provider, ai_model: model })
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className={cn('font-semibold capitalize', PROVIDER_META[p]?.color ?? '')}>
                        {p}
                      </span>
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
                onChange={(e) => setSettings((s) => ({ ...s, ai_model: e.target.value }))}
                onBlur={() => save({ ai_model: settings.ai_model })}
                placeholder={PROVIDER_META[settings.ai_provider]?.defaultModel ?? 'modèle'}
              />
            </div>
          </div>

          {/* Provider badge */}
          {settings.ai_provider && PROVIDER_META[settings.ai_provider] && (
            <div className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium', PROVIDER_META[settings.ai_provider].badge)}>
              <span className="size-1.5 rounded-full bg-current opacity-70" />
              Connecté via {settings.ai_provider}
            </div>
          )}

          {/* API Key */}
          <div className="space-y-1.5">
            <Label htmlFor="ai-key" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Key className="size-3" /> Clé API
            </Label>
            <div className="flex gap-2">
              <Input
                id="ai-key"
                type="password"
                value={settings.ai_api_key}
                onChange={(e) => setSettings((s) => ({ ...s, ai_api_key: e.target.value }))}
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
                  <><CheckCircle2 className="size-4" /> Sauvegardé</>
                ) : (
                  <><Save className="size-4" /> Sauvegarder</>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground/60">
              La clé est chiffrée avant stockage et ne sera jamais visible en clair.
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
