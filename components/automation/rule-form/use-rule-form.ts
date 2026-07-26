'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { emptyForm, validateRuleForm, buildRulePayload, deriveFlags, FIELD_IDS } from './rule-form-schema'
import type { AutomationRule, ChannelAccountLite, RuleFormPayload } from '../types'
import type { RuleFormApi, RuleFormErrors, RuleFormField, RuleFormState } from './types'

export interface UseRuleFormOptions {
  accounts: ChannelAccountLite[]
  rule?: AutomationRule
  defaultTab: 'dm' | 'comment'
  onSave: (data: RuleFormPayload) => Promise<void>
  onSaved?: () => void
}

/** Owns the rule form's state, per-field error lifecycle, and submit flow — same shape as the
 * boutique product form's `useProductForm`, plus the defaultTab-dependent account filtering and
 * isDmCapable/isCard flags the rule form needs. */
export function useRuleForm({ accounts, rule, defaultTab, onSave, onSaved }: UseRuleFormOptions): RuleFormApi {
  const selectableAccounts = defaultTab === 'comment' ? accounts.filter((a) => (a.platform ?? 'instagram') === 'instagram') : accounts

  const [form, setForm] = useState<RuleFormState>(() => emptyForm(rule, defaultTab, selectableAccounts[0]?.id ?? ''))
  const [errors, setErrors] = useState<RuleFormErrors>({})
  const [saving, setSaving] = useState(false)

  function setField<K extends RuleFormField>(key: K, value: RuleFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors = validateRuleForm(form, defaultTab)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      const firstKey = Object.keys(nextErrors)[0] as RuleFormField
      document.getElementById(FIELD_IDS[firstKey])?.focus()
      toast.error('Vérifiez les champs en rouge')
      return
    }

    setSaving(true)
    try {
      await onSave(buildRulePayload(form, defaultTab))
      toast.success(rule ? 'Règle mise à jour' : 'Règle créée')
      onSaved?.()
    } catch {
      toast.error("Erreur lors de l'enregistrement de la règle")
    } finally {
      setSaving(false)
    }
  }

  const { isDmCapable, isCard } = deriveFlags(form, defaultTab)

  return { form, errors, saving, isEdit: Boolean(rule), defaultTab, selectableAccounts, isDmCapable, isCard, setField, submit }
}
