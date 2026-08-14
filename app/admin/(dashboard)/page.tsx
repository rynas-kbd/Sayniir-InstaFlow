import Link from 'next/link'
import { ArrowRight, ShieldCheck, Gift, Zap, Crown, Sparkles } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/app-shell/page-header'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getT } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()
  const t = await getT()

  const in7days = new Date()
  in7days.setDate(in7days.getDate() + 7)

  const [
    { count: totalClients },
    { count: activeClients },
    { count: expiringSoon },
    { count: inactiveClients },
    { count: freeClients },
    { count: starterClients },
    { count: proClients },
    { count: businessClients }
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
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('plan', 'starter'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('plan', 'business'),
  ])

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t('admin.dashboard.title')} description={t('admin.dashboard.description')} />

      <div className="space-y-6 p-4 md:p-6">
        {/* Intro banner */}
        <div className="glass-banner relative overflow-hidden rounded-2xl px-6 py-6 sm:px-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" />
            {t('admin.dashboard.badge')}
          </span>
          <h2 className="mt-3 text-lg font-bold text-foreground sm:text-xl">{t('admin.dashboard.panelTitle')}</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {t('admin.dashboard.panelDescription')}
          </p>
          <div className="absolute end-0 bottom-0 top-0 hidden w-1/3 items-center justify-center opacity-10 lg:flex">
            <ShieldCheck className="size-40 text-primary" strokeWidth={1} />
          </div>
        </div>

        {/* Global Subscriptions Stats */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.dashboard.subscriptionsSectionTitle')}</h3>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title={t('admin.dashboard.statTotalClients')} value={totalClients ?? 0} />
            <StatCard title={t('admin.dashboard.statActiveSubscriptions')} value={activeClients ?? 0} />
            <StatCard title={t('admin.dashboard.statExpiringSoon')} value={expiringSoon ?? 0} />
            <StatCard title={t('admin.dashboard.statInactiveExpired')} value={inactiveClients ?? 0} />
          </div>
        </div>

        {/* Plan Stats breakdown */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('admin.dashboard.planSectionTitle')}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard title={t('admin.dashboard.statFreeClients')} value={freeClients ?? 0} icon={Gift} />
            <StatCard title={t('admin.dashboard.statStarterClients')} value={starterClients ?? 0} icon={Sparkles} />
            <StatCard title={t('admin.dashboard.statProClients')} value={proClients ?? 0} icon={Zap} />
            <StatCard title={t('admin.dashboard.statBusinessClients')} value={businessClients ?? 0} icon={Crown} />
          </div>
        </div>

        {/* Action card */}
        <Card className="glass-card">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div>
              <h2 className="text-[13px] font-semibold tracking-tight text-foreground">{t('admin.dashboard.manageClientsTitle')}</h2>
              <p className="mt-0.5 max-w-md text-xs text-muted-foreground">
                {t('admin.dashboard.manageClientsDescription')}
              </p>
            </div>
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/admin/clients" />}>
              {t('admin.dashboard.viewClientsButton')} <ArrowRight className="size-3.5 rtl:-scale-x-100" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

