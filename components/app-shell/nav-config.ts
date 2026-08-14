import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Inbox,
  Users,
  Zap,
  Workflow,
  Camera,
  BarChart3,
  Settings,
  ShoppingBag,
  CalendarClock,
  Target,
  Megaphone,
} from 'lucide-react'
import type { Translator } from '@/lib/i18n/translate'

export type BusinessType = 'ecommerce' | 'coaching' | 'agency' | 'generic'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export interface NavSection {
  label: string
  items: NavItem[]
}

function getWorkspaceItemByType(t: Translator): Record<BusinessType, NavItem | null> {
  return {
    ecommerce: { href: '/boutique', label: t('nav.items.boutique'), icon: ShoppingBag },
    coaching: { href: '/rdv', label: t('nav.items.rdv'), icon: CalendarClock },
    agency: { href: '/leads', label: t('nav.items.leads'), icon: Target },
    generic: null,
  }
}

export function getNavSections(businessType: BusinessType, t: Translator): NavSection[] {
  const workspaceItem = getWorkspaceItemByType(t)[businessType]

  const sections: NavSection[] = [
    {
      label: t('nav.sections.overview'),
      items: [
        { href: '/dashboard', label: t('nav.items.dashboard'), icon: LayoutDashboard },
        { href: '/analytics', label: t('nav.items.analytics'), icon: BarChart3 },
      ],
    },
    {
      label: t('nav.sections.conversations'),
      items: [
        { href: '/inbox', label: t('nav.items.inbox'), icon: Inbox },
        { href: '/contacts', label: t('nav.items.contacts'), icon: Users },
      ],
    },
    {
      label: t('nav.sections.automation'),
      items: [
        { href: '/flows', label: t('nav.items.flows'), icon: Workflow },
        { href: '/automation', label: t('nav.items.rules'), icon: Zap },
        { href: '/campaigns', label: t('nav.items.campaigns'), icon: Megaphone },
      ],
    },
  ]

  if (workspaceItem) {
    sections.push({ label: t('nav.sections.business'), items: [workspaceItem] })
  }

  sections.push({
    label: t('nav.sections.account'),
    items: [
      { href: '/accounts', label: t('nav.items.accounts'), icon: Camera },
      { href: '/settings', label: t('nav.items.settings'), icon: Settings },
    ],
  })

  return sections
}
