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
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
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

  const { data: accounts } = await supabase
    .from('channel_accounts')
    .select('id, platform, page_name, instagram_username, is_active')
    .eq('user_id', user!.id)
    .order('connected_at', { ascending: false })

  const safeAccounts = accounts ?? []
  const accountIds = safeAccounts.map((a) => a.id)
  const safeIds = accountIds.length ? accountIds : ['00000000-0000-0000-0000-000000000000']

  const [{ data: messages, count: totalMessages }, { data: subscription }, { data: rules }] =
    await Promise.all([
      supabase
        .from('message_logs')
        .select('id, sender_id, message_text, auto_reply_sent, created_at', { count: 'exact' })
        .in('channel_account_id', safeIds)
        .eq('direction', 'incoming')
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('subscriptions').select('status, expires_at').eq('user_id', user!.id).maybeSingle(),
      supabase
        .from('automation_rules')
        .select('id, trigger_type, trigger_keywords, response_text')
        .in('channel_account_id', safeIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4),
    ])

  const safeMessages = messages ?? []
  const safeRules = rules ?? []
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
        description="Vue d'ensemble de vos automatisations."
        actions={
          <StatusDot
            tone={subOk ? 'success' : isExpired ? 'destructive' : 'neutral'}
            label={subOk ? 'Abonnement actif' : isExpired ? 'Abonnement expiré' : 'Aucun abonnement'}
          />
        }
      />

      <div className="flex-1 overflow-y-auto space-y-6 p-4 md:p-6">
        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            title="Messages reçus"
            value={totalMessages ?? 0}
            icon={MessageSquare}
            trend={totalMessages ? undefined : undefined}
          />
          <StatCard
            title="Réponses auto."
            value={totalReplied}
            icon={Zap}
          />
          <StatCard
            title="Comptes actifs"
            value={`${activeAccounts} / ${safeAccounts.length}`}
            icon={Link2}
          />
          <StatCard
            title="Taux de réponse"
            value={`${replyRate}%`}
            icon={TrendingUp}
          />
        </div>

        {/* ── Main content grid ── */}
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* Activity feed */}
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>Derniers messages entrants</CardDescription>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/inbox" />}
                  className="cursor-pointer gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Voir tout <ArrowRight className="size-3" />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="p-0">
              {safeMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
                    <MessageSquare className="size-4.5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-foreground">Aucun message reçu</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Connectez un compte pour voir l'activité ici.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {safeMessages.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
                    >
                      {/* Avatar-like initial */}
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                        {(m.sender_id?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {m.sender_id}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{m.message_text}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {m.auto_reply_sent ? (
                          <CheckCircle2 className="size-3.5 text-success" />
                        ) : (
                          <Clock className="size-3.5 text-muted-foreground" />
                        )}
                        <span className="text-[11px] text-muted-foreground">
                          {formatTime(m.created_at)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Connected accounts */}
            <Card>
              <CardHeader>
                <CardTitle>Comptes liés</CardTitle>
                <CardDescription>
                  {safeAccounts.length} compte{safeAccounts.length !== 1 ? 's' : ''}
                </CardDescription>
                <CardAction>
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href="/accounts" />}
                    className="cursor-pointer gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Gérer <ArrowRight className="size-3" />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                {safeAccounts.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-muted">
                      <Link2 className="size-4 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <p className="text-xs text-muted-foreground">Aucun compte connecté.</p>
                    <Button
                      size="sm"
                      nativeButton={false}
                      render={<Link href="/accounts" />}
                      className="mt-3 cursor-pointer h-7 text-xs"
                    >
                      Connecter un compte
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {safeAccounts.slice(0, 4).map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between gap-2 rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`size-1.5 shrink-0 rounded-full ${a.is_active ? 'bg-success' : 'bg-muted-foreground'}`}
                          />
                          <span className="truncate text-sm text-foreground">
                            {a.instagram_username ?? a.page_name ?? a.platform}
                          </span>
                        </div>
                        <span className={`shrink-0 text-xs ${a.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                          {a.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Active rules */}
            <Card>
              <CardHeader>
                <CardTitle>Règles actives</CardTitle>
                <CardDescription>
                  {safeRules.length} règle{safeRules.length !== 1 ? 's' : ''} en cours
                </CardDescription>
                <CardAction>
                  <Button
                    variant="ghost"
                    size="sm"
                    nativeButton={false}
                    render={<Link href="/automation" />}
                    className="cursor-pointer gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Gérer <ArrowRight className="size-3" />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                {safeRules.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-muted">
                      <Zap className="size-4 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <p className="text-xs text-muted-foreground">Aucune règle active.</p>
                    <Button
                      size="sm"
                      nativeButton={false}
                      render={<Link href="/automation" />}
                      className="mt-3 cursor-pointer h-7 text-xs"
                    >
                      Créer une règle
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {safeRules.map((r) => (
                      <li key={r.id} className="rounded-md border border-border bg-muted/20 px-3 py-2.5">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <div className="size-1.5 rounded-full bg-success" />
                          <Badge variant="secondary" className="max-w-full truncate text-[11px]">
                            {r.trigger_type === 'any_message'
                              ? 'Tout message'
                              : r.trigger_keywords?.join(', ')}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{r.response_text}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
