'use client'

import Link from 'next/link'
import { Bell, MessageSquare, Target, CalendarClock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface NotificationCounts {
  unrepliedMessages: number
  pendingLeads: number
  pendingAppointments: number
}

export function NotificationsMenu({ counts }: { counts: NotificationCounts }) {
  const total = counts.unrepliedMessages + counts.pendingLeads + counts.pendingAppointments

  const items = [
    {
      href: '/inbox?filter=unreplied',
      icon: MessageSquare,
      label: 'Conversations sans réponse',
      count: counts.unrepliedMessages,
      accent: 'var(--organic-terracotta)',
    },
    {
      href: '/leads',
      icon: Target,
      label: 'Leads en attente',
      count: counts.pendingLeads,
      accent: 'var(--organic-sage)',
    },
    {
      href: '/rdv',
      icon: CalendarClock,
      label: 'Rendez-vous en attente',
      count: counts.pendingAppointments,
      accent: 'var(--organic-sand-500)',
    },
  ].filter((item) => item.count > 0)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative flex size-8 cursor-pointer items-center justify-center rounded-xl text-muted-foreground outline-none transition-all duration-200 hover:text-foreground active:scale-95"
        style={{
          background: total > 0
            ? 'color-mix(in srgb, var(--organic-terracotta) 8%, transparent)'
            : 'transparent',
        }}
        aria-label="Notifications"
      >
        <Bell
          className={cn('size-4 transition-all duration-200', total > 0 && 'text-[color-mix(in_srgb,var(--organic-terracotta-700)_90%,transparent)]')}
          strokeWidth={1.75}
        />
        {total > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full text-[9px] font-bold text-white shadow-sm"
            style={{ background: 'var(--organic-terracotta-700)' }}
          >
            {total > 9 ? '9+' : total}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 overflow-hidden rounded-2xl border-0 p-0 shadow-xl"
        style={{
          background: 'color-mix(in srgb, var(--organic-bg) 80%, transparent)',
          backdropFilter: 'blur(24px) saturate(1.8)',
          border: '1px solid color-mix(in srgb, var(--organic-sand-300) 40%, transparent)',
          boxShadow: '0 8px 32px color-mix(in srgb, var(--organic-terracotta) 10%, transparent), 0 1px 0 color-mix(in srgb, white 40%, transparent) inset',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid color-mix(in srgb, var(--organic-sand-300) 30%, transparent)' }}
        >
          <DropdownMenuLabel className="p-0 text-[13px] font-semibold text-foreground">
            Notifications
          </DropdownMenuLabel>
          {total > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{
                background: 'color-mix(in srgb, var(--organic-terracotta) 12%, transparent)',
                color: 'var(--organic-terracotta-700)',
              }}
            >
              {total} en attente
            </span>
          )}
        </div>

        {/* Items */}
        <div className="p-1.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div
                className="flex size-10 items-center justify-center rounded-xl"
                style={{ background: 'color-mix(in srgb, var(--organic-sage) 12%, transparent)' }}
              >
                <Check className="size-5" style={{ color: 'var(--organic-sage-700)' }} strokeWidth={2} />
              </div>
              <p className="text-[12.5px] font-medium text-foreground">Tout est à jour</p>
              <p className="text-[11px] text-muted-foreground">Aucune action requise</p>
            </div>
          ) : (
            items.map(({ href, icon: Icon, label, count, accent }) => (
              <DropdownMenuItem
                key={href}
                render={<Link href={href} />}
                className={cn('flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150')}
                style={{}}
              >
                <div
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                    color: accent,
                  }}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                </div>
                <span className="flex-1 text-[13px] font-medium">{label}</span>
                <span
                  className="flex size-6 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{
                    background: `color-mix(in srgb, ${accent} 14%, transparent)`,
                    color: accent,
                  }}
                >
                  {count}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
