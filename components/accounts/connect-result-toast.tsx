'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { haptic } from '@/lib/motion/haptics'
import { useT } from '@/components/i18n-provider'

/**
 * Reads the ?connected= / ?error= / ?reason= params left by the OAuth
 * callback routes (app/api/auth/{callback,messenger/callback}/route.ts),
 * surfaces the result as a toast, then strips the params from the URL so
 * a page refresh doesn't re-fire it. Without this, OAuth failures redirect
 * silently and the user has no way to know a connection didn't go through.
 *
 * `redirectTo` defaults to '/accounts' (where the OAuth callbacks always
 * land — they have no `next` param to thread through). The onboarding
 * activation checklist passes '/dashboard' instead so a channel connected
 * from there returns the user to the checklist rather than stranding them
 * on the accounts page.
 */
export function ConnectResultToast({ redirectTo = '/accounts' }: { redirectTo?: string }) {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const platformLabels: Record<string, string> = {
      instagram: t('accounts.platformLabels.instagram'),
      messenger: t('accounts.platformLabels.messenger'),
      whatsapp: t('accounts.platformLabels.whatsapp'),
    }
    const errorMessages: Record<string, string> = {
      access_denied: t('accounts.connectResult.errors.accessDenied'),
      invalid_state: t('accounts.connectResult.errors.invalidState'),
      missing_code: t('accounts.connectResult.errors.missingCode'),
      no_pages: t('accounts.connectResult.errors.noPages'),
      server_error: t('accounts.connectResult.errors.serverError'),
      config_missing: t('accounts.connectResult.errors.configMissing'),
    }

    const connected = searchParams.get('connected')
    const error = searchParams.get('error')
    const reason = searchParams.get('reason')

    if (connected) {
      const label = platformLabels[connected] ?? connected
      toast.success(t('accounts.connectResult.connectedToast', { platform: label }))
      haptic('success')
      router.replace(redirectTo)
      return
    }

    if (error) {
      if (error === 'db_error') {
        toast.error(t('accounts.connectResult.errors.dbErrorTitle'), {
          description: reason ?? t('accounts.connectResult.errors.dbErrorDescriptionFallback'),
        })
      } else if (error === 'no_pages' && reason) {
        toast.error(errorMessages.no_pages, { description: reason })
      } else {
        toast.error(errorMessages[error] ?? t('accounts.connectResult.errors.generic'))
      }
      router.replace(redirectTo)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, redirectTo])

  return null
}
