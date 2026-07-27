import Link from 'next/link'
import { Camera } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'

/**
 * Shared empty state for every app/(app) page when resolveActiveAccount()
 * returns `active: null` — the user has no channel account connected yet.
 * Replaces the ~12 ad hoc copies of this same block (e.g. the old
 * flows/page.tsx "Aucun compte connecté" panel).
 */
export function NoAccountState({ description }: { description?: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <EmptyState
          icon={Camera}
          title="Aucun compte connecté"
          description={description ?? 'Connectez un compte Instagram, Messenger ou WhatsApp pour commencer.'}
          action={
            <Button render={<Link href="/accounts" />}>
              Connecter un compte
            </Button>
          }
        />
      </div>
    </div>
  )
}
