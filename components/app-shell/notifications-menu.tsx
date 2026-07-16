'use client'

import Link from 'next/link'
import { Bell, MessageSquare, Target, CalendarClock } from 'lucide-react'
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
    },
    {
      href: '/leads',
      icon: Target,
      label: 'Leads en attente de qualification',
      count: counts.pendingLeads,
    },
    {
      href: '/rdv',
      icon: CalendarClock,
      label: 'Rendez-vous en attente',
      count: counts.pendingAppointments,
    },
  ].filter((item) => item.count > 0)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative flex size-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Notifications"
      >
        <Bell className="size-4" strokeWidth={1.75} />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold text-white">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {total > 0 ? `${total} notification${total > 1 ? 's' : ''}` : 'Notifications'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="px-1.5 py-4 text-center text-xs text-muted-foreground">Tout est à jour ✅</p>
        ) : (
          items.map(({ href, icon: Icon, label, count }) => (
            <DropdownMenuItem key={href} render={<Link href={href} />} className={cn('gap-2.5')}>
              <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <span className="flex-1 text-sm">{label}</span>
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                {count}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
