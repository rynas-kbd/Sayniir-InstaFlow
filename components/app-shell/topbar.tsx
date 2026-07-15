import { MobileNav } from './mobile-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from './user-menu'
import type { BusinessType } from './nav-config'

export function Topbar({
  businessType,
  email,
}: {
  businessType: BusinessType
  email: string | null
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 md:px-6">
      <MobileNav businessType={businessType} />
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <UserMenu email={email} />
      </div>
    </header>
  )
}
