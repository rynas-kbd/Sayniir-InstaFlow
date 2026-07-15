import Link from 'next/link'
import { ArrowRight, Users, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/app-shell/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  const in7days = new Date()
  in7days.setDate(in7days.getDate() + 7)

  const [{ count: totalClients }, { count: activeClients }, { count: expiringSoon }, { count: inactiveClients }] =
    await Promise.all([
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lte('expires_at', in7days.toISOString()),
      supabase.from('subscriptions').select('*', { count: 'exact', head: true }).neq('status', 'active'),
    ])

  const stats = [
    { label: 'Total clients', value: totalClients ?? 0, icon: Users, caption: 'inscrits' },
    { label: 'Abonnements actifs', value: activeClients ?? 0, icon: CheckCircle2, caption: 'en cours' },
    { label: 'Expirent bientôt', value: expiringSoon ?? 0, icon: AlertCircle, caption: 'dans 7 jours' },
    { label: 'Inactifs / expirés', value: inactiveClients ?? 0, icon: XCircle, caption: 'à traiter' },
  ]

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Vue d’ensemble" description="Gestion globale des clients Sayniir." />

      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, caption }) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <div className="mb-4 flex items-start justify-between">
                  <span className="max-w-[70%] text-xs font-semibold text-muted-foreground">{label}</span>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-4 text-primary" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">{value}</span>
                  <span className="text-[11px] text-muted-foreground">{caption}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-6 pt-6">
            <div>
              <h2 className="mb-1 text-base font-bold text-foreground">Gérer les clients</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Activer ou désactiver les abonnements, enregistrer des paiements, gérer les mots-clés.
              </p>
            </div>
            <Button render={<Link href="/admin/clients" />}>
              Voir les clients <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
