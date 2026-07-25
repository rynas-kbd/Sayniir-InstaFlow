import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/app-shell/sidebar'
import { Topbar } from '@/components/app-shell/topbar'
import type { BusinessType } from '@/components/app-shell/nav-config'
import { PageTransitionWrapper } from '@/components/app-shell/page-transition'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: profile }, { data: accounts }] = await Promise.all([
    supabase.from('profiles').select('business_type').eq('id', user.id).single(),
    supabase.from('channel_accounts').select('id').eq('user_id', user.id),
  ])

  const businessType = (profile?.business_type as BusinessType | undefined) ?? 'ecommerce'
  const accountIds = (accounts ?? []).map((a) => a.id)
  const safeIds = accountIds.length ? accountIds : ['00000000-0000-0000-0000-000000000000']

  const [{ count: unrepliedMessages }, { count: pendingLeads }, { count: pendingAppointments }] = await Promise.all([
    supabase
      .from('message_logs')
      .select('*', { count: 'exact', head: true })
      .in('channel_account_id', safeIds)
      .eq('direction', 'incoming')
      .eq('auto_reply_sent', false),
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('channel_account_id', safeIds)
      .eq('qualification_status', 'qualifying'),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .in('channel_account_id', safeIds)
      .eq('status', 'pending'),
  ])

  const notificationCounts = {
    unrepliedMessages: unrepliedMessages ?? 0,
    pendingLeads: pendingLeads ?? 0,
    pendingAppointments: pendingAppointments ?? 0,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar businessType={businessType} />
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* ── Aurora blobs — the "light source" behind glass panels ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {/* Terracotta top-right */}
          <div
            className="absolute -top-32 -right-24 size-[520px] rounded-full blur-[140px]"
            style={{ background: 'color-mix(in srgb, var(--organic-terracotta) 22%, transparent)' }}
          />
          {/* Sage mid-left */}
          <div
            className="absolute top-1/3 -left-32 size-[420px] rounded-full blur-[120px]"
            style={{ background: 'color-mix(in srgb, var(--organic-sage) 16%, transparent)' }}
          />
          {/* Warm terracotta bottom-center */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 size-[380px] rounded-full blur-[110px]"
            style={{ background: 'color-mix(in srgb, var(--organic-terracotta-300) 18%, transparent)' }}
          />
        </div>

        <Topbar businessType={businessType} email={user.email ?? null} notificationCounts={notificationCounts} />
        <main className="relative z-10 flex-1 overflow-hidden">
          <PageTransitionWrapper>{children}</PageTransitionWrapper>
        </main>
      </div>
    </div>
  )
}
