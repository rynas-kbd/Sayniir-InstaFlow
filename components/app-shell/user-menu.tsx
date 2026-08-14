'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Palette, Settings } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ThemeCustomizerModal } from '@/components/theme-customizer-modal'
import { useT } from '@/components/i18n-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function UserMenu({ email }: { email: string | null }) {
  const router = useRouter()
  const t = useT()
  const [themeModalOpen, setThemeModalOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initial = email?.[0]?.toUpperCase() ?? '?'
  // Derive a short display name from the email
  const displayName = email ? email.split('@')[0] : t('nav.userMenu.defaultName')

  return (
    <>
      <ThemeCustomizerModal open={themeModalOpen} onOpenChange={setThemeModalOpen} />

      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 outline-none transition-all duration-200 active:scale-95"
          style={{
            background: 'color-mix(in srgb, var(--organic-sand-300) 0%, transparent)',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLElement).style.background =
              'color-mix(in srgb, var(--organic-sand-300) 18%, transparent)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLElement).style.background =
              'color-mix(in srgb, var(--organic-sand-300) 0%, transparent)'
          }}
          aria-label={t('nav.userMenu.ariaLabel')}
        >
          {/* Avatar circle */}
          <div
            className="flex size-9 sm:size-7 shrink-0 items-center justify-center rounded-full text-xs sm:text-[11px] font-extrabold shadow-sm transition-transform duration-200 group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, var(--organic-terracotta-300), var(--organic-terracotta-600))',
              color: 'white',
              boxShadow: '0 1px 4px color-mix(in srgb, var(--organic-terracotta) 30%, transparent)',
            }}
          >
            {initial}
          </div>
          {/* Display name — hidden on mobile */}
          <span className="hidden max-w-[80px] truncate text-[12.5px] font-medium text-foreground/80 sm:block">
            {displayName}
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-60 overflow-hidden rounded-2xl border-0 p-0 shadow-xl"
          style={{
            background: 'color-mix(in srgb, var(--organic-bg) 80%, transparent)',
            backdropFilter: 'blur(24px) saturate(1.8)',
            border: '1px solid color-mix(in srgb, var(--organic-sand-300) 40%, transparent)',
            boxShadow: '0 8px 32px color-mix(in srgb, var(--organic-terracotta) 8%, transparent), 0 1px 0 color-mix(in srgb, white 40%, transparent) inset',
          }}
        >
          {/* Profile header */}
          <div
            className="px-4 py-3"
            style={{ borderBottom: '1px solid color-mix(in srgb, var(--organic-sand-300) 30%, transparent)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, var(--organic-terracotta-300), var(--organic-terracotta-600))',
                  color: 'white',
                }}
              >
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-foreground capitalize">{displayName}</p>
                <p className="truncate text-[11px] text-muted-foreground">{email ?? ''}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            <DropdownMenuItem
              render={<Link href="/settings" />}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150"
            >
              <div
                className="flex size-7 items-center justify-center rounded-lg"
                style={{ background: 'color-mix(in srgb, var(--organic-sand-400) 15%, transparent)' }}
              >
                <Settings className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
              </div>
              {t('nav.userMenu.settings')}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setThemeModalOpen(true)}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150"
            >
              <div
                className="flex size-7 items-center justify-center rounded-lg"
                style={{ background: 'color-mix(in srgb, var(--organic-terracotta) 15%, transparent)' }}
              >
                <Palette className="size-3.5 text-primary" strokeWidth={1.75} />
              </div>
              {t('nav.userMenu.personalization')}
            </DropdownMenuItem>

            <DropdownMenuSeparator
              className="my-1 mx-1"
              style={{ background: 'color-mix(in srgb, var(--organic-sand-300) 30%, transparent)' }}
            />

            <DropdownMenuItem
              variant="destructive"
              onClick={handleSignOut}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150"
            >
              <div
                className="flex size-7 items-center justify-center rounded-lg"
                style={{ background: 'color-mix(in srgb, var(--destructive) 10%, transparent)' }}
              >
                <LogOut className="size-3.5" strokeWidth={1.75} />
              </div>
              {t('nav.userMenu.signOut')}
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

