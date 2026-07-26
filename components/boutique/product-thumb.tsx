'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PRODUCT_KIND_META } from './product-kinds'
import type { ProductKind } from './types'

/** Image thumbnail with graceful fallback to the kind icon when the URL is absent or fails to
 * load. `key={src}` is load-bearing: `onError` permanently sets `broken`, so without remounting
 * on URL change a user could never recover after fixing a typo mid-edit. */
export function ProductThumb({ src, kind, className }: { src: string | null; kind: ProductKind; className?: string }) {
  const [broken, setBroken] = useState(false)
  const Icon = PRODUCT_KIND_META[kind].icon

  if (!src || broken) {
    return (
      <div
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary shadow-inner transition-transform duration-300 group-hover:scale-105',
          className,
        )}
      >
        <Icon className="size-5.5" strokeWidth={1.75} />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied URLs, no next/image remotePatterns configured
    <img
      key={src}
      src={src}
      alt=""
      onError={() => setBroken(true)}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={cn('size-11 shrink-0 rounded-xl border border-border/60 object-cover', className)}
    />
  )
}
