'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/admin', label: 'Vue d’ensemble', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Utilisateurs', icon: Users },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <>
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
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
    </>
  )
}
