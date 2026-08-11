'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
} from '@/components/ui/responsive-dialog'
import { FormDialogHeader } from '@/components/shared/form-section'
import { FormFooter } from '@/components/shared/form-footer'
import { useRuleForm } from './rule-form/use-rule-form'
import { RuleFormBody } from './rule-form/rule-form-body'
import type { AutomationRule, ChannelAccountLite, RuleFormPayload } from './types'

export function RuleFormDialog({
  open,
  accounts,
  rule,
  defaultTab,
  onSave,
  onClose,
}: {
  open: boolean
  accounts: ChannelAccountLite[]
  rule?: AutomationRule
  defaultTab: 'dm' | 'comment'
  onSave: (data: RuleFormPayload) => Promise<void>
  onClose: () => void
}) {
  const api = useRuleForm({ accounts, rule, defaultTab, onSave, onSaved: onClose })
  const [postSelectorActive, setPostSelectorActive] = useState(false)

  return (
    <ResponsiveDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <ResponsiveDialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        {!postSelectorActive && (
          <ResponsiveDialogHeader className="shrink-0 border-b border-border bg-card/60 px-5 py-4 pr-12 backdrop-blur-sm">
            <FormDialogHeader
              icon={Zap}
              title={rule ? 'Modifier la règle' : 'Nouvelle règle'}
              description="Réponse automatique par mot-clé, DM ou commentaire."
            />
          </ResponsiveDialogHeader>
        )}

        <form onSubmit={api.submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <RuleFormBody api={api} onPostSelectorToggle={setPostSelectorActive} />
          </div>
          {/* PostSelector renders its own Annuler/Valider row — no duplicate footer while it's active. */}
          {!postSelectorActive && (
            <FormFooter
              saving={api.saving}
              submitLabel={rule ? 'Sauvegarder' : 'Créer'}
              onCancel={onClose}
              className="shrink-0 justify-end border-t border-border bg-muted/40 px-5 py-3"
            />
          )}
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
