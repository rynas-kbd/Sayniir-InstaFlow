'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { getNavSections, type BusinessType } from './nav-config'

export function CommandMenu({ businessType }: { businessType: BusinessType }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const sections = getNavSections(businessType)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      {/* Mobile: icon-only trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Rechercher"
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
      >
        <Search className="size-4" strokeWidth={1.75} />
      </button>

      {/* Desktop: full search field */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-8 w-56 cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 text-xs text-muted-foreground transition-colors hover:border-border/80 hover:bg-muted/70 md:flex"
      >
        <Search className="size-3.5 shrink-0" strokeWidth={1.75} />
        <span className="flex-1 text-left">Rechercher…</span>
        <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/70">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Navigation" description="Aller à une page">
        <CommandInput placeholder="Aller à…" />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          {sections.map((section) => (
            <CommandGroup key={section.label} heading={section.label}>
              {section.items.map(({ href, label, icon: Icon }) => (
                <CommandItem key={href} value={label} onSelect={() => go(href)}>
                  <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
                  {label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
