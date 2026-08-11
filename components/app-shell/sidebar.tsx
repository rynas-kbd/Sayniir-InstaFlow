'use client'

import Link from 'next/link'
import { MessageCircle, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { springs } from '@/lib/motion/springs'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { getNavSections, type BusinessType } from './nav-config'

export function AppSidebar({ businessType }: { businessType: BusinessType }) {
  const pathname = usePathname()
  const sections = getNavSections(businessType)
  const { collapsed, toggle } = useSidebarStore()

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 255 }}
      transition={springs.smooth}
      className="hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 pt-5 pb-3 md:flex h-full overflow-hidden"
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        title="Instaflow"
        className={cn(
          'mb-7 flex h-10 cursor-pointer items-center gap-2.5 rounded-lg transition-colors hover:bg-sidebar-accent/60',
          collapsed ? 'justify-center px-0' : 'px-2.5'
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70 shadow-sm shadow-primary/30">
          <MessageCircle className="size-4.5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="text-base font-bold tracking-tight text-sidebar-foreground"
            >
              Instaflow
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto min-h-0">
        {sections.map((section) => (
          <div key={section.label} className="space-y-2">
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/35 overflow-hidden"
                >
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-1">
              {section.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'relative flex h-10 cursor-pointer items-center gap-3 rounded-lg transition-colors duration-150',
                      collapsed ? 'justify-center px-0' : 'px-3',
                      isActive
                        ? 'font-medium text-sidebar-foreground'
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-sidebar-pill"
                        className="absolute inset-0 rounded-lg bg-sidebar-accent z-0"
                        transition={springs.smooth}
                      />
                    )}
                    
                    {isActive && (
                      <motion.span 
                        layoutId="active-sidebar-indicator"
                        className="absolute -left-3 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary z-10"
                        transition={springs.smooth}
                      />
                    )}

                    <Icon
                      className={cn(
                        'size-[17px] shrink-0 transition-colors z-10',
                        isActive ? 'text-primary' : 'text-sidebar-foreground/40'
                      )}
                      strokeWidth={isActive ? 2 : 1.75}
                    />
                    
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ duration: 0.15 }}
                          className="z-10 text-[13.5px] text-ellipsis overflow-hidden whitespace-nowrap"
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
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
          'mt-2 flex h-9 cursor-pointer items-center gap-2 rounded-lg text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
          collapsed ? 'justify-center px-0' : 'px-3'
        )}
      >
        <div className="z-10 flex items-center gap-2.5">
          {collapsed ? <ChevronsRight className="size-4" strokeWidth={1.75} /> : <ChevronsLeft className="size-4" strokeWidth={1.75} />}
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="text-xs"
              >
                Réduire
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </button>
    </motion.aside>
  )
}
