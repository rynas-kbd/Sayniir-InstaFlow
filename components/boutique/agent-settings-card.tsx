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

const DEFAULT_INFOS = ['Nom', 'Téléphone', 'Adresse', 'Wilaya']

type SubTabKey = 'agents' | 'persona' | 'knowledge' | 'infos' | 'llm'

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
  const [activeTab, setActiveTab] = useState<SubTabKey>('agents')
  const [showApiKey, setShowApiKey] = useState(false)

  // Local draft for FAQ & infos
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(
    initialSettings.vertical_config?.faqs ?? []
  )
  const [newFaqQ, setNewFaqQ] = useState('')
  const [newFaqA, setNewFaqA] = useState('')
  const [editingFaqIdx, setEditingFaqIdx] = useState<number | null>(null)

  // Sub tabs config
  const SUB_TABS = useMemo(() => [
    { 
      key: 'agents', 
      label: 'Agents automatiques', 
      icon: Bot, 
      desc: 'Réponses & Prise de commandes',
      status: settings.is_qa_active || settings.is_order_taking_active || settings.is_availability_check_active ? 'actif' : 'inactif'
    },
    { 
      key: 'persona', 
      label: 'Persona & Consignes', 
      icon: Sparkles, 
      desc: 'Ton, style et règles métier',
      status: settings.instructions.length > 0 ? `${settings.instructions.length} consignes` : 'vide'
    },
    { 
      key: 'knowledge', 
      label: 'Base de connaissances', 
      icon: BookOpen, 
      desc: 'FAQ & Questions fréquentes',
      status: faqs.length > 0 ? `${faqs.length} connaissances` : 'vide'
    },
    { 
      key: 'infos', 
      label: 'Champs à collecter', 
      icon: ListChecks, 
      desc: 'Données à demander au client',
      status: settings.infos_to_collect.length > 0 ? `${settings.infos_to_collect.length} champs` : 'par défaut'
    },
    { 
      key: 'llm', 
      label: 'Modèle & Clé API', 
      icon: Cpu, 
      desc: 'Moteur IA et authentification',
      status: settings.ai_provider
    },
  ] as const, [settings, faqs])

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
                  subTab.status === 'actif'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : subTab.status === 'vide' || subTab.status === 'inactif'
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
                  {activeTab === 'agents' && 'Gestion des Agents automatiques'}
                  {activeTab === 'persona' && 'Identité, Persona & Comportement'}
                  {activeTab === 'knowledge' && 'Base de connaissances & FAQ'}
                  {activeTab === 'infos' && 'Informations client à collecter'}
                  {activeTab === 'llm' && 'Modèle de Langage & Authentification'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeTab === 'agents' && 'Sélectionnez quels modules d\'intelligence artificielle sont autorisés à répondre.'}
                  {activeTab === 'persona' && 'Personnalisez le caractère du bot, le ton à adopter, et donnez des instructions strictes.'}
                  {activeTab === 'knowledge' && 'Insérez les réponses standard de votre boutique pour guider l\'IA.'}
                  {activeTab === 'infos' && 'Configurez les champs supplémentaires que l\'agent doit collecter durant les commandes.'}
                  {activeTab === 'llm' && 'Choisissez votre fournisseur de modèle d\'intelligence artificielle.'}
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
                      <p className="text-sm font-extrabold text-foreground">Assistant Q&amp;A</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        Répond de manière autonome aux questions courantes concernant vos produits et services en se basant sur votre FAQ.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 pt-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      {settings.is_qa_active ? 'Actif' : 'Désactivé'}
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
                      <p className="text-sm font-extrabold text-foreground">Prise de Commande</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        Détecte l&apos;intention d&apos;achat du client, collecte les informations de livraison nécessaires et valide le panier.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 pt-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      {settings.is_order_taking_active ? 'Actif' : 'Désactivé'}
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
                      <p className="text-sm font-extrabold text-foreground">Disponibilité Stock</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        Consulte en temps réel l&apos;état exact des stocks de votre catalogue pour ne proposer que des variantes disponibles.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border/40 pt-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      {settings.is_availability_check_active ? 'Actif' : 'Désactivé'}
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
                    <Info className="size-3.5 text-primary" /> Description de votre assistant
                  </Label>
                  <Textarea
                    rows={4}
                    placeholder="Ex: Tu es Lyna, assistante chaleureuse de la boutique Dahlia. Tu réponds en darija et français. Tu es enthousiaste et patiente."
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
                    Donnez à l&apos;IA une identité claire (nom, langue, attitude). Cela l&apos;aidera à adapter son niveau de politesse et son vocabulaire.
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-border/40">
                  <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ListChecks className="size-3.5 text-primary" /> Instructions spécifiques et consignes
                  </Label>
                  
                  <TagInput
                    id="agent-instructions"
                    value={settings.instructions}
                    onChange={(v) => {
                      setSettings((s) => ({ ...s, instructions: v }))
                      save({ instructions: v })
                    }}
                    placeholder="Tapez une instruction puis appuyez sur Entrée..."
                  />

                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">Recommandations fréquentes :</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Toujours saluer le client',
                        'Ne jamais donner de réductions',
                        'Répondre en darija',
                        'Proposer la livraison express',
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
                  <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Connaissances enregistrées</p>
                  
                  {faqs.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center rounded-2xl border border-dashed border-border bg-muted/10">
                      <BookOpen className="size-10 text-muted-foreground/40 stroke-[1.25]" />
                      <div>
                        <p className="text-sm font-bold text-foreground">Aucune connaissance personnalisée</p>
                        <p className="text-xs text-muted-foreground/80 max-w-[40ch] leading-relaxed mt-1">
                          Ajoutez des questions fréquentes (tarifs, livraison, retours) pour que l&apos;IA y réponde de manière fiable.
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
                                  placeholder="Question"
                                  className="text-xs font-bold rounded-lg border-border"
                                />
                                <Textarea
                                  rows={2}
                                  value={faq.answer}
                                  onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                                  placeholder="Réponse de l'IA"
                                  className="resize-none text-xs rounded-lg border-border"
                                />
                                <div className="flex gap-1.5 justify-end">
                                  <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2" onClick={() => setEditingFaqIdx(null)}>
                                    Annuler
                                  </Button>
                                  <Button size="sm" className="h-7 text-[10px] px-2.5" onClick={saveFaq} disabled={saving}>
                                    <CheckCircle2 className="size-3 mr-1" /> Enregistrer
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
                                    aria-label="Modifier"
                                  >
                                    <Settings2 className="size-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => removeFaq(idx)}
                                    aria-label="Supprimer"
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
                    <Plus className="size-3.5 text-primary" /> Nouvelle connaissance
                  </p>
                  <div className="space-y-2">
                    <Input
                      value={newFaqQ}
                      onChange={(e) => setNewFaqQ(e.target.value)}
                      placeholder="Ex: Livrez-vous à Alger ?"
                      className="text-xs rounded-xl border-border bg-card"
                    />
                    <Textarea
                      rows={2}
                      value={newFaqA}
                      onChange={(e) => setNewFaqA(e.target.value)}
                      placeholder="Ex: Oui ! Nous livrons dans toutes les wilayas via Yalidine et Zaki Express."
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
                    Ajouter à la base de connaissances
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
                    Par défaut, l&apos;IA collecte les informations standards lors d&apos;un achat (nom du produit, variantes éventuelles, quantité, wilaya, commune et adresse de livraison). Vous pouvez ci-dessous ajouter des champs spécifiques additionnels que l&apos;IA doit impérativement demander.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="agent-infos-to-collect" className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Champs supplémentaires requis</Label>
                  <TagInput
                    id="agent-infos-to-collect"
                    value={settings.infos_to_collect}
                    onChange={(v) => {
                      setSettings((s) => ({ ...s, infos_to_collect: v }))
                      save({ infos_to_collect: v })
                    }}
                    placeholder="Ex: Code promo, Type de peau..."
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70">Suggestions courantes :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Email', 'Identifiant Instagram', 'Code Promo', 'Date de livraison souhaitée', 'Remarques particulières']
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
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/60">Champs requis par défaut (non modifiables) :</p>
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
                    Vos identifiants et clés API sont encryptés de bout en bout (AES-256-GCM) avant d&apos;être enregistrés dans notre base de données. Ils ne sont jamais stockés en clair.
                  </p>
                </div>

                {/* Grid Inputs for Provider / Model */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Fournisseur d&apos;IA</Label>
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
                    <Label htmlFor="ai-model" className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Modèle LLM</Label>
                    <Input
                      id="ai-model"
                      value={settings.ai_model}
                      onChange={(e) => setSettings((s) => ({ ...s, ai_model: e.target.value }))}
                      onBlur={() => save({ ai_model: settings.ai_model })}
                      placeholder={PROVIDER_META[settings.ai_provider]?.defaultModel ?? 'modèle'}
                      className="rounded-xl border-border bg-card shadow-sm h-10 text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* API Key section */}
                <div className="space-y-1.5 pt-3 border-t border-border/40">
                  <Label htmlFor="ai-key" className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Key className="size-3.5 text-primary" /> Clé API
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
                        <><CheckCircle2 className="size-4" /> Sauvegardé</>
                      ) : (
                        <><Save className="size-4" /> Enregistrer</>
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
