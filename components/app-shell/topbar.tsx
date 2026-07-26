import { MobileNav } from './mobile-nav'
import { Breadcrumb } from './breadcrumb'
import { CommandMenu } from './command-menu'
import { NotificationsMenu, type NotificationCounts } from './notifications-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from './user-menu'
import type { BusinessType } from './nav-config'

export function Topbar({
  businessType,
  email,
  notificationCounts,
}: {
  businessType: BusinessType
  email: string | null
  notificationCounts: NotificationCounts
}) {
  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between gap-3 bg-[color-mix(in_srgb,var(--organic-bg)_62%,transparent)] px-3 backdrop-blur-md dark:bg-[color-mix(in_srgb,var(--organic-surface)_52%,transparent)] md:px-4">
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
        <MobileNav businessType={businessType} />
        <Breadcrumb businessType={businessType} />
      </div>

      <div className="relative flex items-center gap-0.5 sm:gap-2">
        <CommandMenu businessType={businessType} />
        <div className="mx-0.5 hidden h-5 w-px bg-[color-mix(in_srgb,var(--organic-sand-400)_40%,transparent)] md:block" />
        <ThemeToggle />
        <NotificationsMenu counts={notificationCounts} />
        <UserMenu email={email} />
      </div>
    </header>
  )
}
