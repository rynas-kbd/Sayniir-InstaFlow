'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
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
  Sparkles,
  BookOpen,
  ListChecks,
  Settings2,
  Info,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { TagInput } from '@/components/shared/tag-input'
import { useT } from '@/components/i18n-provider'
import { cn } from '@/lib/utils'
import type { AgentSettings } from './types'

/* ─────────────── constants ─────────────── */

const PROVIDERS = ['gemini', 'groq', 'openai', 'anthropic', 'openrouter'] as const

const PROVIDER_META: Record<string, { color: string; badge: string; defaultModel: string }> = {
  gemini:     { color: 'text-terracotta-500',  badge: 'bg-terracotta-50 dark:bg-terracotta-950/30 text-terracotta-600 dark:text-terracotta-400 border-terracotta-200/50',  defaultModel: 'gemini-1.5-flash' },
  groq:       { color: 'text-sage-600',        badge: 'bg-sage-50 dark:bg-sage-950/30 text-sage-700 dark:text-sage-300 border-sage-200/50',                    defaultModel: 'llama3-70b-8192' },
  openai:     { color: 'text-emerald-600',     badge: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/50',           defaultModel: 'gpt-4o-mini' },
  anthropic:  { color: 'text-terracotta-700',  badge: 'bg-terracotta-50 dark:bg-terracotta-950/30 text-terracotta-700 dark:text-terracotta-300 border-terracotta-300/50', defaultModel: 'claude-3-haiku-20240307' },
  openrouter: { color: 'text-sand-600',        badge: 'bg-sand-50 dark:bg-sand-950/30 text-sand-700 dark:text-sand-300 border-sand-200/50',                    defaultModel: 'nvidia/nemotron-3-ultra-550b-a55b:free' },
}

type SubTabKey = 'agents' | 'persona' | 'knowledge' | 'infos' | 'llm'

export function AgentSettingsCard({
  channelAccountId,
  initialSettings,
}: {
  channelAccountId: string
  initialSettings: AgentSettings
}) {
  const t = useT()
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<SubTabKey>('agents')
  const [showApiKey, setShowApiKey] = useState(false)

  // Local draft for FAQ & infos
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(
    initialSettings.vertical_config?.faqs ?? []
  )
  const [newFaqQ, setNewFaqQ] = useState('')
  const [newFaqA, setNewFaqA] = useState('')
  const [editingFaqIdx, setEditingFaqIdx] = useState<number | null>(null)

  // Default info fields required by the agent (non-editable list)
  const DEFAULT_INFOS = useMemo(() => [
    t('boutique.agentSettings.infos.defaults.name'),
    t('boutique.agentSettings.infos.defaults.phone'),
    t('boutique.agentSettings.infos.defaults.address'),
    t('boutique.agentSettings.infos.defaults.wilaya'),
  ], [t])

  // Sub tabs config
  // `statusKind` drives badge color and is independent of the translated `status` label,
  // since the display text must never be used for logic/styling comparisons.
  const SUB_TABS = useMemo(() => [
    {
      key: 'agents',
      label: t('boutique.agentSettings.subTabs.agents.label'),
      icon: Bot,
      desc: t('boutique.agentSettings.subTabs.agents.desc'),
      status: settings.is_qa_active || settings.is_order_taking_active || settings.is_availability_check_active
        ? t('boutique.agentSettings.subTabs.agents.statusActive')
        : t('boutique.agentSettings.subTabs.agents.statusInactive'),
      statusKind: settings.is_qa_active || settings.is_order_taking_active || settings.is_availability_check_active
        ? 'active' as const
        : 'muted' as const,
    },
    {
      key: 'persona',
      label: t('boutique.agentSettings.subTabs.persona.label'),
      icon: Sparkles,
      desc: t('boutique.agentSettings.subTabs.persona.desc'),
      status: settings.instructions.length > 0
        ? t.plural('boutique.agentSettings.subTabs.persona.statusCount', settings.instructions.length)
        : t('boutique.agentSettings.subTabs.persona.statusEmpty'),
      statusKind: settings.instructions.length > 0 ? 'accent' as const : 'muted' as const,
    },
    {
      key: 'knowledge',
      label: t('boutique.agentSettings.subTabs.knowledge.label'),
      icon: BookOpen,
      desc: t('boutique.agentSettings.subTabs.knowledge.desc'),
      status: faqs.length > 0
        ? t.plural('boutique.agentSettings.subTabs.knowledge.statusCount', faqs.length)
        : t('boutique.agentSettings.subTabs.knowledge.statusEmpty'),
      statusKind: faqs.length > 0 ? 'accent' as const : 'muted' as const,
    },
    {
      key: 'infos',
      label: t('boutique.agentSettings.subTabs.infos.label'),
      icon: ListChecks,
      desc: t('boutique.agentSettings.subTabs.infos.desc'),
      status: settings.infos_to_collect.length > 0
        ? t.plural('boutique.agentSettings.subTabs.infos.statusCount', settings.infos_to_collect.length)
        : t('boutique.agentSettings.subTabs.infos.statusDefault'),
      statusKind: 'accent' as const,
    },
    {
      key: 'llm',
      label: t('boutique.agentSettings.subTabs.llm.label'),
      icon: Cpu,
      desc: t('boutique.agentSettings.subTabs.llm.desc'),
      status: settings.ai_provider,
      statusKind: 'accent' as const,
    },
  ] as const, [settings, faqs, t])

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
      if (!res.ok) throw new Error('Request failed')
      const updated = await res.json()
      setSettings((prev) => ({ ...prev, ...updated, ai_api_key: updated.ai_api_key ?? prev.ai_api_key }))
      toast.success(t('boutique.agentSettings.toast.saveSuccess'))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      toast.error(t('boutique.agentSettings.toast.saveError'))
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

  return (
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-6 items-start">
      {/* ── Sidebar Navigation ── */}
      <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b lg:border-b-0 lg:border-r border-border/60 pr-0 lg:pr-4">
        {SUB_TABS.map((subTab) => {
          const isActive = activeTab === subTab.key
          const Icon = subTab.icon
          return (
            <button
              key={subTab.key}
              onClick={() => setActiveTab(subTab.key)}
              className={cn(
                'group relative flex items-center gap-3 shrink-0 lg:w-full text-left px-4 py-3 rounded-2xl transition-all duration-300 focus-visible:outline-none cursor-pointer select-none',
                isActive 
                  ? 'bg-card border border-border shadow-[0_4px_12px_-2px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.35)] text-foreground font-bold' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeSubTabIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary hidden lg:block"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              
              <div className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300',
                isActive ? 'bg-primary/10 text-primary' : 'bg-muted/80 text-muted-foreground group-hover:bg-muted group-hover:text-foreground'
              )}>
                <Icon className="size-4 shrink-0" />
              </div>
              
              <div className="min-w-0 hidden lg:block flex-1">
                <p className="text-xs font-bold leading-tight">{subTab.label}</p>
                <p className="text-[10px] font-semibold text-muted-foreground truncate mt-0.5">{subTab.desc}</p>
              </div>

              {/* Status pill on Desktop only */}
              <div className="hidden lg:block shrink-0">
                <span className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                  subTab.statusKind === 'active'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : subTab.statusKind === 'muted'
                    ? 'bg-muted text-muted-foreground border border-border/40'
                    : 'bg-primary/10 text-primary border border-primary/20'
                )}>
                  {subTab.status}
                </span>
              </div>
              
              <span className="lg:hidden text-xs font-bold whitespace-nowrap">{subTab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Active Config Content Panel ── */}
      <div className="min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.25)] space-y-6"
          >
            {/* Header info bar of the selected tab */}
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                {activeTab === 'agents' && <Bot className="size-5" />}
                {activeTab === 'persona' && <Sparkles className="size-5" />}
                {activeTab === 'knowledge' && <BookOpen className="size-5" />}
                {activeTab === 'infos' && <ListChecks className="size-5" />}
                {activeTab === 'llm' && <Cpu className="size-5" />}
              </div>
              <div>
                <h3 className="font-heading text-base font-extrabold text-foreground leading-none">
                  {activeTab === 'agents' && t('boutique.agentSettings.header.agents.title')}
                  {activeTab === 'persona' && t('boutique.agentSettings.header.persona.title')}
                  {activeTab === 'knowledge' && t('boutique.agentSettings.header.knowledge.title')}
                  {activeTab === 'infos' && t('boutique.agentSettings.header.infos.title')}
                  {activeTab === 'llm' && t('boutique.agentSettings.header.llm.title')}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeTab === 'agents' && t('boutique.agentSettings.header.agents.description')}
                  {activeTab === 'persona' && t('boutique.agentSettings.header.persona.description')}
                  {activeTab === 'knowledge' && t('boutique.agentSettings.header.knowledge.description')}
                  {activeTab === 'infos' && t('boutique.agentSettings.header.infos.description')}
                  {activeTab === 'llm' && t('boutique.agentSettings.header.llm.description')}
                </p>
              </div>
            </div>

            {/* TAB CONTENT: AGENTS */}
            {activeTab === 'agents' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Q&A card */}
                <div className={cn(
                  'relative rounded-2xl border p-4 flex flex-col justify-between gap-4 transition-all duration-300',
                  settings.is_qa_active 
                    ? 'border-emerald-500/30 bg-emerald-500/[0.02] shadow-sm dark:shadow-[0_4px_16px_-4px_rgba(16,185,129,0.1)]' 
                    : 'border-border/80 bg-muted/15'
                )}>
                  <div className="space-y-3">
                    <div className={cn(
                      'flex size-9 items-center justify-center rounded-xl transition-colors',
                      settings.is_qa_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'
                    )}>
                      <MessageCircleQuestion className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-foreground">{t('boutique.agentSettings.cards.qa.title')}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        {t('boutique.agentSettings.cards.qa.description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 pt-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      {settings.is_qa_active ? t('boutique.agentSettings.cards.statusActive') : t('boutique.agentSettings.cards.statusInactive')}
                    </span>
                    <Switch
                      checked={settings.is_qa_active}
                      onCheckedChange={(v) => {
                        setSettings((s) => ({ ...s, is_qa_active: v }))
                        save({ is_qa_active: v })
                      }}
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Order taking card */}
                <div className={cn(
                  'relative rounded-2xl border p-4 flex flex-col justify-between gap-4 transition-all duration-300',
                  settings.is_order_taking_active 
                    ? 'border-orange-500/30 bg-orange-500/[0.02] shadow-sm dark:shadow-[0_4px_16px_-4px_rgba(202,103,2,0.15)]' 
                    : 'border-border/80 bg-muted/15'
                )}>
                  <div className="space-y-3">
                    <div className={cn(
                      'flex size-9 items-center justify-center rounded-xl transition-colors',
                      settings.is_order_taking_active ? 'bg-orange-100 text-orange-600' : 'bg-muted text-muted-foreground'
                    )}>
                      <ShoppingBag className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-foreground">{t('boutique.agentSettings.cards.orderTaking.title')}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        {t('boutique.agentSettings.cards.orderTaking.description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 pt-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      {settings.is_order_taking_active ? t('boutique.agentSettings.cards.statusActive') : t('boutique.agentSettings.cards.statusInactive')}
                    </span>
                    <Switch
                      checked={settings.is_order_taking_active}
                      onCheckedChange={(v) => {
                        setSettings((s) => ({ ...s, is_order_taking_active: v }))
                        save({ is_order_taking_active: v })
                      }}
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Availability card */}
                <div className={cn(
                  'relative rounded-2xl border p-4 flex flex-col justify-between gap-4 transition-all duration-300',
                  settings.is_availability_check_active 
                    ? 'border-sky-500/30 bg-sky-500/[0.02] shadow-sm dark:shadow-[0_4px_16px_-4px_rgba(14,165,233,0.1)]' 
                    : 'border-border/80 bg-muted/15'
                )}>
                  <div className="space-y-3">
                    <div className={cn(
                      'flex size-9 items-center justify-center rounded-xl transition-colors',
                      settings.is_availability_check_active ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' : 'bg-muted text-muted-foreground'
                    )}>
                      <PackageSearch className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-foreground">{t('boutique.agentSettings.cards.availability.title')}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        {t('boutique.agentSettings.cards.availability.description')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 pt-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      {settings.is_availability_check_active ? t('boutique.agentSettings.cards.statusActive') : t('boutique.agentSettings.cards.statusInactive')}
                    </span>
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
              </div>
            )}

            {/* TAB CONTENT: PERSONA */}
            {activeTab === 'persona' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Info className="size-3.5 text-primary" /> {t('boutique.agentSettings.persona.descriptionLabel')}
                  </Label>
                  <Textarea
                    rows={4}
                    placeholder={t('boutique.agentSettings.persona.descriptionPlaceholder')}
                    value={settings.vertical_config?.persona ?? ''}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        vertical_config: { ...s.vertical_config, persona: e.target.value },
                      }))
                    }
                    onBlur={() => save({ vertical_config: settings.vertical_config })}
                    className="resize-none text-sm rounded-xl border-border bg-card shadow-inner focus-visible:ring-primary/20"
                  />
                  <p className="text-[10.5px] text-muted-foreground/80 leading-normal">
                    {t('boutique.agentSettings.persona.descriptionHelp')}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-border/40">
                  <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ListChecks className="size-3.5 text-primary" /> {t('boutique.agentSettings.persona.instructionsLabel')}
                  </Label>

                  <TagInput
                    id="agent-instructions"
                    value={settings.instructions}
                    onChange={(v) => {
                      setSettings((s) => ({ ...s, instructions: v }))
                      save({ instructions: v })
                    }}
                    placeholder={t('boutique.agentSettings.persona.instructionsPlaceholder')}
                  />

                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">{t('boutique.agentSettings.persona.recommendationsLabel')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        t('boutique.agentSettings.persona.recommendations.greet'),
                        t('boutique.agentSettings.persona.recommendations.noDiscounts'),
                        t('boutique.agentSettings.persona.recommendations.replyDarija'),
                        t('boutique.agentSettings.persona.recommendations.expressDelivery'),
                        t('boutique.agentSettings.persona.recommendations.noCompetitors'),
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
                            className="rounded-full border border-dashed border-border hover:border-primary/40 bg-muted/10 hover:bg-primary/5 px-2.5 py-1 text-[10.5px] font-semibold text-muted-foreground hover:text-primary transition-all duration-200 select-none cursor-pointer"
                          >
                            + {s}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: KNOWLEDGE */}
            {activeTab === 'knowledge' && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{t('boutique.agentSettings.knowledge.savedLabel')}</p>

                  {faqs.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center rounded-2xl border border-dashed border-border bg-muted/10">
                      <BookOpen className="size-10 text-muted-foreground/40 stroke-[1.25]" />
                      <div>
                        <p className="text-sm font-bold text-foreground">{t('boutique.agentSettings.knowledge.emptyTitle')}</p>
                        <p className="text-xs text-muted-foreground/80 max-w-[40ch] leading-relaxed mt-1">
                          {t('boutique.agentSettings.knowledge.emptyDescription')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                      <AnimatePresence>
                        {faqs.map((faq, idx) => (
                          <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group relative rounded-xl border border-border/80 bg-card p-3.5 space-y-2 hover:border-primary/20 hover:shadow-sm transition-all"
                          >
                            {editingFaqIdx === idx ? (
                              <div className="space-y-2">
                                <Input
                                  value={faq.question}
                                  onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                                  placeholder={t('boutique.agentSettings.knowledge.questionPlaceholder')}
                                  className="text-xs font-bold rounded-lg border-border"
                                />
                                <Textarea
                                  rows={2}
                                  value={faq.answer}
                                  onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                                  placeholder={t('boutique.agentSettings.knowledge.answerPlaceholder')}
                                  className="resize-none text-xs rounded-lg border-border"
                                />
                                <div className="flex gap-1.5 justify-end">
                                  <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2" onClick={() => setEditingFaqIdx(null)}>
                                    {t('boutique.agentSettings.knowledge.cancel')}
                                  </Button>
                                  <Button size="sm" className="h-7 text-[10px] px-2.5" onClick={saveFaq} disabled={saving}>
                                    <CheckCircle2 className="size-3 mr-1" /> {t('boutique.agentSettings.knowledge.save')}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-3 items-start justify-between">
                                <div className="min-w-0">
                                  <p className="text-xs font-extrabold text-foreground truncate">{faq.question}</p>
                                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{faq.answer}</p>
                                </div>
                                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                                    onClick={() => setEditingFaqIdx(idx)}
                                    aria-label={t('boutique.agentSettings.knowledge.editAria')}
                                  >
                                    <Settings2 className="size-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => removeFaq(idx)}
                                    aria-label={t('boutique.agentSettings.knowledge.deleteAria')}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-4 space-y-3">
                  <p className="text-xs font-extrabold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <Plus className="size-3.5 text-primary" /> {t('boutique.agentSettings.knowledge.newTitle')}
                  </p>
                  <div className="space-y-2">
                    <Input
                      value={newFaqQ}
                      onChange={(e) => setNewFaqQ(e.target.value)}
                      placeholder={t('boutique.agentSettings.knowledge.newQuestionPlaceholder')}
                      className="text-xs rounded-xl border-border bg-card"
                    />
                    <Textarea
                      rows={2}
                      value={newFaqA}
                      onChange={(e) => setNewFaqA(e.target.value)}
                      placeholder={t('boutique.agentSettings.knowledge.newAnswerPlaceholder')}
                      className="resize-none text-xs rounded-xl border-border bg-card"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!newFaqQ.trim() || !newFaqA.trim() || saving}
                    onClick={addFaq}
                    className="w-full gap-1.5 h-9 rounded-xl font-bold"
                  >
                    {t('boutique.agentSettings.knowledge.addButton')}
                  </Button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: INFOS */}
            {activeTab === 'infos' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/80 bg-muted/10 p-4 flex gap-3 items-start">
                  <Info className="size-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground/80 leading-normal">
                    {t('boutique.agentSettings.infos.banner')}
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="agent-infos-to-collect" className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{t('boutique.agentSettings.infos.fieldsLabel')}</Label>
                  <TagInput
                    id="agent-infos-to-collect"
                    value={settings.infos_to_collect}
                    onChange={(v) => {
                      setSettings((s) => ({ ...s, infos_to_collect: v }))
                      save({ infos_to_collect: v })
                    }}
                    placeholder={t('boutique.agentSettings.infos.fieldsPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">{t('boutique.agentSettings.infos.suggestionsLabel')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      t('boutique.agentSettings.infos.suggestions.email'),
                      t('boutique.agentSettings.infos.suggestions.instagram'),
                      t('boutique.agentSettings.infos.suggestions.promoCode'),
                      t('boutique.agentSettings.infos.suggestions.deliveryDate'),
                      t('boutique.agentSettings.infos.suggestions.notes'),
                    ]
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
                          className="rounded-full border border-dashed border-border hover:border-primary/40 bg-muted/10 hover:bg-primary/5 px-2.5 py-1 text-[10.5px] font-semibold text-muted-foreground hover:text-primary transition-all duration-200 select-none cursor-pointer"
                        >
                          + {s}
                        </button>
                      ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60">{t('boutique.agentSettings.infos.defaultsLabel')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_INFOS.map((d) => (
                      <span key={d} className="inline-flex items-center rounded-full bg-muted/80 border border-border/40 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground select-none">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: LLM MODEL */}
            {activeTab === 'llm' && (
              <div className="space-y-5">
                {/* Security alert card */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] p-4 flex gap-3 items-center">
                  <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-normal">
                    {t('boutique.agentSettings.llm.securityNotice')}
                  </p>
                </div>

                {/* Grid Inputs for Provider / Model */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{t('boutique.agentSettings.llm.providerLabel')}</Label>
                    <Select
                      value={settings.ai_provider}
                      onValueChange={(v) => {
                        const provider = v as string
                        const model = PROVIDER_META[provider]?.defaultModel ?? settings.ai_model
                        setSettings((s) => ({ ...s, ai_provider: provider || s.ai_provider, ai_model: model }))
                        save({ ai_provider: provider, ai_model: model })
                      }}
                    >
                      <SelectTrigger className="w-full rounded-xl border-border bg-card shadow-sm h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDERS.map((p) => (
                          <SelectItem key={p} value={p}>
                            <span className={cn('font-bold capitalize text-xs', PROVIDER_META[p]?.color ?? '')}>
                              {p}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="ai-model" className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{t('boutique.agentSettings.llm.modelLabel')}</Label>
                    <Input
                      id="ai-model"
                      value={settings.ai_model}
                      onChange={(e) => setSettings((s) => ({ ...s, ai_model: e.target.value }))}
                      onBlur={() => save({ ai_model: settings.ai_model })}
                      placeholder={PROVIDER_META[settings.ai_provider]?.defaultModel ?? t('boutique.agentSettings.llm.modelPlaceholderFallback')}
                      className="rounded-xl border-border bg-card shadow-sm h-10 text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* API Key section */}
                <div className="space-y-1.5 pt-3 border-t border-border/40">
                  <Label htmlFor="ai-key" className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Key className="size-3.5 text-primary" /> {t('boutique.agentSettings.llm.apiKeyLabel')}
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="ai-key"
                        type={showApiKey ? 'text' : 'password'}
                        value={settings.ai_api_key}
                        onChange={(e) => setSettings((s) => ({ ...s, ai_api_key: e.target.value }))}
                        placeholder="••••••••••••••••••••••••••••••••"
                        className="rounded-xl border-border bg-card shadow-sm h-10 pr-10 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer select-none"
                      >
                        {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    
                    <Button
                      type="button"
                      onClick={() => save({ ai_api_key: settings.ai_api_key })}
                      disabled={saving}
                      className="shrink-0 rounded-xl h-10 font-bold px-4 gap-1.5"
                    >
                      {saved ? (
                        <><CheckCircle2 className="size-4" /> {t('boutique.agentSettings.llm.savedButton')}</>
                      ) : (
                        <><Save className="size-4" /> {t('boutique.agentSettings.llm.saveButton')}</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
