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

const WORKSPACE_ITEM_BY_TYPE: Record<BusinessType, NavItem | null> = {
  ecommerce: { href: '/boutique', label: 'Boutique', icon: ShoppingBag },
  coaching: { href: '/rdv', label: 'Rendez-vous', icon: CalendarClock },
  agency: { href: '/leads', label: 'Leads', icon: Target },
  generic: null,
}

export function getNavSections(businessType: BusinessType): NavSection[] {
  const workspaceItem = WORKSPACE_ITEM_BY_TYPE[businessType]

  const sections: NavSection[] = [
    {
      label: 'Vue d’ensemble',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      label: 'Conversations',
      items: [
        { href: '/inbox', label: 'Inbox', icon: Inbox },
        { href: '/contacts', label: 'Contacts', icon: Users },
      ],
    },
    {
      label: 'Automatisation',
      items: [
        { href: '/flows', label: 'Flows', icon: Workflow },
        { href: '/automation', label: 'Règles', icon: Zap },
        { href: '/campaigns', label: 'Campagnes', icon: Megaphone },
      ],
    },
  ]

  if (workspaceItem) {
    sections.push({ label: 'Business', items: [workspaceItem] })
  }

  sections.push({
    label: 'Compte',
    items: [
      { href: '/accounts', label: 'Comptes connectés', icon: Camera },
      { href: '/settings', label: 'Paramètres', icon: Settings },
    ],
  })

  return sections
}
