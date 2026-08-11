'use client'

import { useEffect } from 'react'

/**
 * Only fires when the root layout itself throws (rare — app/error.tsx
 * handles everything else). Next.js requires this file to render its own
 * <html>/<body> since the root layout that would normally provide them is
 * exactly what failed. Kept intentionally minimal/dependency-free for the
 * same reason: if this renders, something more fundamental than usual is broken.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app/global-error]', error)
  }, [error])

  return (
    <html lang="fr">
      <body style={{ display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 420, padding: '0 1rem' }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>Une erreur est survenue</p>
          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.25rem' }}>
            L&apos;application n&apos;a pas pu se charger correctement. Réessayez.
          </p>
          <button
            onClick={reset}
            style={{ padding: '0.5rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}
