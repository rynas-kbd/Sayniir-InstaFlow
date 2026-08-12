'use client'

import { Sparkles } from 'lucide-react'
import { useCopilot } from '@/components/ai/copilot-provider'
import { MobileNav } from './mobile-nav'
import { Breadcrumb } from './breadcrumb'
import { CommandMenu } from './command-menu'
import { NotificationsMenu, type NotificationCounts } from './notifications-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from './user-menu'
import { AccountSwitcher } from './account-switcher'
import type { BusinessType } from './nav-config'
import type { ActiveAccount } from '@/lib/accounts/active-account'

function CopilotHeaderButton() {
  const { openCopilot } = useCopilot()
  return (
    <button
      type="button"
      onClick={() => openCopilot()}
      className="group relative flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--organic-terracotta)_40%,transparent)] bg-[color-mix(in_srgb,var(--organic-terracotta)_14%,transparent)] px-2.5 py-1 text-xs font-bold text-foreground backdrop-blur-md transition-all active:scale-95 md:hidden shadow-sm hover:shadow-md shrink-0"
      aria-label="Ouvrir le Copilote IA"
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-[var(--organic-terracotta)]/25 via-transparent to-[var(--organic-sage)]/25 blur-xs opacity-70 animate-pulse" />
      <Sparkles className="relative size-3.5 text-[var(--organic-terracotta)]" />
      <span className="relative font-black text-[11px] uppercase tracking-wider text-[var(--organic-terracotta-700)] dark:text-[var(--organic-terracotta-300)]">
        Copilote
      </span>
    </button>
  )
}

export function Topbar({
  businessType,
  email,
  notificationCounts,
  accounts,
  activeAccountId,
  accountScope = 'single',
}: {
  businessType: BusinessType
  email: string | null
  notificationCounts: NotificationCounts
  accounts: ActiveAccount[]
  activeAccountId: string | null
  accountScope?: 'all' | 'single'
}) {
  return (
    <header className="relative flex min-h-16 shrink-0 items-center justify-between gap-3 bg-[color-mix(in_srgb,var(--organic-bg)_62%,transparent)] px-4 pt-safe pb-2 backdrop-blur-md dark:bg-[color-mix(in_srgb,var(--organic-surface)_52%,transparent)] md:h-14 md:py-0 md:px-4 md:pt-0">
      {/* Bottom border — terracotta gradient line */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--organic-terracotta) 25%, transparent) 30%, color-mix(in srgb, var(--organic-sage) 20%, transparent) 70%, transparent 100%)',
        }}
      />
      {/* Very subtle aurora glow in the center */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-full w-64 -translate-x-1/2 opacity-[0.04]"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, var(--organic-terracotta), transparent 70%)' }}
      />

      <div className="relative flex min-w-0 items-center gap-3">
        {/* Hide MobileNav drawer toggle because we have bottom bar now */}
        <div className="hidden">
          <MobileNav businessType={businessType} />
        </div>
        {activeAccountId && accounts.length > 1 && (
          <>
            <AccountSwitcher accounts={accounts} activeId={activeAccountId} scope={accountScope} />
            <div className="mx-0.5 hidden h-5 w-px bg-[color-mix(in_srgb,var(--organic-sand-400)_40%,transparent)] md:block" />
          </>
        )}
        <Breadcrumb businessType={businessType} />
      </div>

      <div className="relative flex items-center gap-1 sm:gap-2">
        <CopilotHeaderButton />
        <CommandMenu businessType={businessType} />
        <div className="mx-0.5 hidden h-5 w-px bg-[color-mix(in_srgb,var(--organic-sand-400)_40%,transparent)] md:block" />
        <ThemeToggle />
        <NotificationsMenu counts={notificationCounts} />
        <UserMenu email={email} />
      </div>
    </header>
  )
}
