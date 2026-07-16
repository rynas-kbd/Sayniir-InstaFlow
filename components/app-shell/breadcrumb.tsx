'use client'

import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { getNavSections, type BusinessType } from './nav-config'

export function Breadcrumb({ businessType }: { businessType: BusinessType }) {
  const pathname = usePathname()
  const sections = getNavSections(businessType)

  for (const section of sections) {
    const item = section.items.find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    if (item) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{section.label}</span>
          <ChevronRight className="size-3" strokeWidth={1.75} />
          <span className="font-medium text-foreground">{item.label}</span>
        </div>
      )
    }
  }

  return null
}
