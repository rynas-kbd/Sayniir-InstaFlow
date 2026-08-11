'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PRODUCT_KIND_META } from './product-kinds'
import type { ProductKind } from './types'

export function ProductThumb({ src, kind, className }: { src: string | null; kind: ProductKind; className?: string }) {
  const [broken, setBroken] = useState(false)
  const Icon = PRODUCT_KIND_META[kind].icon

  if (!src || broken) {
    return (
      <div
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner border border-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/15 group-hover:border-primary/30',
          className,
        )}
      >
        <Icon className="size-6 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.75} />
      </div>
    )
  }

  return (
    <div className={cn('relative size-12 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted/30 shadow-sm transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-md', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt=""
        onError={() => setBroken(true)}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  )
}
