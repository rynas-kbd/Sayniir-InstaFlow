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
import type { BusinessType } from './nav-config'

interface BottomTab {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}

const PRIMARY_TABS: BottomTab[] = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/flows', label: 'Flows', icon: Workflow },
]

const BUSINESS_TAB_BY_TYPE: Record<BusinessType, BottomTab> = {
  ecommerce: { href: '/boutique', label: 'Boutique', icon: ShoppingBag },
  coaching: { href: '/rdv', label: 'RDV', icon: CalendarClock },
  agency: { href: '/leads', label: 'Leads', icon: Target },
  generic: { href: '/boutique', label: 'Boutique', icon: ShoppingBag },
}

const MORE_ITEMS_BY_TYPE: Record<BusinessType, BottomTab[]> = {
  ecommerce: [
    { href: '/contacts', label: 'Contacts', icon: Users },
    { href: '/automation', label: 'Règles', icon: Zap },
    { href: '/campaigns', label: 'Campagnes', icon: Megaphone },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/accounts', label: 'Comptes', icon: Camera },
    { href: '/settings', label: 'Paramètres', icon: Settings },
  ],
  coaching: [
    { href: '/contacts', label: 'Contacts', icon: Users },
    { href: '/automation', label: 'Règles', icon: Zap },
    { href: '/campaigns', label: 'Campagnes', icon: Megaphone },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/accounts', label: 'Comptes', icon: Camera },
    { href: '/settings', label: 'Paramètres', icon: Settings },
  ],
  agency: [
    { href: '/contacts', label: 'Contacts', icon: Users },
    { href: '/automation', label: 'Règles', icon: Zap },
    { href: '/campaigns', label: 'Campagnes', icon: Megaphone },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/accounts', label: 'Comptes', icon: Camera },
    { href: '/settings', label: 'Paramètres', icon: Settings },
  ],
  generic: [
    { href: '/contacts', label: 'Contacts', icon: Users },
    { href: '/automation', label: 'Règles', icon: Zap },
    { href: '/campaigns', label: 'Campagnes', icon: Megaphone },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/accounts', label: 'Comptes', icon: Camera },
    { href: '/settings', label: 'Paramètres', icon: Settings },
  ],
}

export function MobileBottomNav({
  businessType,
  unrepliedCount = 0,
}: {
  businessType: BusinessType
  unrepliedCount?: number
}) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const dragDismiss = useDragDismiss({ onDismiss: () => setMoreOpen(false) })
  const moreItems = MORE_ITEMS_BY_TYPE[businessType]

  const businessTab = BUSINESS_TAB_BY_TYPE[businessType]
  const tabs: BottomTab[] = [
    ...PRIMARY_TABS.map((tab) =>
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
              style={{ background: 'color-mix(in srgb, var(--organic-bg) 10%, black)' }}
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
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl pb-safe touch-none md:hidden"
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
                  Navigation
                </span>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="flex size-7 cursor-pointer items-center justify-center rounded-full"
                  style={{
                    background: 'color-mix(in srgb, var(--organic-sand-300) 25%, transparent)',
                    color: 'color-mix(in srgb, var(--foreground) 55%, transparent)',
                  }}
                  aria-label="Fermer la navigation"
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
        className="relative shrink-0 z-30 md:hidden"
        style={{
          background: 'color-mix(in srgb, var(--organic-bg) 78%, transparent)',
          backdropFilter: 'blur(32px) saturate(1.8)',
          borderTop: '1px solid color-mix(in srgb, var(--organic-terracotta) 10%, transparent)',
          boxShadow: '0 -4px 24px color-mix(in srgb, var(--organic-terracotta) 5%, transparent)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Top gradient line */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, color-mix(in srgb, var(--organic-terracotta) 20%, transparent) 30%, color-mix(in srgb, var(--organic-sage) 15%, transparent) 70%, transparent)',
          }}
        />

        <div className="flex items-stretch px-1 pt-1.5 pb-2">
          {/* Primary tabs */}
          {tabs.map(({ href, label, icon: Icon, badge }) => {
            const isActive = isPrimaryActive(href)
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-1 flex-col items-center gap-1 py-1.5 transition-all duration-150 active:scale-95"
              >
                {/* Active background pill */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-bottom-active"
                    className="absolute inset-x-2 inset-y-0 rounded-xl"
                    style={{
                      background:
                        'color-mix(in srgb, var(--organic-terracotta) 12%, transparent)',
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
                        : 'text-foreground/40'
                    )}
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  {/* Badge */}
                  {badge != null && badge > 0 && (
                    <span
                      className="absolute -right-1.5 -top-1 flex min-w-[16px] items-center justify-center rounded-full px-[3px] text-[9px] font-bold leading-[16px] text-white"
                      style={{ background: 'var(--organic-terracotta-600)' }}
                    >
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    'relative text-[10px] font-medium leading-none transition-colors duration-150',
                    isActive
                      ? 'text-[var(--organic-terracotta-700)] font-semibold'
                      : 'text-foreground/40'
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
            className="relative flex flex-1 flex-col items-center gap-1 py-1.5 transition-all duration-150 active:scale-95"
          >
            {isMoreActive && (
              <motion.div
                layoutId="mobile-bottom-active"
                className="absolute inset-x-2 inset-y-0 rounded-xl"
                style={{
                  background: 'color-mix(in srgb, var(--organic-terracotta) 12%, transparent)',
                }}
                transition={springs.smooth}
              />
            )}
            <MoreHorizontal
              className={cn(
                'relative size-[22px] shrink-0 transition-colors duration-150',
                isMoreActive || moreOpen
                  ? 'text-[var(--organic-terracotta-600)]'
                  : 'text-foreground/40'
              )}
              strokeWidth={isMoreActive || moreOpen ? 2.25 : 1.75}
            />
            <span
              className={cn(
                'relative text-[10px] font-medium leading-none transition-colors duration-150',
                isMoreActive || moreOpen
                  ? 'text-[var(--organic-terracotta-700)] font-semibold'
                  : 'text-foreground/40'
              )}
            >
              Plus
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
