'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Sparkles } from 'lucide-react'
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
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-0">
        <SheetHeader className="border-b border-sidebar-border px-4 py-4">
          <SheetTitle
            render={
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5"
                onClick={() => setOpen(false)}
              />
            }
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <Sparkles className="size-4 text-sidebar-primary-foreground" strokeWidth={2.4} />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-sidebar-foreground">
              Sayniir
            </span>
          </SheetTitle>
        </SheetHeader>

        <nav className="space-y-5 overflow-y-auto px-3 py-4">
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
                      onClick={() => setOpen(false)}
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
      </SheetContent>
    </Sheet>
  )
}
