'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Sparkles } from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { useCopilot } from '@/components/ai/copilot-provider'
import { getNavSections, type BusinessType } from './nav-config'

export function CommandMenu({ businessType }: { businessType: BusinessType }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()
  const { openCopilot } = useCopilot()
  const sections = getNavSections(businessType)
  const hasNavMatch = sections.some((s) =>
    s.items.some((i) => i.label.toLowerCase().includes(search.trim().toLowerCase()))
  )

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
    setSearch('')
    router.push(href)
  }

  function askCopilot() {
    const prompt = search.trim()
    setOpen(false)
    setSearch('')
    openCopilot(prompt)
  }

  return (
    <>
      {/* Mobile: icon-only trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Rechercher"
        className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:text-foreground md:hidden"
        style={{
          background: 'color-mix(in srgb, var(--organic-sand-300) 18%, transparent)',
        }}
      >
        <Search className="size-4" strokeWidth={1.75} />
      </button>

      {/* Desktop: premium organic search pill */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group hidden h-8 w-60 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-xs text-muted-foreground transition-all duration-200 md:flex"
        style={{
          background: 'color-mix(in srgb, var(--organic-sand-300) 14%, transparent)',
          border: '1px solid color-mix(in srgb, var(--organic-sand-400) 30%, transparent)',
          boxShadow: '0 1px 0 0 color-mix(in srgb, white 30%, transparent) inset',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.background =
            'color-mix(in srgb, var(--organic-sand-300) 24%, transparent)'
          ;(e.currentTarget as HTMLElement).style.borderColor =
            'color-mix(in srgb, var(--organic-terracotta) 22%, transparent)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.background =
            'color-mix(in srgb, var(--organic-sand-300) 14%, transparent)'
          ;(e.currentTarget as HTMLElement).style.borderColor =
            'color-mix(in srgb, var(--organic-sand-400) 30%, transparent)'
        }}
      >
        <Search className="size-3.5 shrink-0 opacity-60" strokeWidth={1.75} />
        <span className="flex-1 text-left opacity-60">Rechercher…</span>
        <kbd
          className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium opacity-50"
          style={{
            background: 'color-mix(in srgb, var(--organic-bg) 70%, transparent)',
            border: '1px solid color-mix(in srgb, var(--organic-sand-400) 35%, transparent)',
          }}
        >
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Navigation" description="Aller à une page">
        <CommandInput placeholder="Aller à… ou demander au copilote" value={search} onValueChange={setSearch} />
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
          {search.trim().length > 0 && !hasNavMatch && (
            <CommandGroup heading="Actions">
              <CommandItem value={`copilot-${search}`} onSelect={askCopilot}>
                <Sparkles className="size-4 text-primary" strokeWidth={1.75} />
                Demander au copilote : « {search.trim()} »
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
