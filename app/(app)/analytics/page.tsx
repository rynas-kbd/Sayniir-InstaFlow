import { MessageSquare, Zap, TrendingUp, Users, Sparkles, BarChart3, ArrowUpRight, Clock, MessagesSquare, SendHorizontal, ShoppingCart, PackageCheck, Wallet, Receipt } from 'lucide-react'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import {
  getAnalyticsSummary,
  getMessagesTimeseries,
  getConversionFunnel,
  getHandlingSplit,
  getRevenueSummary,
  type AnalyticsSummary,
  type DayPoint,
  type ConversionFunnel,
  type HandlingSplit,
  type RevenueSummary,
} from '@/lib/analytics/queries'
import { PageHeader } from '@/components/app-shell/page-header'
import { NoAccountState } from '@/components/accounts/no-account-state'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MessagesChart } from '@/components/analytics/messages-chart'

function StatBadge({ value, label, icon: Icon, accent }: { value: string | number; label: string; icon: React.ElementType; accent?: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/40 bg-card p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ borderColor: accent ? `color-mix(in srgb, ${accent} 20%, transparent)` : undefined }}
    >
      {/* Soft glow corner */}
      <div
        className="pointer-events-none absolute -right-4 -top-4 size-20 rounded-full blur-2xl opacity-20"
        style={{ background: accent ?? 'var(--color-primary)' }}
      />
      <div className="flex items-start justify-between">
        <div
          className="flex size-9 items-center justify-center rounded-xl"
          style={{ background: accent ? `color-mix(in srgb, ${accent} 12%, transparent)` : 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}
        >
          <Icon className="size-4" style={{ color: accent ?? 'var(--color-primary)' }} />
        </div>
        <ArrowUpRight className="size-3.5 text-muted-foreground/40" />
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">{value}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function formatHour(h: number) {
  return `${h.toString().padStart(2, '0')}h00`
}

export default async function AnalyticsPage() {
  const { active: account } = await resolveActiveAccount()

  if (!account) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader title="Analytics" description="Performances et statistiques des 14 derniers jours." />
        <NoAccountState description="Connectez un compte pour voir vos statistiques." />
      </div>
    )
  }

  const to = new Date()
  const from = new Date(to.getTime() - 13 * 86400000)

  const [summary, points, funnel, handling, revenue]: [AnalyticsSummary, DayPoint[], ConversionFunnel, HandlingSplit, RevenueSummary] =
    await Promise.all([
      getAnalyticsSummary(account.id, from, to),
      getMessagesTimeseries(account.id, from, to),
      getConversionFunnel(account.id, from, to),
      getHandlingSplit(account.id, from, to),
      getRevenueSummary(account.id, from, to),
    ])

  const totalMessages = summary.messagesReceived + summary.totalOutgoing

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Analytics"
        description="Performances et statistiques des 14 derniers jours."
      />

      <div className="flex-1 overflow-y-auto space-y-5 p-4 sm:p-6 pb-20 md:pb-6">

        {/* Intro banner */}
        <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-primary/5 via-transparent to-transparent px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Aperçu de l&apos;engagement</h3>
              <p className="text-xs text-muted-foreground">
                Suivez l&apos;évolution de vos conversations automatiques et le comportement de votre audience.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground border border-border/40 font-medium shrink-0">
            <Sparkles className="size-3.5 text-primary" />
            14 jours
          </div>
        </div>

        {totalMessages === 0 && (
          <EmptyState
            icon={BarChart3}
            title="Pas encore de données"
            description="Les statistiques apparaîtront ici dès que votre compte recevra ses premiers messages."
          />
        )}

        {/* ── Stat grid ── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatBadge
            label="Messages reçus"
            value={summary.messagesReceived}
            icon={MessageSquare}
            accent="var(--color-primary)"
          />
          <StatBadge
            label="Réponses auto."
            value={summary.autoReplies}
            icon={Zap}
            accent="#f59e0b"
          />
          <StatBadge
            label="Taux de réponse"
            value={`${summary.responseRate}%`}
            icon={TrendingUp}
            accent="#22c55e"
          />
          <StatBadge
            label="Nouveaux contacts"
            value={summary.newContacts}
            icon={Users}
            accent="#8b5cf6"
          />
        </div>

        {/* Secondary stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/40 bg-card/60 px-4 py-3 flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <MessagesSquare className="size-4 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">{summary.uniqueConversations}</p>
              <p className="text-[10.5px] text-muted-foreground">Conversations</p>
            </div>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/60 px-4 py-3 flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
              <SendHorizontal className="size-4 text-orange-500" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">{summary.totalOutgoing}</p>
              <p className="text-[10.5px] text-muted-foreground">Msgs envoyés</p>
            </div>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/60 px-4 py-3 flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
              <Clock className="size-4 text-purple-500" />
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums">
                {totalMessages > 0 ? formatHour(summary.peakHour) : '—'}
              </p>
              <p className="text-[10.5px] text-muted-foreground">Heure de pointe</p>
            </div>
          </div>
        </div>

        {/* ── Commerce funnel + revenue ── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatBadge label="Sessions démarrées" value={funnel.sessionsStarted} icon={ShoppingCart} accent="#0ea5e9" />
          <StatBadge label="Commandes confirmées" value={funnel.ordersConfirmed} icon={PackageCheck} accent="#22c55e" />
          <StatBadge label="Chiffre d'affaires" value={`${revenue.totalRevenue.toLocaleString('fr-FR')} DA`} icon={Wallet} accent="#f59e0b" />
          <StatBadge label="Panier moyen" value={`${Math.round(revenue.averageOrderValue).toLocaleString('fr-FR')} DA`} icon={Receipt} accent="#8b5cf6" />
        </div>

        {/* IA vs humain breakdown */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-semibold">Qui a répondu ?</CardTitle>
            <CardDescription className="text-xs">IA · Humain (inbox) · Sans réponse</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {(() => {
              const handlingTotal = handling.aiHandled + handling.humanHandled + handling.noReply
              return [
                { label: 'Réponses IA', value: handling.aiHandled, color: 'var(--color-primary)' },
                { label: 'Réponses humaines (inbox)', value: handling.humanHandled, color: '#8b5cf6' },
                { label: 'Sans réponse', value: handling.noReply, color: '#ef4444' },
              ].map(({ label, value, color }) => {
                const pct = handlingTotal > 0 ? Math.round((value / handlingTotal) * 100) : 0
                return (
                  <div key={label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="tabular-nums font-medium text-foreground">
                        {value} <span className="text-muted-foreground/60">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })
            })()}
          </CardContent>
        </Card>

        {/* Main chart */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Volume de messagerie</CardTitle>
                <CardDescription className="mt-0.5 text-xs">Messages reçus vs réponses automatiques par jour</CardDescription>
              </div>
              {totalMessages > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-muted/50 px-2.5 py-1 text-[10px] text-muted-foreground border border-border/30">
                  <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="min-h-[220px] w-full">
              <MessagesChart points={points} />
            </div>
          </CardContent>
        </Card>

        {/* Response rate breakdown */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-semibold">Répartition des messages</CardTitle>
            <CardDescription className="text-xs">Entrants · Sortants · Automatisés</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {[
              { label: 'Messages reçus', value: summary.messagesReceived, total: totalMessages, color: 'var(--color-primary)' },
              { label: 'Réponses automatiques', value: summary.autoReplies, total: totalMessages, color: '#22c55e' },
              { label: 'Msgs envoyés manuellement', value: Math.max(0, summary.totalOutgoing - summary.autoReplies), total: totalMessages, color: '#f59e0b' },
            ].map(({ label, value, total, color }) => {
              const pct = total > 0 ? Math.round((value / total) * 100) : 0
              return (
                <div key={label} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="tabular-nums font-medium text-foreground">{value} <span className="text-muted-foreground/60">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
