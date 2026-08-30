import { LandingNav, LandingFooter } from '@/components/landing/chrome'

export const metadata = {
  title: 'Suppression de données Facebook | Raddlly',
  description: 'Demande de suppression des données liées à votre connexion Facebook/Messenger.',
}

// Linked from app/(landing)/suppression-donnees/page.tsx §3.3 — was a dead
// link (404) until this page existed. Meta's platform requires apps using
// Facebook Login to publish a reachable Data Deletion page; this collects
// the request and points the user to the same email-based process already
// described on the parent page, rather than a bespoke automated flow.
export default function DataDeletionCallbackPage() {
  return (
    <>
      <LandingNav />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-4 text-3xl font-bold">Suppression de données Facebook</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Si vous avez utilisé Raddlly via Facebook Messenger et souhaitez que nous supprimions les données liées à cette
          intégration (compte Messenger connecté, jetons d&apos;accès, historique de conversations), envoyez-nous votre demande
          directement.
        </p>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="mb-3 text-sm font-medium">Pour traiter votre demande, écrivez-nous à :</p>
          <p className="mb-4">
            <a href="mailto:rynaskebdi.pro@gmail.com?subject=Suppression%20de%20donn%C3%A9es%20Facebook" className="text-primary hover:underline">
              rynaskebdi.pro@gmail.com
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            Merci d&apos;indiquer votre nom complet, l&apos;email associé à votre compte, et de préciser qu&apos;il s&apos;agit d&apos;une
            suppression liée à Facebook. Votre demande sera traitée sous 30 jours conformément à notre{' '}
            <a href="/suppression-donnees" className="text-primary hover:underline">
              politique de suppression de données
            </a>
            .
          </p>
        </div>
      </div>
      <LandingFooter />
    </>
  )
}
