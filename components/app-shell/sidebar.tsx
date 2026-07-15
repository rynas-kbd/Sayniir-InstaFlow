'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getNavSections, type BusinessType } from './nav-config'

export function AppSidebar({ businessType }: { businessType: BusinessType }) {
  const pathname = usePathname()
  const sections = getNavSections(businessType)

  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 pt-4 pb-3 md:flex">
      <Link
        href="/dashboard"
        className="mb-5 flex h-8 items-center rounded-md px-2 text-[13px] font-semibold tracking-tight text-sidebar-foreground hover:bg-sidebar-accent/60"
      >
        Sayniir
      </Link>

      <nav className="flex-1 space-y-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-1 px-2 text-[11px] font-medium text-sidebar-foreground/45">{section.label}</p>
            <div className="space-y-px">
              {section.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex h-7 items-center gap-2 rounded-md px-2 text-[13px] transition-colors',
                      isActive
                        ? 'bg-sidebar-accent font-medium text-sidebar-foreground'
                        : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    <Icon
                      className={cn('size-3.5 shrink-0', isActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/45')}
                      strokeWidth={1.75}
                    />
                    {label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
