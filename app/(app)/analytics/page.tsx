import { MessageSquare, Zap, TrendingUp, Users, Sparkles, BarChart3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getAnalyticsSummary, getMessagesTimeseries } from '@/lib/analytics/queries'
import { PageHeader } from '@/components/app-shell/page-header'
import { StatCard } from '@/components/dashboard/stat-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MessagesChart } from '@/components/analytics/messages-chart'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const to = new Date()
  const from = new Date(to.getTime() - 13 * 86400000)

  const [summary, points] = await Promise.all([
    getAnalyticsSummary(user!.id, from, to),
    getMessagesTimeseries(user!.id, from, to),
  ])

  return (
    <div className="flex h-full flex-col">
      <PageHeader 
        title="Analytics" 
        description="Analysez les performances et statistiques des 14 derniers jours." 
      />
      
      <div className="flex-1 overflow-y-auto space-y-6 p-4 sm:p-6">
        
        {/* Intro banner */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-5 py-5 flex items-center justify-between gap-4">
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
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground border border-border/40 font-medium">
            <Sparkles className="size-3.5 text-primary" />
            Mise à jour en direct
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard title="Messages reçus" value={summary.messagesReceived} icon={MessageSquare} />
          <StatCard title="Réponses auto." value={summary.autoReplies} icon={Zap} />
          <StatCard title="Taux de réponse" value={`${summary.responseRate}%`} icon={TrendingUp} />
          <StatCard title="Nouveaux contacts" value={summary.newContacts} icon={Users} />
        </div>

        {/* Graph representation */}
        <Card className="border border-border/70 hover:shadow-sm transition-all duration-200">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-sm font-semibold">Volume de messagerie</CardTitle>
            <CardDescription className="text-xs">Messages reçus vs réponses automatiques envoyées par jour</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <MessagesChart points={points} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
