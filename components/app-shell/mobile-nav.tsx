'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { getNavSections, type BusinessType } from './nav-config'

export function MobileNav({ businessType }: { businessType: BusinessType }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const sections = getNavSections(businessType)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Ouvrir la navigation" />}
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[264px] bg-sidebar p-0">
        <SheetHeader className="border-b border-sidebar-border px-4 py-3.5">
          <SheetTitle
            render={
              <Link
                href="/dashboard"
                className="text-[13px] font-semibold tracking-tight text-sidebar-foreground"
                onClick={() => setOpen(false)}
              />
            }
          >
            Sayniir
          </SheetTitle>
        </SheetHeader>

        <nav className="space-y-5 overflow-y-auto px-3 py-4">
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
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex h-8 items-center gap-2 rounded-md px-2 text-[13px] transition-colors',
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
      </SheetContent>
    </Sheet>
  )
}
