'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useT } from '@/components/i18n-provider'

/**
 * Segment-level boundary for everything under app/(app) — renders inside
 * AppLayout (sidebar/topbar stay visible) instead of falling through to the
 * root app/error.tsx, which would replace the whole shell. Catches thrown
 * Supabase errors from page data-fetching that previously rendered as an
 * empty list (see the `data ?? []` pattern flagged across app/(app)/*).
 */
export default function AppSegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT()

  useEffect(() => {
    console.error('[app/(app)/error]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <EmptyState
        icon={AlertTriangle}
        title={t('errors.boundary.title')}
        description={t('errors.boundary.description')}
        action={
          <Button size="sm" onClick={reset}>
            {t('errors.boundary.retry')}
          </Button>
        }
        className="max-w-md border-none"
      />
    </div>
  )
}
