'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { emptyForm, validateCampaignForm, buildCampaignPayload, FIELD_IDS } from './campaign-form-schema'
import type { Campaign } from '../types'
import type { CampaignFormApi, CampaignFormErrors, CampaignFormField, CampaignFormState } from './types'

export interface UseCampaignFormOptions {
  channelAccountId: string
  campaign?: Campaign
  onSave: (data: Partial<Campaign> & { channel_account_id: string }) => Promise<void>
  onSaved?: () => void
}

/** Owns the campaign form's state, per-field error lifecycle, and submit flow — same shape as the
 * boutique product form's `useProductForm`. */
export function useCampaignForm({ channelAccountId, campaign, onSave, onSaved }: UseCampaignFormOptions): CampaignFormApi {
  const [form, setForm] = useState<CampaignFormState>(() => emptyForm(campaign))
  const [errors, setErrors] = useState<CampaignFormErrors>({})
  const [saving, setSaving] = useState(false)

  function setField<K extends CampaignFormField>(key: K, value: CampaignFormState[K]) {
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
    const nextErrors = validateCampaignForm(form)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      const firstKey = Object.keys(nextErrors)[0] as CampaignFormField
      document.getElementById(FIELD_IDS[firstKey])?.focus()
      toast.error('Vérifiez les champs en rouge')
      return
    }

    setSaving(true)
    try {
      await onSave(buildCampaignPayload(form, channelAccountId))
      toast.success(campaign ? 'Campagne mise à jour' : 'Campagne créée')
      onSaved?.()
    } catch {
      toast.error("Erreur lors de l'enregistrement de la campagne")
    } finally {
      setSaving(false)
    }
  }

  return { form, errors, saving, isEdit: Boolean(campaign), channelAccountId, setField, submit }
}
