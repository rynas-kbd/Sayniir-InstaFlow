import { Mail, AtSign, Calendar, Hash, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { PageHeader } from '@/components/app-shell/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SignOutButton } from '@/components/settings/sign-out-button'
import { TeamMembersCard } from '@/components/settings/team-members-card'
import { BillingCard } from '@/components/settings/billing-card'
import { AppearanceCard } from '@/components/settings/appearance-card'
import { CopilotSettingsCard } from '@/components/ai/copilot-settings-card'
import { getAvatarColor, getInitials } from '@/lib/avatar-color'
import { checkAiCreditLimit } from '@/lib/ai/credits/meter'
import type { CopilotProviderKind } from '@/lib/ai/models'

function SectionTitle({
  icon: Icon,
  title,
  sub,
  destructive,
}: {
  icon: React.ElementType
  title: string
  sub?: string
  destructive?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Icon className={`size-3.5 ${destructive ? 'text-destructive' : 'text-muted-foreground'}`} strokeWidth={1.75} />
        <CardTitle className={destructive ? 'text-destructive' : undefined}>{title}</CardTitle>
      </div>
      {sub && <CardDescription className="mt-1">{sub}</CardDescription>}
    </div>
  )
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const instagramUsername = user!.user_metadata?.instagram_username
  const displayName = instagramUsername ? `@${instagramUsername}` : (user!.email ?? 'Utilisateur')

  const { active: account } = await resolveActiveAccount()
  const { data: teamMembers } = account
    ? await supabase.from('team_members').select('*').eq('channel_account_id', account.id).order('created_at', { ascending: false })
    : { data: [] }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, expires_at, plan, custom_price_monthly_dzd, custom_price_annual_dzd')
    .eq('user_id', user!.id)
    .maybeSingle()

  const [credits, { data: copilotSettings }] = await Promise.all([
    checkAiCreditLimit(user!.id),
    account
      ? supabase
          .from('agent_settings')
          .select('copilot_provider, copilot_api_key, copilot_model, copilot_enabled')
          .eq('channel_account_id', account.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const fields = [
    { label: 'Email', value: user!.email ?? '—', icon: Mail },
    { label: 'Compte Instagram', value: instagramUsername ? `@${instagramUsername}` : '—', icon: AtSign },
    {
      label: 'Membre depuis',
      value: new Date(user!.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }),
      icon: Calendar,
    },
    { label: 'ID utilisateur', value: user!.id, icon: Hash, mono: true },
  ]

  return (
    <div className="h-full">
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Paramètres" description="Gérez votre compte et vos préférences." />

        <div className="space-y-4 p-4 sm:p-6">
          <div className="glass-banner flex items-center gap-4 rounded-2xl px-5 py-5">
            <div className={`flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${getAvatarColor(user!.id)}`}>
              {getInitials(displayName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{user!.email}</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informations du compte</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {fields.map(({ label, value, icon: Icon, mono }) => (
                <div key={label} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex items-center gap-2 sm:contents">
                    <Icon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                    <span className="shrink-0 text-xs text-muted-foreground sm:w-36">{label}</span>
                  </div>
                  {/* Below sm: full width on its own line so a UUID isn't truncated
                      to ~15 visible characters — a w-36 fixed label column left
                      only ~130px for the value at 320px. */}
                  <span className={`break-all text-sm text-foreground sm:truncate ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <AppearanceCard />

          <BillingCard
            plan={subscription?.plan ?? null}
            status={subscription?.status ?? null}
            expiresAt={subscription?.expires_at ?? null}
            customPriceMonthlyDzd={subscription?.custom_price_monthly_dzd ?? null}
            customPriceAnnualDzd={subscription?.custom_price_annual_dzd ?? null}
          />

          {account && (
            <CopilotSettingsCard
              channelAccountId={account.id}
              initialSettings={{
                copilot_provider: (copilotSettings?.copilot_provider ?? 'openrouter') as CopilotProviderKind,
                copilot_api_key: copilotSettings?.copilot_api_key ? '••••••••••••' : '',
                copilot_model: copilotSettings?.copilot_model ?? '',
                copilot_enabled: copilotSettings?.copilot_enabled ?? false,
              }}
              byokAllowed={credits.limits.byokAllowed}
              creditsUsed={credits.used}
              creditsLimit={credits.limit}
            />
          )}

          {account && <TeamMembersCard channelAccountId={account.id} initialMembers={teamMembers ?? []} userPlan={subscription?.plan ?? 'free'} />}

          <Card className="glass-card border-destructive/20">
            <CardHeader>
              <SectionTitle icon={ShieldAlert} title="Zone de danger" sub="Déconnecter votre session sur cet appareil." destructive />
            </CardHeader>
            <CardContent>
              <SignOutButton />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
