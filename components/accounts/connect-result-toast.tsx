'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  messenger: 'Messenger',
  whatsapp: 'WhatsApp',
}

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Autorisation refusée sur Facebook.',
  invalid_state: 'Session expirée, réessaie la connexion.',
  missing_code: 'Connexion interrompue avant autorisation.',
  no_pages: 'Aucune Page Facebook gérée par ce compte. Messenger nécessite une Page.',
  server_error: 'Une erreur est survenue pendant la connexion.',
}

/**
 * Reads the ?connected= / ?error= / ?reason= params left by the OAuth
 * callback routes (app/api/auth/{callback,messenger/callback}/route.ts),
 * surfaces the result as a toast, then strips the params from the URL so
 * a page refresh doesn't re-fire it. Without this, OAuth failures redirect
 * silently and the user has no way to know a connection didn't go through.
 */
export function ConnectResultToast() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    const reason = searchParams.get('reason')

    if (connected) {
      const label = PLATFORM_LABELS[connected] ?? connected
      toast.success(`Compte ${label} connecté`)
      router.replace('/accounts')
      return
    }

    if (error) {
      if (error === 'db_error') {
        toast.error("Échec d'enregistrement", {
          description: reason ?? 'Erreur inconnue lors de la sauvegarde du compte.',
        })
      } else {
        toast.error(ERROR_MESSAGES[error] ?? 'Une erreur est survenue pendant la connexion.')
      }
      router.replace('/accounts')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return null
}
