import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CreditCard, Bot, User, Trash2, ShieldCheck, StickyNote, X, Phone } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAvatarColor, getInitials } from '@/lib/avatar-color'
import { PLAN_CONFIG, getPlanDisplay, type PlanKey } from '@/lib/plans'
import { cn } from '@/lib/utils'
import type { Translator } from '@/lib/i18n/translate'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/status-dot'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { WhatsAppManualConnectForm } from '@/components/admin/whatsapp-manual-connect-form'
import { getLocale, getT } from '@/lib/i18n/server'

import DeleteClientButton from './DeleteClientButton'
import SubscriptionForm from './SubscriptionForm'
import {
  addKeyword,
  deleteKeyword,
  toggleKeyword,
  updateProfile,
  changeRole,
  saveAdminNotes,
} from './actions'

export const dynamic = 'force-dynamic'

interface AutomationRule {
  id: string
  name: string
  trigger_type: string
  trigger_keywords: string[] | null
  response_text: string
  is_active: boolean
}

// Plan badge helper
function PlanBadge({ plan, t }: { plan: PlanKey; t: Translator }) {
  const cfg = PLAN_CONFIG[plan]
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', cfg.badgeClass)}>
      {getPlanDisplay(plan, t).label}
    </span>
  )
}

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient()
  const { id: userId } = await params
  const t = await getT()
  const locale = await getLocale()

  const STATUS_LABEL: Record<string, string> = {
    active: t('admin.common.status.active'),
    inactive: t('admin.common.status.inactive'),
    expired: t('admin.common.status.expired'),
  }

  const [{ data: profile }, { data: subscription }, { data: channelAccounts }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role, admin_notes, created_at').eq('id', userId).single(),
    supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle(),
    // A user can have several accounts (1 free / 1 starter / 3 pro / unlimited business — see
    // lib/plans/restrictions.ts) — .maybeSingle() here used to throw PGRST116 for
    // any client with more than one. This picks the first for the header/keyword
    // panels below; a fuller multi-account admin view is future work.
    supabase
      .from('channel_accounts')
      .select('id, platform, instagram_username, page_picture_url, phone_number, phone_number_id, is_active, connected_at')
      .eq('user_id', userId)
      .order('connected_at', { ascending: true }),
  ])

  if (!profile) notFound()

  // Unchanged from before: picks the first connected account regardless of
  // platform for the header/keyword panels (automation_rules isn't
  // IG-specific) — see the comment on the query above.
  const igAccount = channelAccounts?.[0] ?? null
  const whatsappAccounts = channelAccounts?.filter((a) => a.platform === 'whatsapp') ?? []
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/webhooks/whatsapp`
  const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN ?? ''

  const { data: rules } = await supabase
    .from('automation_rules')
    .select('id, name, trigger_type, trigger_keywords, response_text, is_active, created_at')
    .eq('channel_account_id', igAccount?.id ?? '')
    .order('created_at', { ascending: false })

  const currentStatus = subscription?.status ?? 'inactive'
  const currentPlan: PlanKey = (subscription?.plan as PlanKey) ?? 'free'
  const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at).toISOString().split('T')[0] : ''

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/admin/clients" className="mb-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="size-3.5" /> {t('admin.clients.detail.backLink')}
      </Link>

      {/* ── Client header ── */}
      <div className="glass-banner mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-5">
        <div className="flex items-center gap-4">
          {igAccount?.page_picture_url ? (
            <Image
              src={igAccount.page_picture_url}
              alt=""
              width={64}
              height={64}
              unoptimized
              className="size-16 rounded-full border-2 border-border object-cover"
            />
          ) : (
            <div
              className={`flex size-16 items-center justify-center rounded-full border-2 border-border text-base font-semibold ${getAvatarColor(userId)}`}
            >
              {profile.full_name ? getInitials(profile.full_name) : <User className="size-6" />}
            </div>
          )}
          <div>
            <div className="mb-1 flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">{profile.full_name ?? t('admin.clients.detail.unnamedClient')}</h1>
              <PlanBadge plan={currentPlan} t={t} />
            </div>
            <p className="text-xs text-muted-foreground">
              {igAccount?.instagram_username ? `@${igAccount.instagram_username} · ` : ''}
              {t('admin.clients.detail.registeredOn', { date: new Date(profile.created_at).toLocaleDateString(locale) })}
            </p>
          </div>
        </div>
        <StatusDot
          tone={currentStatus === 'active' ? 'success' : currentStatus === 'expired' ? 'destructive' : 'neutral'}
          label={STATUS_LABEL[currentStatus] ?? currentStatus}
        />
      </div>

      <div className="space-y-5">
        {/* ── Profile ── */}
        <Card>
          <CardHeader>
            <SectionTitle icon={User} title={t('admin.clients.detail.profileSection.title')} />
          </CardHeader>
          <CardContent>
            <form
              action={async (formData: FormData) => {
                'use server'
                await updateProfile(userId, {
                  full_name: formData.get('full_name') as string,
                  email: formData.get('email') as string,
                  new_password: (formData.get('new_password') as string) || undefined,
                })
              }}
              className="flex flex-col gap-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name">{t('admin.clients.detail.profileSection.fullNameLabel')}</Label>
                  <Input id="full_name" name="full_name" defaultValue={profile.full_name ?? ''} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t('admin.clients.detail.profileSection.emailLabel')}</Label>
                  <Input id="email" name="email" type="email" defaultValue={profile.email ?? ''} required />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="new_password">{t('admin.clients.detail.profileSection.newPasswordLabel')}</Label>
                  <Input id="new_password" name="new_password" placeholder={t('admin.clients.detail.profileSection.newPasswordPlaceholder')} />
                </div>
              </div>
              <Button type="submit" className="self-start">
                {t('admin.clients.detail.profileSection.submitButton')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Role ── */}
        <Card>
          <CardHeader>
            <SectionTitle
              icon={ShieldCheck}
              title={t('admin.clients.detail.roleSection.title')}
              sub={
                <>
                  {t('admin.clients.detail.roleSection.currentPrefix')}
                  <span className={profile.role === 'admin' ? 'font-bold text-primary' : 'font-bold text-success'}>
                    {profile.role === 'admin' ? t('admin.common.role.admin') : t('admin.common.role.client')}
                  </span>
                </>
              }
            />
          </CardHeader>
          <CardContent>
            <form
              action={async (formData: FormData) => {
                'use server'
                await changeRole(userId, formData.get('role') as 'client' | 'admin')
              }}
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
            >
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="role-select">{t('admin.clients.detail.roleSection.newRoleLabel')}</Label>
                <select
                  id="role-select"
                  name="role"
                  defaultValue={profile.role ?? 'client'}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="client">{t('admin.clients.detail.roleSection.clientOption')}</option>
                  <option value="admin">{t('admin.clients.detail.roleSection.adminOption')}</option>
                </select>
              </div>
              <Button type="submit" variant="outline">
                {t('admin.clients.detail.roleSection.changeButton')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionTitle icon={CreditCard} title={t('admin.clients.detail.subscriptionSection.title')} sub={t('admin.clients.detail.subscriptionSection.description')} />
          </CardHeader>
          <CardContent>
            <SubscriptionForm
              userId={userId}
              currentPlan={currentPlan}
              currentStatus={currentStatus as 'active' | 'inactive' | 'expired'}
              expiresAt={expiresAt}
              amountPaid={subscription?.amount_paid ?? null}
              paymentNotes={subscription?.payment_notes ?? null}
              customPriceMonthlyDzd={subscription?.custom_price_monthly_dzd ?? null}
              customPriceAnnualDzd={subscription?.custom_price_annual_dzd ?? null}
            />
          </CardContent>
        </Card>

        {/* ── Keywords ── */}
        <Card>
          <CardHeader>
            <SectionTitle icon={Bot} title={t('admin.clients.detail.keywordsSection.title')} />
          </CardHeader>
          <CardContent>
            {igAccount ? (
              <>
                <form
                  action={async (formData: FormData) => {
                    'use server'
                    const keyword = formData.get('keyword') as string
                    const reply = formData.get('reply_text') as string
                    if (keyword && reply) await addKeyword(igAccount.id, userId, keyword, reply)
                  }}
                  className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.5fr_auto]"
                >
                  <Input name="keyword" placeholder={t('admin.clients.detail.keywordsSection.keywordPlaceholder')} required />
                  <Input name="reply_text" placeholder={t('admin.clients.detail.keywordsSection.replyPlaceholder')} required />
                  <Button type="submit">{t('admin.clients.detail.keywordsSection.addButton')}</Button>
                </form>

                {!rules || rules.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground">{t('admin.clients.detail.keywordsSection.noneConfigured')}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {(rules as AutomationRule[]).map((rule) => (
                      <div
                        key={rule.id}
                        className={`grid grid-cols-1 items-center gap-3 rounded-xl border px-4 py-3 sm:grid-cols-[180px_1fr_auto] ${
                          rule.is_active ? 'border-success/25 bg-success/5' : 'border-border bg-muted/40'
                        }`}
                      >
                        <span className="truncate text-[13px] font-bold text-primary">
                          {rule.trigger_type === 'any_message' ? t('admin.clients.detail.keywordsSection.anyMessage') : rule.trigger_keywords?.join(', ')}
                        </span>
                        <span className="truncate text-[13px] text-muted-foreground">{rule.response_text}</span>
                        <div className="flex items-center gap-2">
                          <form
                            action={async () => {
                              'use server'
                              await toggleKeyword(rule.id, !rule.is_active, userId)
                            }}
                          >
                            <button
                              type="submit"
                              className={`rounded-md border px-2.5 py-1 text-[11px] font-bold ${
                                rule.is_active ? 'border-success/30 bg-success/15 text-success' : 'border-border text-muted-foreground'
                              }`}
                            >
                              {rule.is_active ? 'ON' : 'OFF'}
                            </button>
                          </form>
                          <form
                            action={async () => {
                              'use server'
                              await deleteKeyword(rule.id, userId)
                            }}
                          >
                            <button
                              type="submit"
                              aria-label={t('admin.clients.detail.keywordsSection.deleteAria')}
                              className="flex items-center justify-center rounded-md border border-destructive/20 bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/15"
                            >
                              <X className="size-3.5" />
                            </button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-xs text-muted-foreground">{t('admin.clients.detail.keywordsSection.noAccountConnected')}</p>
            )}
          </CardContent>
        </Card>

        {/* ── Admin notes ── */}
        <Card>
          <CardHeader>
            <SectionTitle icon={StickyNote} title={t('admin.clients.detail.notesSection.title')} sub={t('admin.clients.detail.notesSection.description')} />
          </CardHeader>
          <CardContent>
            <form
              action={async (formData: FormData) => {
                'use server'
                await saveAdminNotes(userId, (formData.get('admin_notes') as string) ?? '')
              }}
              className="flex flex-col gap-3"
            >
              <Textarea name="admin_notes" defaultValue={profile.admin_notes ?? ''} placeholder={t('admin.clients.detail.notesSection.placeholder')} rows={4} />
              <Button type="submit" variant="outline" className="self-start">
                {t('admin.clients.detail.notesSection.saveButton')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── WhatsApp manuel ── */}
        <Card>
          <CardHeader>
            <SectionTitle
              icon={Phone}
              title={t('admin.clients.detail.whatsappSection.title')}
              sub={t('admin.clients.detail.whatsappSection.description')}
            />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {whatsappAccounts.length > 0 && (
              <div className="flex flex-col gap-2">
                {whatsappAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs ${
                      acc.is_active ? 'border-success/25 bg-success/5' : 'border-border bg-muted/40'
                    }`}
                  >
                    <span className="font-medium text-foreground">{acc.phone_number ?? acc.phone_number_id}</span>
                    <StatusDot tone={acc.is_active ? 'success' : 'neutral'} label={acc.is_active ? t('admin.common.status.active') : t('admin.common.status.inactive')} />
                  </div>
                ))}
              </div>
            )}
            <WhatsAppManualConnectForm userId={userId} webhookUrl={webhookUrl} verifyToken={verifyToken} />
          </CardContent>
        </Card>

        {/* ── Danger zone ── */}
        <Card className="border-destructive/20">
          <CardHeader>
            <SectionTitle icon={Trash2} title={t('admin.clients.detail.dangerSection.title')} />
          </CardHeader>
          <CardContent>
            <p className="mb-4 max-w-lg text-xs leading-relaxed text-muted-foreground">
              {t('admin.clients.detail.dangerSection.warningPrefix')}
              <span className="font-bold text-destructive">{t('admin.clients.detail.dangerSection.warningBold')}</span>
              {t('admin.clients.detail.dangerSection.warningSuffix')}
            </p>
            <DeleteClientButton userId={userId} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SectionTitle({
  icon: Icon,
  title,
  sub,
}: {
  icon: React.ElementType
  title: string
  sub?: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
        <CardTitle>{title}</CardTitle>
      </div>
      {sub && <CardDescription className="mt-1">{sub}</CardDescription>}
    </div>
  )
}
