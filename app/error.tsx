'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

/**
 * Root error boundary — catches any thrown error in app/(app), app/(auth),
 * etc. that isn't caught by a more specific segment error.tsx. Before this
 * file existed, no error.tsx existed anywhere in the app (confirmed: `find
 * app -name error.tsx` returned nothing), so any unhandled server error
 * rendered Next's default unstyled error page, in English, outside the
 * product's shell.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app/error]', error)
  }, [error])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <EmptyState
        icon={AlertTriangle}
        title="Une erreur est survenue"
        description="Quelque chose s'est mal passé de notre côté. Réessayez, ou revenez plus tard si le problème persiste."
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
