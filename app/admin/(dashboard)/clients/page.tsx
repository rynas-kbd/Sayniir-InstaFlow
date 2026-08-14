import Link from 'next/link'
import Image from 'next/image'
import { Camera, UserPlus, Search, Users, ShieldCheck } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { PLAN_CONFIG, getPlanDisplay, type PlanKey } from '@/lib/plans'
import { PageHeader } from '@/components/app-shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusDot } from '@/components/ui/status-dot'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getAvatarColor, getInitials } from '@/lib/avatar-color'
import { cn } from '@/lib/utils'
import { getT } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

interface ClientSubscription {
  id: string
  plan: string | null
  status: string
  expires_at: string | null
  amount_paid: number | null
}

interface ClientChannelAccount {
  instagram_username: string | null
  page_picture_url: string | null
  is_active: boolean
}

interface ClientRow {
  id: string
  full_name: string | null
  email: string | null
  role: string
  created_at: string
  admin_notes: string | null
  subscriptions: ClientSubscription[] | ClientSubscription | null
  channel_accounts: ClientChannelAccount[] | ClientChannelAccount | null
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>
}) {
  const { q = '', role: roleFilter = 'client' } = await searchParams
  const supabase = createAdminClient()
  const t = await getT()

  const STATUS_LABEL: Record<string, string> = {
    active: t('admin.common.status.active'),
    inactive: t('admin.common.status.inactive'),
    expired: t('admin.common.status.expired'),
  }

  let query = supabase
    .from('profiles')
    .select(
      `id, full_name, email, role, created_at, admin_notes,
      subscriptions(id, plan, status, expires_at, amount_paid),
      channel_accounts(instagram_username, page_picture_url, is_active)`
    )
    .order('created_at', { ascending: false })

  if (roleFilter !== 'all') query = query.eq('role', roleFilter)
  if (q.trim()) query = query.or(`full_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`)

  const [{ data: users }, { count: clientCount }, { count: adminCount }] = await Promise.all([
    query,
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
  ])

  const tabs = [
    { key: 'client', label: t('admin.clients.list.tabClients'), count: clientCount ?? 0, icon: Users },
    { key: 'admin', label: t('admin.clients.list.tabAdmins'), count: adminCount ?? 0, icon: ShieldCheck },
    { key: 'all', label: t('admin.clients.list.tabAll'), count: (clientCount ?? 0) + (adminCount ?? 0), icon: null },
  ]

  const rows = (users ?? []) as ClientRow[]

  const resultsDescription = `${t.plural('admin.clients.list.resultsCount', rows.length)}${q ? t('admin.clients.list.forQuery', { query: q }) : ''}`

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={t('admin.clients.list.title')}
        description={resultsDescription}
        actions={
          <Button nativeButton={false} render={<Link href="/admin/clients/new" />}>
            <UserPlus className="size-4" /> {t('admin.clients.list.newUserButton')}
          </Button>
        }
      />

      <div className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            {tabs.map((tab) => {
              const isActive = roleFilter === tab.key
              const Icon = tab.icon
              return (
                <Link
                  key={tab.key}
                  href={`/admin/clients?role=${tab.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {Icon && <Icon className="size-3" />}
                  {tab.label}
                  <span className={cn('text-[10px]', isActive ? 'text-primary' : 'text-muted-foreground/70')}>
                    {tab.count}
                  </span>
                </Link>
              )
            })}
          </div>

          <form method="GET" action="/admin/clients" className="relative max-w-70 flex-1">
            <input type="hidden" name="role" value={roleFilter} />
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder={t('admin.clients.list.searchPlaceholder')} className="pl-8" />
          </form>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          {rows.length === 0 ? (
            <div className="py-14 text-center">
              <Users className="mx-auto mb-3 size-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{q ? t('admin.clients.list.noResultsForQuery', { query: q }) : t('admin.clients.list.noUsersFound')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.clients.list.colUser')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('admin.clients.list.colInstagramAccount')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('admin.clients.list.colPlan')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('admin.clients.list.colRole')}</TableHead>
                  <TableHead>{t('admin.clients.list.colStatus')}</TableHead>
                  <TableHead className="text-right">{t('admin.clients.list.colAction')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((user) => {
                  const ig = Array.isArray(user.channel_accounts) ? user.channel_accounts[0] : user.channel_accounts
                  const sub = Array.isArray(user.subscriptions) ? user.subscriptions[0] : user.subscriptions
                  const expDate = sub?.expires_at ? new Date(sub.expires_at) : null
                  const isExpired = expDate ? expDate < new Date() : false
                  const status = sub?.status ?? 'inactive'
                  const displayStatus = isExpired && status === 'active' ? 'expired' : status
                  const name = user.full_name ?? t('admin.clients.list.noName')
                  const planKey = (sub?.plan ?? 'free') as PlanKey
                  const planCfg = PLAN_CONFIG[planKey]
                  const planDisplay = getPlanDisplay(planKey, t)

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="whitespace-normal">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                              getAvatarColor(user.id)
                            )}
                          >
                            {getInitials(name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-foreground">{name}</p>
                            <p className="truncate text-xs text-muted-foreground">{user.email ?? '—'}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          {ig?.page_picture_url ? (
                            <Image src={ig.page_picture_url} alt="" width={22} height={22} unoptimized className="size-[22px] rounded-full object-cover" />
                          ) : (
                            <div className="flex size-[22px] items-center justify-center rounded-full bg-muted">
                              <Camera className="size-3 text-muted-foreground" strokeWidth={1.75} />
                            </div>
                          )}
                          <span className="truncate text-[13px] text-muted-foreground">
                            {ig?.instagram_username ? `@${ig.instagram_username}` : '—'}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', planCfg.badgeClass)}>
                          {planDisplay.label}
                        </span>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? t('admin.common.role.admin') : t('admin.common.role.client')}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <StatusDot
                          tone={displayStatus === 'active' ? 'success' : displayStatus === 'expired' ? 'destructive' : 'neutral'}
                          label={STATUS_LABEL[displayStatus] ?? displayStatus}
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/admin/clients/${user.id}`} />}>
                          {t('admin.clients.list.manageButton')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  )
}
