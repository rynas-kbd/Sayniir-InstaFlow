import Link from 'next/link'
import { MessageSquare, Zap, Camera, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell/page-header'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Dashboard"
        description="Bienvenue — gérez vos automatisations."
        actions={
          <Badge variant={subOk ? 'default' : isExpired ? 'destructive' : 'secondary'}>
            {subOk ? 'Abonnement actif' : isExpired ? 'Abonnement expiré' : 'Abonnement inactif'}
          </Badge>
        }
      />

      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard title="Messages reçus" value={totalMessages ?? 0} icon={MessageSquare} />
          <StatCard title="Réponses auto." value={totalReplied} icon={Zap} />
          <StatCard title="Comptes actifs" value={`${activeAccounts}/${safeAccounts.length}`} icon={Camera} />
          <StatCard
            title="Taux de réponse"
            value={totalMessages ? `${Math.round((totalReplied / totalMessages) * 100)}%` : '0%'}
            icon={CheckCircle2}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Activité récente</CardTitle>
              <CardDescription>Derniers messages reçus</CardDescription>
              <CardAction>
                <Button variant="link" size="sm" render={<Link href="/inbox" />}>
                  Voir tout
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {safeMessages.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Aucun message reçu.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {safeMessages.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{m.sender_id}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.message_text}</p>
                      </div>
                      {m.auto_reply_sent && (
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          Auto-répondu
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Comptes liés</CardTitle>
                <CardDescription>
                  {safeAccounts.length} compte{safeAccounts.length !== 1 ? 's' : ''}
                </CardDescription>
                <CardAction>
                  <Button variant="link" size="sm" render={<Link href="/accounts" />}>
                    Gérer
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                {safeAccounts.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Aucun compte connecté.</p>
                ) : (
                  <ul className="space-y-2">
                    {safeAccounts.slice(0, 3).map((a) => (
                      <li key={a.id} className="flex items-center justify-between text-sm">
                        <span className="truncate text-foreground">
                          {a.instagram_username ?? a.page_name ?? a.platform}
                        </span>
                        <Badge variant={a.is_active ? 'default' : 'secondary'} className="text-[10px]">
                          {a.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Règles actives</CardTitle>
                <CardDescription>
                  {safeRules.length} règle{safeRules.length !== 1 ? 's' : ''}
                </CardDescription>
                <CardAction>
                  <Button variant="link" size="sm" render={<Link href="/automation" />}>
                    Gérer
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                {safeRules.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Aucune règle active.</p>
                ) : (
                  <ul className="space-y-2">
                    {safeRules.map((r) => (
                      <li key={r.id} className="rounded-md border border-border bg-muted/40 p-2.5">
                        <Badge variant="outline" className="mb-1 max-w-full truncate text-[10px]">
                          {r.trigger_type === 'any_message' ? 'Tout message' : r.trigger_keywords?.join(', ')}
                        </Badge>
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
