'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getNavSections, type BusinessType } from './nav-config'

export function AppSidebar({ businessType }: { businessType: BusinessType }) {
  const pathname = usePathname()
  const sections = getNavSections(businessType)

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 md:flex">
      <Link href="/dashboard" className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary">
          <Sparkles className="size-4 text-sidebar-primary-foreground" strokeWidth={2.4} />
        </div>
        <span className="text-[15px] font-bold tracking-tight text-sidebar-foreground">
          Sayniir
        </span>
      </Link>

      <nav className="flex-1 space-y-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
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
