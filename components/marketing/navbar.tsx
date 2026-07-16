'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, MessageCircle, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader, SheetFooter } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/fonctionnalites', label: 'Fonctionnalités' },
  { href: '/pricing', label: 'Tarifs' },
  { href: '/faq', label: 'FAQ' },
]

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary">
            <MessageCircle className="size-3.5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold tracking-tight">Sayniir</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/login" />} className="cursor-pointer">
            Se connecter
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/register" />} className="cursor-pointer">
            Commencer <ArrowRight className="ml-1 size-3" />
          </Button>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Ouvrir le menu" />}
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <SheetHeader className="border-b border-border px-4 py-3.5">
              <SheetTitle
                render={
                  <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)} />
                }
              >
                <div className="flex size-6 items-center justify-center rounded-md bg-primary">
                  <MessageCircle className="size-3.5 text-primary-foreground" strokeWidth={2.5} />
                </div>
                <span className="text-sm font-semibold tracking-tight">Sayniir</span>
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-1 px-3 py-4">
              {NAV_LINKS.map(({ href, label }) => {
                const isActive = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex h-10 items-center rounded-md px-3 text-sm transition-colors',
                      isActive ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>

            <SheetFooter className="border-t border-border">
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/login" onClick={() => setOpen(false)} />}
                className="cursor-pointer"
              >
                Se connecter
              </Button>
              <Button nativeButton={false} render={<Link href="/register" onClick={() => setOpen(false)} />} className="cursor-pointer">
                Commencer <ArrowRight className="ml-1 size-3" />
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
