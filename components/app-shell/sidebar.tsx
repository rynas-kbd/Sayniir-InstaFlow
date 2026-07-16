'use client'

import Link from 'next/link'
import { MessageCircle, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { getNavSections, type BusinessType } from './nav-config'

export function AppSidebar({ businessType }: { businessType: BusinessType }) {
  const pathname = usePathname()
  const sections = getNavSections(businessType)
  const { collapsed, toggle } = useSidebarStore()

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 pt-4 pb-3 transition-[width] duration-200 md:flex',
        collapsed ? 'w-[68px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        title="Sayniir"
        className={cn(
          'mb-6 flex h-9 cursor-pointer items-center gap-2 rounded-lg transition-colors hover:bg-sidebar-accent/60',
          collapsed ? 'justify-center px-0' : 'px-2'
        )}
      >
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70 shadow-sm shadow-primary/30">
          <MessageCircle className="size-3.5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        {!collapsed && <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">Sayniir</span>}
      </Link>

      <nav className="flex-1 space-y-5 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/35">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'relative flex h-8 cursor-pointer items-center gap-2.5 rounded-lg text-sm transition-all',
                      collapsed ? 'justify-center px-0' : 'px-2.5',
                      isActive
                        ? 'bg-sidebar-accent font-medium text-sidebar-foreground'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    {isActive && (
                      <span className="absolute -left-3 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                    )}
                    <Icon
                      className={cn(
                        'size-3.5 shrink-0 transition-colors',
                        isActive ? 'text-primary' : 'text-sidebar-foreground/40'
                      )}
                      strokeWidth={isActive ? 2 : 1.75}
                    />
                    {!collapsed && label}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <button
        type="button"
        onClick={toggle}
        title={collapsed ? 'Étendre la sidebar' : 'Réduire la sidebar'}
        className={cn(
          'mt-2 flex h-8 cursor-pointer items-center gap-2 rounded-lg text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
          collapsed ? 'justify-center px-0' : 'px-2.5'
        )}
      >
        {collapsed ? <ChevronsRight className="size-3.5" strokeWidth={1.75} /> : <ChevronsLeft className="size-3.5" strokeWidth={1.75} />}
        {!collapsed && <span className="text-xs">Réduire</span>}
      </button>
    </aside>
  )
}
