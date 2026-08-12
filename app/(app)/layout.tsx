import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { AppSidebar } from '@/components/app-shell/sidebar'
import { Topbar } from '@/components/app-shell/topbar'
import { MobileBottomNav } from '@/components/app-shell/mobile-bottom-nav'
import type { BusinessType } from '@/components/app-shell/nav-config'
import { PageTransitionWrapper } from '@/components/app-shell/page-transition'
import { CopilotProvider } from '@/components/ai/copilot-provider'
import { RenewalBanner } from '@/components/billing/renewal-banner'
import type { PlanKey, BillingPeriod } from '@/lib/plans'

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

  const [{ data: profile }, { accounts, active, scope }, { data: subscription }] = await Promise.all([
    supabase
      .from('profiles')
      .select('business_type, onboarding_completed_at, onboarding_skipped_at')
      .eq('id', user.id)
      .single(),
    resolveActiveAccount(),
    supabase.from('subscriptions').select('plan, status, expires_at, billing_period').eq('user_id', user.id).maybeSingle(),
  ])

  // First visit ever — route through the 30-second questionnaire before any
  // app page. onboarding_skipped_at makes this a one-time gate, not a wall
  // the user has to click past on every session.
  if (!profile?.onboarding_completed_at && !profile?.onboarding_skipped_at) {
    redirect('/welcome')
  }

  const businessType = (profile?.business_type as BusinessType | undefined) ?? 'ecommerce'

  // In the unified 'all' scope the unreplied badge must reflect every
  // connected channel, not just the account the cookie happens to point
  // at — read it off `conversations` (Phase 1) across every accessible
  // account id instead of a single-account message_logs count.
  const accountIds = scope === 'all' ? accounts.map((a) => a.id) : active ? [active.id] : []

  const notificationCounts = active
    ? await (async () => {
        const [{ count: unrepliedMessages }, { count: pendingLeads }, { count: pendingAppointments }] = await Promise.all([
          supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .in('channel_account_id', accountIds)
            .eq('has_unreplied', true),
          supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('channel_account_id', active.id)
            .eq('qualification_status', 'qualifying'),
          supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('channel_account_id', active.id)
            .eq('status', 'pending'),
        ])
        return {
          unrepliedMessages: unrepliedMessages ?? 0,
          pendingLeads: pendingLeads ?? 0,
          pendingAppointments: pendingAppointments ?? 0,
        }
      })()
    : { unrepliedMessages: 0, pendingLeads: 0, pendingAppointments: 0 }

  return (
    <CopilotProvider channelAccountId={active?.id ?? null}>
    <div className="app-shell-root flex h-dvh overflow-hidden bg-background">
      <AppSidebar businessType={businessType} />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {/* ── Aurora blobs — the "light source" behind glass panels ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Decorative top-right (uses custom primary fallback so Ocean shows by default) */}
          <div
            className="absolute -top-32 -right-24 size-[520px] rounded-full blur-[140px]"
          style={{ background: 'color-mix(in srgb, var(--custom-primary-color, #3b82f6) 22%, transparent)' }}
          />
        {/* Decorative mid-left (uses custom secondary fallback) */}
          <div
            className="absolute top-1/3 -left-32 size-[420px] rounded-full blur-[120px]"
          style={{ background: 'color-mix(in srgb, var(--custom-secondary-color, #1d4ed8) 16%, transparent)' }}
          />
        {/* Decorative bottom-center (uses custom primary fallback) */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 size-[380px] rounded-full blur-[110px]"
          style={{ background: 'color-mix(in srgb, var(--custom-primary-color, #3b82f6) 18%, transparent)' }}
          />
        </div>

        <Topbar
          businessType={businessType}
          email={user.email ?? null}
          notificationCounts={notificationCounts}
          accounts={accounts}
          activeAccountId={active?.id ?? null}
          accountScope={scope}
        />
        <RenewalBanner
          plan={(subscription?.plan as PlanKey | undefined) ?? null}
          status={subscription?.status ?? null}
          expiresAt={subscription?.expires_at ?? null}
          billingPeriod={(subscription?.billing_period as BillingPeriod | undefined) ?? null}
        />
        <main className="relative z-10 flex flex-1 flex-col min-h-0 overflow-y-auto overflow-x-hidden">
          <PageTransitionWrapper accountKey={scope === 'all' ? 'all' : active?.id ?? 'none'}>{children}</PageTransitionWrapper>
        </main>
        <MobileBottomNav businessType={businessType} unrepliedCount={notificationCounts.unrepliedMessages} />
      </div>
    </div>
    </CopilotProvider>
  )
}
