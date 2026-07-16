import { MessageSquare, Zap, Camera, Users } from 'lucide-react'
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
      <PageHeader title="Analytics" description="Performance des 14 derniers jours." />
      <div className="flex-1 overflow-y-auto space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard title="Messages reçus" value={summary.messagesReceived} icon={MessageSquare} />
          <StatCard title="Réponses auto." value={summary.autoReplies} icon={Zap} />
          <StatCard title="Taux de réponse" value={`${summary.responseRate}%`} icon={Camera} />
          <StatCard title="Nouveaux contacts" value={summary.newContacts} icon={Users} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Messages & réponses</CardTitle>
            <CardDescription>Volume quotidien sur les 14 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <MessagesChart points={points} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
