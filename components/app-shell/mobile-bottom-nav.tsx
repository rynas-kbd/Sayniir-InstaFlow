'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { springs } from '@/lib/motion/springs'
import { useDragDismiss } from '@/lib/motion/use-drag-dismiss'
import {
  LayoutDashboard,
  Inbox,
  Users,
  Zap,
  MoreHorizontal,
  Workflow,
  BarChart3,
  Settings,
  ShoppingBag,
  CalendarClock,
  Target,
  Megaphone,
  Camera,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useT } from '@/components/i18n-provider'
import type { Translator } from '@/lib/i18n/translate'
import type { BusinessType } from './nav-config'

interface BottomTab {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}

function getPrimaryTabs(t: Translator): BottomTab[] {
  return [
    { href: '/dashboard', label: t('nav.mobileItems.home'), icon: LayoutDashboard },
    { href: '/inbox', label: t('nav.items.inbox'), icon: Inbox },
    { href: '/flows', label: t('nav.items.flows'), icon: Workflow },
  ]
}

function getBusinessTabByType(t: Translator): Record<BusinessType, BottomTab> {
  return {
    ecommerce: { href: '/boutique', label: t('nav.items.boutique'), icon: ShoppingBag },
    coaching: { href: '/rdv', label: t('nav.mobileItems.rdv'), icon: CalendarClock },
    agency: { href: '/leads', label: t('nav.items.leads'), icon: Target },
    generic: { href: '/boutique', label: t('nav.items.boutique'), icon: ShoppingBag },
  }
}

function getMoreItems(t: Translator): BottomTab[] {
  // Same set across every business type today — the store/RDV/leads item
  // already lives in the primary tabs via getBusinessTabByType.
  return [
    { href: '/contacts', label: t('nav.items.contacts'), icon: Users },
    { href: '/automation', label: t('nav.items.rules'), icon: Zap },
    { href: '/campaigns', label: t('nav.items.campaigns'), icon: Megaphone },
    { href: '/analytics', label: t('nav.items.analytics'), icon: BarChart3 },
    { href: '/accounts', label: t('nav.mobileItems.accounts'), icon: Camera },
    { href: '/settings', label: t('nav.items.settings'), icon: Settings },
  ]
}

export function MobileBottomNav({
  businessType,
  unrepliedCount = 0,
}: {
  businessType: BusinessType
  unrepliedCount?: number
}) {
  const pathname = usePathname()
  const t = useT()
  const [moreOpen, setMoreOpen] = useState(false)
  const dragDismiss = useDragDismiss({ onDismiss: () => setMoreOpen(false) })
  const moreItems = getMoreItems(t)

  const businessTab = getBusinessTabByType(t)[businessType]
  const tabs: BottomTab[] = [
    ...getPrimaryTabs(t).map((tab) =>
      tab.href === '/inbox' ? { ...tab, badge: unrepliedCount } : tab
    ),
    businessTab,
  ]

  const isMoreActive = moreItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
  const isPrimaryActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      {/* ── Drawer "Plus" ── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'rgba(0, 0, 0, 0.4)' }}
              onClick={() => setMoreOpen(false)}
            />
            {/* Sheet */}
            <motion.div
              key="sheet"
              {...dragDismiss}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={springs.playful}
              className="fixed bottom-0 start-0 end-0 z-50 max-h-[72vh] overflow-y-auto rounded-t-3xl pb-safe touch-none md:hidden"
              style={{
                background: 'color-mix(in srgb, var(--organic-bg) 90%, transparent)',
                backdropFilter: 'blur(32px) saturate(1.8)',
                borderTop: '1px solid color-mix(in srgb, var(--organic-sand-400) 30%, transparent)',
                boxShadow: '0 -8px 40px color-mix(in srgb, var(--organic-terracotta) 8%, transparent)',
              }}
            >
              {/* Handle */}
              <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[color-mix(in_srgb,var(--organic-sand-400)_40%,transparent)]" />

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 pt-4">
                <span
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: 'color-mix(in srgb, var(--foreground) 40%, transparent)' }}
                >
                  {t('nav.mobileMore.navigationTitle')}
                </span>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="flex size-7 cursor-pointer items-center justify-center rounded-full"
                  style={{
                    background: 'color-mix(in srgb, var(--organic-sand-300) 25%, transparent)',
                    color: 'color-mix(in srgb, var(--foreground) 55%, transparent)',
                  }}
                  aria-label={t('nav.mobileMore.closeAriaLabel')}
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Grid of items */}
              <div className="grid grid-cols-3 gap-2 px-4 pb-6">
                {moreItems.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href || pathname.startsWith(`${href}/`)
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-2xl px-3 py-4 transition-all duration-150',
                        isActive
                          ? 'text-white'
                          : 'text-foreground/70'
                      )}
                      style={
                        isActive
                          ? {
                              background:
                                'linear-gradient(135deg, var(--organic-terracotta-500), var(--organic-terracotta-700))',
                              boxShadow:
                                '0 4px 16px color-mix(in srgb, var(--organic-terracotta) 30%, transparent)',
                            }
                          : {
                              background:
                                'color-mix(in srgb, var(--organic-sand-300) 18%, transparent)',
                              border:
                                '1px solid color-mix(in srgb, var(--organic-sand-400) 20%, transparent)',
                            }
                      }
                    >
                      <Icon className="size-5 shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                      <span className="text-[11px] font-medium leading-none">{label}</span>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Bottom Tab Bar ── */}
      <nav
        className="fixed bottom-0 start-0 end-0 z-50 border-t border-border/80 bg-card/95 backdrop-blur-2xl md:hidden shadow-2xl"
        style={{
          background: 'color-mix(in srgb, var(--organic-bg) 95%, transparent)',
          backdropFilter: 'blur(32px) saturate(1.8)',
          boxShadow: '0 -4px 30px color-mix(in srgb, var(--organic-terracotta) 12%, transparent)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 10px)',
          paddingTop: '6px',
        }}
      >
        {/* Top gradient line */}
        <div
          className="pointer-events-none absolute start-0 end-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, color-mix(in srgb, var(--organic-terracotta) 30%, transparent) 30%, color-mix(in srgb, var(--organic-sage) 25%, transparent) 70%, transparent)',
          }}
        />

        <div className="flex items-center justify-around px-1">
          {/* Primary tabs */}
          {tabs.map(({ href, label, icon: Icon, badge }) => {
            const isActive = isPrimaryActive(href)
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all duration-150 active:scale-95"
              >
                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-bottom-active"
                    className="absolute inset-x-1 inset-y-0 rounded-xl"
                    style={{
                      background:
                        'color-mix(in srgb, var(--organic-terracotta) 14%, transparent)',
                    }}
                    transition={springs.smooth}
                  />
                )}

                {/* Icon + badge */}
                <div className="relative">
                  <Icon
                    className={cn(
                      'relative size-[22px] shrink-0 transition-colors duration-150',
                      isActive
                        ? 'text-[var(--organic-terracotta-600)]'
                        : 'text-foreground/50'
                    )}
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  {/* Badge */}
                  {badge != null && badge > 0 && (
                    <span
                      className="absolute -end-1.5 -top-1 flex min-w-[16px] items-center justify-center rounded-full px-[3px] text-[9px] font-bold leading-[16px] text-white shadow-sm"
                      style={{ background: 'var(--organic-terracotta-600)' }}
                    >
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>

                {/* Label (deuxième ligne) */}
                <span
                  className={cn(
                    'relative max-w-full truncate text-[10.5px] leading-tight transition-colors duration-150',
                    isActive
                      ? 'text-[var(--organic-terracotta-700)] font-bold'
                      : 'text-foreground/60 font-medium'
                  )}
                >
                  {label}
                </span>
              </Link>
            )
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all duration-150 active:scale-95"
          >
            {isMoreActive && (
              <motion.div
                layoutId="mobile-bottom-active"
                className="absolute inset-x-1 inset-y-0 rounded-xl"
                style={{
                  background: 'color-mix(in srgb, var(--organic-terracotta) 14%, transparent)',
                }}
                transition={springs.smooth}
              />
            )}
            <MoreHorizontal
              className={cn(
                'relative size-[22px] shrink-0 transition-colors duration-150',
                isMoreActive || moreOpen
                  ? 'text-[var(--organic-terracotta-600)]'
                  : 'text-foreground/50'
              )}
              strokeWidth={isMoreActive || moreOpen ? 2.25 : 1.75}
            />
            <span
              className={cn(
                'relative max-w-full truncate text-[10.5px] leading-tight transition-colors duration-150',
                isMoreActive || moreOpen
                  ? 'text-[var(--organic-terracotta-700)] font-bold'
                  : 'text-foreground/60 font-medium'
              )}
            >
              {t('nav.mobileMore.label')}
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
