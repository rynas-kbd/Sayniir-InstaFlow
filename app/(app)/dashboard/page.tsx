import Link from 'next/link'
import {
  MessageSquare,
  Zap,
  Link2,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { resolveOnboardingState } from '@/lib/onboarding/state'
import { GOAL_TO_TEMPLATE_ID } from '@/lib/onboarding/steps'
import { ActivationChecklist } from '@/components/onboarding/activation-checklist'
import { InsightRail } from '@/components/ai/insight-rail'
import { mapAiInsightRow } from '@/components/ai/types'
import { shouldShowPulseSurvey } from '@/lib/onboarding/pulse'
import { PulseSurvey } from '@/components/onboarding/pulse-survey'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/app-shell/page-header'
import { StatCard } from '@/components/dashboard/stat-card'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from '@/components/ui/status-dot'
import { Button } from '@/components/ui/button'

import { DashboardContainer, DashboardItem } from '@/components/dashboard/dashboard-animator'

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'à l\'instant'
  if (diffMin < 60) return `il y a ${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH}h`
  return `il y a ${Math.floor(diffH / 24)}j`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // "Comptes liés" widget deliberately lists every connected account — it's
  // an account-management summary, not per-account data — while the stats
  // and lists below scope to whichever account is active.
  const { accounts: safeAccounts, active } = await resolveActiveAccount()
  const onboarding = await resolveOnboardingState()

  const { data: profileMeta } = await supabase.from('profiles').select('created_at').eq('id', user!.id).single()
  const showPulseSurvey = onboarding.isActivated && (await shouldShowPulseSurvey(user!.id, profileMeta?.created_at ?? null))

  const [{ data: messages, count: totalMessages }, { data: subscription }, { data: rules }] =
    await Promise.all([
      active
        ? supabase
            .from('message_logs')
            .select('id, sender_id, sender_username, message_text, auto_reply_sent, created_at', { count: 'exact' })
            .eq('channel_account_id', active.id)
            .eq('direction', 'incoming')
            .order('created_at', { ascending: false })
            .limit(6)
        : Promise.resolve({ data: [], count: 0 }),
      supabase.from('subscriptions').select('status, expires_at').eq('user_id', user!.id).maybeSingle(),
      active
        ? supabase
            .from('automation_rules')
            .select('id, name, trigger_type, trigger_keywords, response_text, is_active')
            .eq('channel_account_id', active.id)
            .order('created_at', { ascending: false })
            .limit(3)
        : Promise.resolve({ data: [] }),
    ])

  const { data: insightRows } = active
    ? await supabase
        .from('ai_insights')
        .select('id, rule_id, scope, subject_id, severity, title, detail, fix_tool_name, fix_tool_input')
        .eq('channel_account_id', active.id)
        .is('dismissed_at', null)
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] }
  const insights = (insightRows ?? []).map(mapAiInsightRow)

  const safeMessages = messages ?? []
  const safeRules = rules ?? []
  
  // Calculate verified metrics from message logs
  const totalReplied = safeMessages.filter((m) => m.auto_reply_sent).length
  const activeAccounts = safeAccounts.filter((a) => a.is_active).length

  const expDate = subscription?.expires_at ? new Date(subscription.expires_at) : null
  const isExpired = expDate ? expDate < new Date() : false
  const subOk = subscription?.status === 'active' && !isExpired

  const replyRate = totalMessages ? Math.round((totalReplied / totalMessages) * 100) : 0

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Dashboard"
        description="Pilotez et analysez vos automatisations en temps réel."
        actions={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                subOk
                  ? 'border-success/20 bg-success/10 text-success'
                  : 'border-border bg-muted text-muted-foreground'
              }`}
            >
              <span className={`size-2 rounded-full ${subOk ? 'bg-success animate-pulse' : 'bg-muted-foreground/50'}`} />
              {subOk ? 'Plan Pro Actif' : 'Version Gratuite'}
            </span>
          </div>
        }
      />

      <DashboardContainer className="flex-1 overflow-y-auto space-y-6 p-4 md:p-6">
        {!onboarding.isActivated ? (
          <ActivationChecklist
            currentStepId={onboarding.currentStepId!}
            activeAccountId={active?.id ?? null}
            activePlatform={active?.platform ?? null}
            templateId={onboarding.primaryGoal ? (GOAL_TO_TEMPLATE_ID[onboarding.primaryGoal] ?? 'blank') : 'blank'}
            whatsappAppId={process.env.NEXT_PUBLIC_META_WHATSAPP_APP_ID ?? null}
            whatsappConfigId={process.env.META_WHATSAPP_CONFIG_ID ?? null}
          />
        ) : (
        <>
        {showPulseSurvey && <PulseSurvey />}
        {insights.length > 0 && <InsightRail insights={insights} />}

        {/* Welcome Premium Banner */}
        <DashboardItem className="glass-banner relative overflow-hidden rounded-2xl px-6 py-6 sm:px-8">
          {/* Inner aurora spots */}
          <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full blur-[80px]"
            style={{ background: 'color-mix(in srgb, var(--organic-terracotta) 25%, transparent)' }} />
          <div className="pointer-events-none absolute -left-16 -bottom-16 size-48 rounded-full blur-[70px]"
            style={{ background: 'color-mix(in srgb, var(--organic-sage) 18%, transparent)' }} />

          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-primary"
              style={{ background: 'color-mix(in srgb, var(--organic-terracotta) 12%, transparent)' }}>
              <Sparkles className="size-3.5" />
              Nouveauté : Refonte premium
            </div>
            <h2 className="mt-3 font-heading text-lg text-foreground sm:text-xl font-normal">
              Bienvenue sur votre espace d&apos;automatisation !
            </h2>
            <p className="mt-1.5 text-[13.5px] text-muted-foreground leading-relaxed">
              Connectez votre compte Instagram, configurez vos règles de messagerie automatique, et créez des flows visuels pour piloter vos conversions DMs.
            </p>
          </div>
          <div className="absolute right-6 bottom-0 top-0 hidden w-1/3 items-center justify-center opacity-[0.05] lg:flex">
            <Zap className="size-36 text-primary" strokeWidth={1} />
          </div>
        </DashboardItem>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <DashboardItem>
            <StatCard
              title="Messages reçus"
              value={totalMessages ?? 0}
              icon={MessageSquare}
              accent="terracotta"
              description="Conversations DMs entrantes"
            />
          </DashboardItem>
          <DashboardItem>
            <StatCard
              title="Réponses auto"
              value={totalReplied}
              icon={Zap}
              accent="sage"
              description="Traitées par vos automations"
            />
          </DashboardItem>
          <DashboardItem>
            <StatCard
              title="Canaux actifs"
              value={`${activeAccounts} / ${safeAccounts.length}`}
              icon={Link2}
              accent="sand"
              description="Comptes Meta connectés"
            />
          </DashboardItem>
          <DashboardItem>
            <StatCard
              title="Taux de réponse"
              value={`${replyRate}%`}
              icon={TrendingUp}
              accent="primary"
              description="Efficacité de vos automations"
            />
          </DashboardItem>
        </div>
        </>
        )}

        {/* ── Main content grid ── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          
          {/* Activity feed */}
          <DashboardItem className="flex flex-col">
            <Card className="glass-card flex flex-col justify-between h-full hover:shadow-md transition-all duration-300">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Activité récente</CardTitle>
                    <CardDescription className="text-xs">Derniers messages DMs entrants reçus</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href="/inbox" />}
                    className="cursor-pointer gap-1.5 text-xs text-primary hover:bg-primary/8 hover:text-primary"
                  >
                    Voir tout <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                {safeMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                      <MessageSquare className="size-5" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Aucun message</p>
                    <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                      Les interactions de vos clients s&apos;afficheront ici en temps réel.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border/40">
                    {safeMessages.map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center gap-3.5 px-5 py-3.5 transition-all duration-300 hover:bg-muted/40 hover:translate-x-1.5"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary transition-all group-hover:scale-105">
                          {m.sender_username ? m.sender_username[0].toUpperCase() : <User className="size-3.5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {m.sender_username ? `@${m.sender_username}` : m.sender_id}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{m.message_text}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {m.auto_reply_sent ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success">
                              <CheckCircle2 className="size-3 text-success" /> Répondu
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                              <Clock className="size-3" /> Reçu
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground/60">
                            {formatTime(m.created_at)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </DashboardItem>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            
            {/* Connected accounts */}
            <DashboardItem>
              <Card className="glass-card hover:shadow-md transition-all duration-300">
                <CardHeader className="border-b border-border/40 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Comptes liés</CardTitle>
                      <CardDescription className="text-xs">Statut de vos liaisons Meta</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href="/accounts" />}
                      className="cursor-pointer gap-1.5 text-xs text-primary hover:bg-primary/8"
                    >
                      Gérer <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {safeAccounts.length === 0 ? (
                    <div className="flex flex-col items-center py-6 text-center">
                      <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                        <Link2 className="size-4.5" />
                      </div>
                      <p className="text-xs text-muted-foreground">Aucun canal configuré.</p>
                      <Button
                        size="sm"
                        nativeButton={false}
                        render={<Link href="/accounts" />}
                        className="mt-3 cursor-pointer h-8 text-xs"
                      >
                        Connecter un canal
                      </Button>
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {safeAccounts.slice(0, 4).map((a) => {
                        const isInstagram = a.platform === 'instagram'
                        const isWhatsApp = a.platform === 'whatsapp'
                        
                        return (
                          <li
                            key={a.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/20 px-3.5 py-3 hover:border-border transition-all duration-200"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Brand styled platform icon indicator */}
                              <div 
                                className={cn(
                                  "flex size-6 shrink-0 items-center justify-center rounded-lg text-white text-[10px] font-bold shadow-sm",
                                  isInstagram && "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]",
                                  isWhatsApp && "bg-[#25D366]",
                                  !isInstagram && !isWhatsApp && "bg-[#00B2FF]"
                                )}
                              >
                                {a.platform[0].toUpperCase()}
                              </div>
                              <span className="truncate text-xs font-semibold text-foreground">
                                @{a.instagram_username ?? a.page_name ?? a.platform}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="relative flex size-2 shrink-0">
                                {a.is_active && (
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                                )}
                                <span className={`relative inline-flex size-2 rounded-full ${a.is_active ? 'bg-success' : 'bg-muted-foreground/50'}`} />
                              </span>
                              <span className="text-[11px] font-medium text-muted-foreground">
                                {a.is_active ? 'Actif' : 'Hors ligne'}
                              </span>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </DashboardItem>

            {/* Active rules summary */}
            <DashboardItem>
              <Card className="glass-card hover:shadow-md transition-all duration-300">
                <CardHeader className="border-b border-border/40 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Règles actives</CardTitle>
                      <CardDescription className="text-xs">Top automatisation en cours</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      nativeButton={false}
                      render={<Link href="/automation" />}
                      className="cursor-pointer gap-1.5 text-xs text-primary hover:bg-primary/8"
                    >
                      Gérer <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {safeRules.length === 0 ? (
                    <div className="flex flex-col items-center py-6 text-center">
                      <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                        <Zap className="size-4.5" />
                      </div>
                      <p className="text-xs text-muted-foreground"> Aucune règle configurée.</p>
                      <Button
                        size="sm"
                        nativeButton={false}
                        render={<Link href="/automation" />}
                        className="mt-3 cursor-pointer h-8 text-xs"
                      >
                        Créer une règle
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {safeRules.map((r) => (
                        <div key={r.id} className="relative rounded-xl border border-border/50 bg-muted/10 p-3.5 hover:border-border transition-all duration-200">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <span className="text-[11.5px] font-bold text-foreground line-clamp-1">{r.name}</span>
                            <span className="inline-flex size-2 rounded-full bg-success animate-pulse shrink-0" />
                          </div>
                          
                          {/* DM Conversation Thread Preview */}
                          <div className="flex flex-col gap-2.5 text-xs">
                            {/* User trigger message (Left side bubble) */}
                            <div className="self-start max-w-[85%] rounded-[14px] rounded-bl-[2px] bg-muted/70 px-3 py-2 text-muted-foreground border border-border/40 font-medium">
                              {r.trigger_type === 'any_message'
                                ? '📩 [Nouveau message reçu]'
                                : `🔑 Mot-clé : "${r.trigger_keywords?.slice(0, 1).join('')}"`}
                            </div>
                            
                            {/* IA Auto reply message (Right side bubble) */}
                            <div className="self-end max-w-[85%] rounded-[14px] rounded-br-[2px] bg-primary/10 text-primary px-3 py-2 border border-primary/20 leading-relaxed font-semibold">
                              {r.response_text}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </DashboardItem>

          </div>
        </div>
      </DashboardContainer>
    </div>
  )
}
