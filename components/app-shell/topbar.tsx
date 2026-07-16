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
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/95 px-3 shadow-sm backdrop-blur-sm md:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav businessType={businessType} />
        <Breadcrumb businessType={businessType} />
      </div>

      <div className="flex items-center gap-0.5 sm:gap-2">
        <CommandMenu businessType={businessType} />
        <div className="mx-0.5 hidden h-5 w-px bg-border md:block" />
        <ThemeToggle />
        <NotificationsMenu counts={notificationCounts} />
        <UserMenu email={email} />
      </div>
    </header>
  )
}
