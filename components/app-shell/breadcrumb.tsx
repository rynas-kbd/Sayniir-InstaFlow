'use client'

import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { useT } from '@/components/i18n-provider'
import { getNavSections, type BusinessType } from './nav-config'

export function Breadcrumb({ businessType }: { businessType: BusinessType }) {
  const pathname = usePathname()
  const t = useT()
  const sections = getNavSections(businessType, t)

  for (const section of sections) {
    const item = section.items.find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    if (item) {
      return (
        <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
          <span>{section.label}</span>
          <ChevronRight className="size-3 rtl:-scale-x-100" strokeWidth={1.75} />
          <span className="font-medium text-foreground">{item.label}</span>
        </div>
      )
    }
  }

  return null
}
