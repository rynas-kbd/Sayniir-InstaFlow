'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

/**
 * Segment-level boundary for everything under app/(app) — renders inside
 * AppLayout (sidebar/topbar stay visible) instead of falling through to the
 * root app/error.tsx, which would replace the whole shell. Catches thrown
 * Supabase errors from page data-fetching that previously rendered as an
 * empty list (see the `data ?? []` pattern flagged across app/(app)/*).
 */
export default function AppSegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app/(app)/error]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <EmptyState
        icon={AlertTriangle}
        title="Impossible de charger cette page"
        description="Une erreur est survenue en récupérant vos données. Réessayez dans quelques instants."
        action={
          <Button size="sm" onClick={reset}>
            Réessayer
          </Button>
        }
        className="max-w-md border-none"
      />
    </div>
  )
}
