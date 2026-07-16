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
        .select('id, sender_id, sender_username, message_text, auto_reply_sent, created_at', { count: 'exact' })
        .in('channel_account_id', safeIds)
        .eq('direction', 'incoming')
        .order('created_at', { ascending: false })
        .limit(6),
      supabase.from('subscriptions').select('status, expires_at').eq('user_id', user!.id).maybeSingle(),
      supabase
        .from('automation_rules')
        .select('id, name, trigger_type, trigger_keywords, response_text, is_active')
        .in('channel_account_id', safeIds)
        .order('created_at', { ascending: false })
        .limit(3),
    ])

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
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              <span className={`size-2 rounded-full ${subOk ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
              {subOk ? 'Plan Pro Actif' : 'Version Gratuite'}
            </span>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto space-y-6 p-4 md:p-6">
        {/* Welcome Premium Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-6 sm:px-8">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" />
              Nouveauté : Refonte premium
            </div>
            <h2 className="mt-3 text-lg font-bold text-foreground sm:text-xl">
              Bienvenue sur votre espace d&apos;automatisation !
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Connectez votre compte Instagram, configurez vos règles de messagerie automatique, et créez des flows visuels pour piloter vos conversions DMs.
            </p>
          </div>
          <div className="absolute right-0 bottom-0 top-0 hidden w-1/3 items-center justify-center opacity-10 lg:flex">
            <Zap className="size-40 text-primary" strokeWidth={1} />
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            title="Messages reçus"
            value={totalMessages ?? 0}
            icon={MessageSquare}
          />
          <StatCard
            title="Réponses automatiques"
            value={totalReplied}
            icon={Zap}
          />
          <StatCard
            title="Comptes connectés"
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
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          
          {/* Activity feed */}
          <Card className="flex flex-col justify-between">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Activité récente</CardTitle>
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
                      className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-muted/30"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
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
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3 text-emerald-500" /> Répondu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
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

          {/* Right column */}
          <div className="flex flex-col gap-6">
            
            {/* Connected accounts */}
            <Card>
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Comptes liés</CardTitle>
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
                  <ul className="space-y-2">
                    {safeAccounts.slice(0, 4).map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="relative flex size-2 shrink-0">
                            {a.is_active && (
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            )}
                            <span className={`relative inline-flex size-2 rounded-full ${a.is_active ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                          </span>
                          <span className="truncate text-xs font-semibold text-foreground">
                            @{a.instagram_username ?? a.page_name ?? a.platform}
                          </span>
                        </div>
                        <Badge
                          variant={a.is_active ? 'secondary' : 'outline'}
                          className={`text-[10px] py-0 px-2 font-medium ${
                            a.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {a.is_active ? 'Connecté' : 'Hors ligne'}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Active rules summary */}
            <Card>
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Règles actives</CardTitle>
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
                    <p className="text-xs text-muted-foreground">Aucune règle configurée.</p>
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
                  <ul className="space-y-3.5">
                    {safeRules.map((r) => (
                      <li key={r.id} className="relative rounded-xl border border-border/50 bg-muted/20 px-3.5 py-3">
                        <div className="absolute top-3 right-3 flex size-2">
                          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                        </div>
                        <div className="mb-1.5 flex flex-col gap-0.5">
                          <span className="text-[11px] font-semibold text-foreground line-clamp-1">{r.name}</span>
                          <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
                            {r.trigger_type === 'any_message'
                              ? 'Déclencheur : Tout DM'
                              : `Mots-clés : ${r.trigger_keywords?.slice(0, 2).join(', ')}`}
                          </span>
                        </div>
                        <p className="truncate text-xs italic text-muted-foreground leading-relaxed">
                          &ldquo;{r.response_text}&rdquo;
                        </p>
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
