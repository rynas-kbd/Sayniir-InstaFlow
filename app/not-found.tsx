import Link from 'next/link'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

/**
 * Global 404 — before this, notFound() calls (e.g. app/(app)/flows/[id]/page.tsx)
 * fell through to Next's default unstyled "This page could not be found",
 * in English, outside the app shell.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <EmptyState
        icon={Compass}
        title="Page introuvable"
        description="Cette page n'existe pas ou a été déplacée."
        action={
          <Button size="sm" render={<Link href="/dashboard" />}>
            Retour au tableau de bord
          </Button>
        }
        className="max-w-md border-none"
      />
    </div>
  )
}
