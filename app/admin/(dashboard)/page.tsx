import Link from 'next/link'
import { ArrowRight, ShieldCheck, Gift, Zap, Crown, Sparkles } from 'lucide-react'
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

  const [
    { count: totalClients },
    { count: activeClients },
    { count: expiringSoon },
    { count: inactiveClients },
    { count: freeClients },
    { count: proClients },
    { count: premiumClients }
  ] = await Promise.all([
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('expires_at', in7days.toISOString()),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).neq('status', 'active'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('plan', 'free'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('plan', 'premium'),
  ])

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Vue d'ensemble" description="Gestion globale des clients Instaflow." />

      <div className="space-y-6 p-4 md:p-6">
        {/* Intro banner */}
        <div className="glass-banner relative overflow-hidden rounded-2xl px-6 py-6 sm:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" />
            Espace administrateur
          </span>
          <h2 className="mt-3 text-lg font-bold text-foreground sm:text-xl">Panel de gestion Instaflow</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Suivez les abonnements clients et gérez les accès en un coup d'œil.
          </p>
          <div className="absolute right-0 bottom-0 top-0 hidden w-1/3 items-center justify-center opacity-10 lg:flex">
            <ShieldCheck className="size-40 text-primary" strokeWidth={1} />
          </div>
        </div>

        {/* Global Subscriptions Stats */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Abonnements</h3>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title="Total clients" value={totalClients ?? 0} />
            <StatCard title="Abonnements actifs" value={activeClients ?? 0} />
            <StatCard title="Expirent sous 7 jours" value={expiringSoon ?? 0} />
            <StatCard title="Inactifs / expirés" value={inactiveClients ?? 0} />
          </div>
        </div>

        {/* Plan Stats breakdown */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Répartition par Plan</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard title="Clients Free" value={freeClients ?? 0} icon={Gift} />
            <StatCard title="Clients Pro" value={proClients ?? 0} icon={Zap} />
            <StatCard title="Clients Premium" value={premiumClients ?? 0} icon={Crown} />
          </div>
        </div>

        {/* Action card */}
        <Card className="glass-card">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div>
              <h2 className="text-[13px] font-semibold tracking-tight text-foreground">Gérer les clients</h2>
              <p className="mt-0.5 max-w-md text-xs text-muted-foreground">
                Activer ou désactiver les abonnements, attribuer des plans (Free, Pro, Premium), enregistrer des paiements et gérer les mots-clés.
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

