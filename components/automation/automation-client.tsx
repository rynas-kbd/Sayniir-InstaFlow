'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Zap, Plus, MessageSquare, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { StatCard } from '@/components/dashboard/stat-card'
import { RuleFormDialog } from './rule-form-dialog'
import { RuleRow } from './rule-row'
import type { AutomationRule, ChannelAccountLite, RuleFormPayload } from './types'

export function AutomationClient({
  accounts,
  initialRules,
}: {
  accounts: ChannelAccountLite[]
  initialRules: AutomationRule[]
}) {
  const [rules, setRules] = useState<AutomationRule[]>(initialRules)
  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | undefined>(undefined)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'dm' | 'comment'>('dm')

  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]))

  const filteredRules = rules.filter((r) =>
    activeTab === 'dm' ? ['any_message', 'keyword'].includes(r.trigger_type) : ['any_comment', 'comment_keyword'].includes(r.trigger_type)
  )

  async function handleCreate(data: RuleFormPayload) {
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Erreur')
    const newRule: AutomationRule = await res.json()
    setRules((prev) => [newRule, ...prev])
  }

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
      toast.success(updated.is_active ? 'Règle activée' : 'Règle désactivée')
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
      toast.success('Règle supprimée')
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
    <div className="mx-auto max-w-4xl p-4 pb-16 sm:p-6">
      {(showModal || editingRule) && (
        <RuleFormDialog
          open
          accounts={accounts}
          rule={editingRule}
          defaultTab={activeTab}
          onSave={editingRule ? handleUpdate : handleCreate}
          onClose={() => {
            setShowModal(false)
            setEditingRule(undefined)
          }}
        />
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard title="Règles totales" value={rules.length} />
        <StatCard title="Actives" value={activeCount} />
        <StatCard title="Règles DM" value={dmCount} />
        <StatCard title="Commentaires" value={commentCount} />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'dm' | 'comment')}>
          <TabsList>
            <TabsTrigger value="dm">Messages privés ({dmCount})</TabsTrigger>
            <TabsTrigger value="comment">Commentaires ({commentCount})</TabsTrigger>
          </TabsList>
        </Tabs>
        {accounts.length > 0 && (
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="size-3.5" /> Nouvelle règle
          </Button>
        )}
      </div>

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
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus className="size-3.5" /> Créer ma première règle
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-card">
          {filteredRules.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              account={accountMap[rule.channel_account_id]}
              isToggling={busyId === rule.id}
              isDeleting={busyId === `${rule.id}_del`}
              onToggle={() => handleToggle(rule)}
              onEdit={() => setEditingRule(rule)}
              onDelete={() => handleDelete(rule.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
