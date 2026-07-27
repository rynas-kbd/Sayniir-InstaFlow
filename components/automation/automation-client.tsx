'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Zap, Plus, MessageSquare, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { StatCard } from '@/components/dashboard/stat-card'
import { RuleFormDialog } from './rule-form-dialog'
import { RuleCard } from './rule-card'
import type { AutomationRule, ChannelAccountLite, RuleFormPayload } from './types'

export function AutomationClient({
  accounts,
  initialRules,
}: {
  accounts: ChannelAccountLite[]
  initialRules: AutomationRule[]
}) {
  const [rules, setRules] = useState<AutomationRule[]>(initialRules)
  const [editingRule, setEditingRule] = useState<AutomationRule | undefined>(undefined)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'dm' | 'comment'>('dm')
  const [, startTabTransition] = useTransition()

  const filteredRules = rules.filter((r) =>
    activeTab === 'dm' ? ['any_message', 'keyword'].includes(r.trigger_type) : ['any_comment', 'comment_keyword'].includes(r.trigger_type)
  )

  async function handleUpdate(data: RuleFormPayload) {
    if (!editingRule) return
    const res = await fetch(`/api/rules/${editingRule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erreur')
    const updated: AutomationRule = await res.json()
    setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    setEditingRule(undefined)
  }

  async function handleToggle(rule: AutomationRule) {
    setBusyId(rule.id)
    try {
      const res = await fetch(`/api/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !rule.is_active }),
      })
      if (!res.ok) throw new Error('Toggle request failed')
      const updated: AutomationRule = await res.json()
      setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      toast.success(updated.is_active ? '✅ Règle activée' : '⏸️ Règle désactivée')
    } catch {
      toast.error('Impossible de modifier la règle')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    setBusyId(`${id}_del`)
    try {
      const res = await fetch(`/api/rules/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete request failed')
      setRules((prev) => prev.filter((r) => r.id !== id))
      toast.success('🗑️ Règle supprimée')
    } catch {
      toast.error('Impossible de supprimer la règle')
    } finally {
      setBusyId(null)
    }
  }

  const dmCount = rules.filter((r) => ['any_message', 'keyword'].includes(r.trigger_type)).length
  const commentCount = rules.filter((r) => ['any_comment', 'comment_keyword'].includes(r.trigger_type)).length
  const activeCount = rules.filter((r) => r.is_active).length

  return (
    <div className="mx-auto w-full max-w-6xl p-4 pb-16 sm:p-6">
      {editingRule && (
        <RuleFormDialog
          open
          accounts={accounts}
          rule={editingRule}
          defaultTab={activeTab}
          onSave={handleUpdate}
          onClose={() => setEditingRule(undefined)}
        />
      )}

      {/* Stats Header Summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard title="Règles totales" value={rules.length} />
        <StatCard title="Règles actives" value={activeCount} />
        <StatCard title="Automatisations DM" value={dmCount} />
        <StatCard title="Commentaires" value={commentCount} />
      </div>

      {/* Tab switcher */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex rounded-xl border border-border/40 bg-muted/50 p-0.5">
          {/* Animated sliding indicator */}
          <div
            className="absolute top-0.5 bottom-0.5 rounded-lg bg-background shadow-sm transition-all duration-300 ease-out"
            style={{
              width: 'calc(50% - 2px)',
              left: activeTab === 'dm' ? '2px' : 'calc(50%)',
            }}
          />
          {[
            { key: 'dm' as const, label: `Messages privés`, count: dmCount, icon: MessageSquare },
            { key: 'comment' as const, label: `Commentaires`, count: commentCount, icon: Hash },
          ].map(({ key, label, count, icon: Icon }) => (
            <button
              key={key}
              onClick={() => startTabTransition(() => setActiveTab(key))}
              className="relative z-10 flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors duration-200"
              style={{
                color: activeTab === key ? 'var(--foreground)' : 'color-mix(in srgb, var(--foreground) 45%, transparent)',
              }}
            >
              <Icon className="size-3.5" />
              {label}
              <span
                className="ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                style={{
                  background: activeTab === key ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'var(--muted)',
                  color: activeTab === key ? 'var(--color-primary)' : 'color-mix(in srgb, var(--foreground) 40%, transparent)',
                }}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
        {accounts.length > 0 && (
          <Button render={<Link href={`/automation/new?tab=${activeTab}`} />}>
            <Plus className="size-4" /> Nouvelle règle
          </Button>
        )}
      </div>

      {/* Animated content area — key forces remount + CSS animation on tab switch */}
      <div
        key={activeTab}
        className="animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        {accounts.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="Aucun compte connecté"
            description="Connectez d'abord un compte pour créer des règles d'automatisation."
          />
        ) : filteredRules.length === 0 ? (
          <EmptyState
            icon={activeTab === 'dm' ? MessageSquare : Hash}
            title={`Aucune règle ${activeTab === 'dm' ? 'DM' : 'commentaire'} configurée`}
            description={`Créez votre première règle pour automatiser les réponses ${activeTab === 'dm' ? 'aux messages privés' : 'aux commentaires'}.`}
            action={
              <Button render={<Link href={`/automation/new?tab=${activeTab}`} />}>
                <Plus className="size-4" /> Créer ma première règle
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                isToggling={busyId === rule.id}
                isDeleting={busyId === `${rule.id}_del`}
                onToggle={() => handleToggle(rule)}
                onEdit={() => setEditingRule(rule)}
                onDelete={() => handleDelete(rule.id)}
              />
            ))}

            {/* Create new rule card button in the grid */}
            <Link
              href={`/automation/new?tab=${activeTab}`}
              className="group flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-transparent text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/4 hover:text-primary"
            >
              <div className="flex size-10 items-center justify-center rounded-xl border border-dashed border-current/30 transition-colors group-hover:border-primary/40 group-hover:bg-primary/8">
                <Plus className="size-5" />
              </div>
              <span className="text-sm font-medium">Nouvelle règle</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
