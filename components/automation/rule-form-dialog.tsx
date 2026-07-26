'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RuleFormFields } from './rule-form-fields'
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
  const [postSelectorActive, setPostSelectorActive] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[560px]">
        {!postSelectorActive && (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Zap className="size-3.5" strokeWidth={2} />
              </div>
              {rule ? 'Modifier la règle' : 'Nouvelle règle'}
            </DialogTitle>
          </DialogHeader>
        )}
        <RuleFormFields
          accounts={accounts}
          rule={rule}
          defaultTab={defaultTab}
          onSave={onSave}
          onSaved={onClose}
          onCancel={onClose}
          onPostSelectorToggle={setPostSelectorActive}
        />
      </DialogContent>
    </Dialog>
  )
}
