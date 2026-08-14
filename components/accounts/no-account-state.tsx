import Link from 'next/link'
import { Camera } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { getT } from '@/lib/i18n/server'

/**
 * Shared empty state for every app/(app) page when resolveActiveAccount()
 * returns `active: null` — the user has no channel account connected yet.
 * Replaces the ~12 ad hoc copies of this same block (e.g. the old
 * flows/page.tsx "Aucun compte connecté" panel).
 */
export async function NoAccountState({ description }: { description?: string }) {
  const t = await getT()
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <EmptyState
          icon={Camera}
          title={t('accounts.noAccountState.title')}
          description={description ?? t('accounts.noAccountState.description')}
          action={
            <Button render={<Link href="/accounts" />}>
              {t('accounts.noAccountState.connect')}
            </Button>
          }
        />
      </div>
    </div>
  )
}
