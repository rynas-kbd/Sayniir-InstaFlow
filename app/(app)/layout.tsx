import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/app-shell/sidebar'
import { Topbar } from '@/components/app-shell/topbar'
import type { BusinessType } from '@/components/app-shell/nav-config'

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
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar businessType={businessType} email={user.email ?? null} notificationCounts={notificationCounts} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
