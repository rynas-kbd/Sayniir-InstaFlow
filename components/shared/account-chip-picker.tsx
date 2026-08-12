'use client'

import { getAccountLabel, PLATFORM_ICON } from '@/lib/channels/labels'
import { cn } from '@/lib/utils'
import type { Platform } from '@/lib/channels/types'

/** The minimal account shape getAccountLabel()/PLATFORM_ICON need — matches lib/accounts/active-account.ts::ActiveAccount. */
export interface PickableAccount {
  id: string
  platform: Platform
  page_name: string | null
  instagram_username: string | null
  phone_number: string | null
}

/**
 * Multi-select toggle-chip account picker — the shared "attach this to
 * several of my accounts" UI for flows (PUT /api/flows/[id]/accounts),
 * automation rules (target_account_ids), and campaign duplication
 * (POST /api/campaigns/[id]/duplicate). Modeled on the tag chip-toggle in
 * components/campaigns/campaign-form/audience-picker.tsx:85-106, the
 * existing multi-select idiom in this codebase.
 */
export function AccountChipPicker({
  accounts,
  selectedIds,
  onToggle,
  disabledIds = [],
}: {
  accounts: PickableAccount[]
  selectedIds: string[]
  onToggle: (accountId: string) => void
  /** e.g. a flow/rule's owner account — rendered checked and non-interactive, can't be removed this way. */
  disabledIds?: string[]
}) {
  if (accounts.length === 0) {
    return <p className="text-xs text-muted-foreground">Aucun autre compte connecté.</p>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {accounts.map((account) => {
        const Icon = PLATFORM_ICON[account.platform]
        const selected = selectedIds.includes(account.id) || disabledIds.includes(account.id)
        const isDisabled = disabledIds.includes(account.id)
        return (
          <button
            key={account.id}
            type="button"
            aria-pressed={selected}
            disabled={isDisabled}
            onClick={() => onToggle(account.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              selected
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground',
              isDisabled ? 'cursor-default opacity-70' : 'cursor-pointer'
            )}
          >
            <Icon className="size-3" strokeWidth={1.75} />
            {getAccountLabel(account)}
          </button>
        )
      })}
    </div>
  )
}
