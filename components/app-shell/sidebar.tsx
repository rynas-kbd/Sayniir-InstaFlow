'use client'

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getNavSections, type BusinessType } from './nav-config'

export function AppSidebar({ businessType }: { businessType: BusinessType }) {
  const pathname = usePathname()
  const sections = getNavSections(businessType)

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 pt-4 pb-3 md:flex">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="mb-6 flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2 transition-colors hover:bg-sidebar-accent/60"
      >
        <div className="flex size-5 items-center justify-center rounded-md bg-primary">
          <MessageCircle className="size-3 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">Sayniir</span>
      </Link>

      <nav className="flex-1 space-y-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
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
                      'flex h-8 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm transition-all',
                      isActive
                        ? 'bg-sidebar-accent font-medium text-sidebar-foreground shadow-sm'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    <Icon
                      className={cn(
                        'size-3.5 shrink-0 transition-colors',
                        isActive ? 'text-primary' : 'text-sidebar-foreground/40'
                      )}
                      strokeWidth={isActive ? 2 : 1.75}
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
