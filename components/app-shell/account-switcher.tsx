'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Check, ChevronDown, Layers, Plus } from 'lucide-react'
import { setActiveAccount } from '@/lib/accounts/actions'
import { getAccountLabel, PLATFORM_ICON, PLATFORM_LABEL } from '@/lib/channels/labels'
import { getAvatarColor } from '@/lib/avatar-color'
import { ALL_ACCOUNTS_SCOPE } from '@/lib/accounts/select-active-account'
import type { ActiveAccount } from '@/lib/accounts/active-account'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Global account switcher mounted in the topbar. Every page in app/(app)
 * scopes its queries to whichever account is active (see
 * lib/accounts/active-account.ts) — this is the only place that account
 * changes. Renders nothing when the user has a single account, since there
 * is nothing to switch between. `scope: 'all'` selects the unified
 * cross-channel inbox (Phase 2) instead of one specific account.
 */
export function AccountSwitcher({
  accounts,
  activeId,
  scope = 'single',
}: {
  accounts: ActiveAccount[]
  activeId: string
  scope?: 'all' | 'single'
}) {
  const [isPending, startTransition] = useTransition()

  if (accounts.length <= 1) return null

  const active = accounts.find((a) => a.id === activeId) ?? accounts[0]
  const isAllScope = scope === 'all'
  const ActiveIcon = PLATFORM_ICON[active.platform]

  function handleSelect(accountId: string) {
    if (!isAllScope && accountId === active.id) return
    if (isAllScope && accountId === ALL_ACCOUNTS_SCOPE) return
    startTransition(() => {
      void setActiveAccount(accountId)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex min-w-0 cursor-pointer items-center gap-1.5 rounded-xl px-2 py-1.5 outline-none transition-all duration-200 active:scale-95 disabled:opacity-60"
        style={{ background: 'color-mix(in srgb, var(--organic-sand-300) 0%, transparent)' }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.background =
            'color-mix(in srgb, var(--organic-sand-300) 18%, transparent)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.background =
            'color-mix(in srgb, var(--organic-sand-300) 0%, transparent)'
        }}
        disabled={isPending}
        aria-label="Changer de compte"
      >
        <div className={`flex size-6 shrink-0 items-center justify-center rounded-full ${getAvatarColor(isAllScope ? 'all' : active.id)}`}>
          {isAllScope ? <Layers className="size-3" strokeWidth={1.75} /> : <ActiveIcon className="size-3" strokeWidth={1.75} />}
        </div>
        <span className="hidden max-w-[120px] truncate text-[12.5px] font-medium text-foreground/80 sm:block">
          {isAllScope ? 'Tous les canaux' : getAccountLabel(active)}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-64 overflow-hidden rounded-2xl border-0 p-0 shadow-xl"
        style={{
          background: 'color-mix(in srgb, var(--organic-bg) 80%, transparent)',
          backdropFilter: 'blur(24px) saturate(1.8)',
          border: '1px solid color-mix(in srgb, var(--organic-sand-300) 40%, transparent)',
          boxShadow:
            '0 8px 32px color-mix(in srgb, var(--organic-terracotta) 8%, transparent), 0 1px 0 color-mix(in srgb, white 40%, transparent) inset',
        }}
      >
        <div className="p-1.5">
          <DropdownMenuItem
            onClick={() => handleSelect(ALL_ACCOUNTS_SCOPE)}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150"
          >
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--organic-terracotta)_15%,transparent)]">
              <Layers className="size-3.5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-foreground">Tous les canaux</p>
              <p className="truncate text-[11px] text-muted-foreground">Boîte de réception unifiée</p>
            </div>
            {isAllScope && <Check className="size-4 shrink-0 text-primary" />}
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator
          className="mx-1 my-0"
          style={{ background: 'color-mix(in srgb, var(--organic-sand-300) 30%, transparent)' }}
        />

        <div className="p-1.5">
          {accounts.map((account) => {
            const Icon = PLATFORM_ICON[account.platform]
            const isActive = !isAllScope && account.id === active.id
            return (
              <DropdownMenuItem
                key={account.id}
                onClick={() => handleSelect(account.id)}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150"
              >
                <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${getAvatarColor(account.id)}`}>
                  <Icon className="size-3.5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-foreground">{getAccountLabel(account)}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {PLATFORM_LABEL[account.platform]}
                    {!account.is_active && ' · Inactif'}
                  </p>
                </div>
                {isActive && <Check className="size-4 shrink-0 text-primary" />}
              </DropdownMenuItem>
            )
          })}
        </div>

        <DropdownMenuSeparator
          className="mx-1 my-0"
          style={{ background: 'color-mix(in srgb, var(--organic-sand-300) 30%, transparent)' }}
        />

        <div className="p-1.5">
          <DropdownMenuItem
            render={<Link href="/accounts" />}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-muted-foreground transition-all duration-150"
          >
            <div
              className="flex size-7 items-center justify-center rounded-lg"
              style={{ background: 'color-mix(in srgb, var(--organic-sand-400) 15%, transparent)' }}
            >
              <Plus className="size-3.5" strokeWidth={1.75} />
            </div>
            Connecter un compte
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
