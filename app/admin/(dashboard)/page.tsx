import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/app-shell/page-header'
import { StatCard } from '@/components/dashboard/stat-card'
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

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Vue d’ensemble" description="Gestion globale des clients Sayniir." />

      <div className="space-y-6 p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard title="Total clients" value={totalClients ?? 0} />
          <StatCard title="Abonnements actifs" value={activeClients ?? 0} />
          <StatCard title="Expirent sous 7 jours" value={expiringSoon ?? 0} />
          <StatCard title="Inactifs / expirés" value={inactiveClients ?? 0} />
        </div>

        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div>
              <h2 className="text-[13px] font-semibold tracking-tight text-foreground">Gérer les clients</h2>
              <p className="mt-0.5 max-w-md text-xs text-muted-foreground">
                Activer ou désactiver les abonnements, enregistrer des paiements, gérer les mots-clés.
              </p>
            </div>
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/admin/clients" />}>
              Voir les clients <ArrowRight className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
