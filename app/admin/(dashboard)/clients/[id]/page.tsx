import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CreditCard, Bot, User, Trash2, ShieldCheck, StickyNote, X } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { StatusDot } from '@/components/ui/status-dot'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import DeleteClientButton from './DeleteClientButton'
import {
  updateSubscription,
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

const STATUS_LABEL: Record<string, string> = { active: 'Actif', inactive: 'Inactif', expired: 'Expiré' }

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = createAdminClient()
  const { id: userId } = await params

  const [{ data: profile }, { data: subscription }, { data: igAccount }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, role, admin_notes, created_at').eq('id', userId).single(),
    supabase.from('subscriptions').select('*').eq('user_id', userId).single(),
    supabase
      .from('channel_accounts')
      .select('id, instagram_username, page_picture_url, is_active, connected_at')
      .eq('user_id', userId)
      .single(),
  ])

  if (!profile) notFound()

  const { data: rules } = await supabase
    .from('automation_rules')
    .select('id, name, trigger_type, trigger_keywords, response_text, is_active, created_at')
    .eq('channel_account_id', igAccount?.id ?? '')
    .order('created_at', { ascending: false })

  const currentStatus = subscription?.status ?? 'inactive'
  const expiresAt = subscription?.expires_at ? new Date(subscription.expires_at).toISOString().split('T')[0] : ''

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin/clients" className="mb-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Retour aux clients
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
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
            <div className="flex size-16 items-center justify-center rounded-full border-2 border-border bg-card">
              <User className="size-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="mb-1 text-lg font-semibold tracking-tight text-foreground">{profile.full_name ?? 'Client sans nom'}</h1>
            <p className="text-xs text-muted-foreground">
              {igAccount?.instagram_username ? `@${igAccount.instagram_username} · ` : ''}
              Inscrit le {new Date(profile.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
        <StatusDot
          tone={currentStatus === 'active' ? 'success' : currentStatus === 'expired' ? 'destructive' : 'neutral'}
          label={STATUS_LABEL[currentStatus] ?? currentStatus}
        />
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <SectionTitle icon={User} title="Profil utilisateur" />
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
                  <Label htmlFor="full_name">Nom complet</Label>
                  <Input id="full_name" name="full_name" defaultValue={profile.full_name ?? ''} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input id="email" name="email" type="email" defaultValue={profile.email ?? ''} required />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="new_password">Nouveau mot de passe</Label>
                  <Input id="new_password" name="new_password" placeholder="Laisser vide pour conserver" />
                </div>
              </div>
              <Button type="submit" className="self-start">
                Mettre à jour
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionTitle
              icon={ShieldCheck}
              title="Rôle & permissions"
              sub={
                <>
                  Actuellement :{' '}
                  <span className={profile.role === 'admin' ? 'font-bold text-primary' : 'font-bold text-success'}>
                    {profile.role === 'admin' ? 'Administrateur' : 'Client'}
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
                <Label>Nouveau rôle</Label>
                <Select name="role" defaultValue={profile.role ?? 'client'}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" variant="outline">
                Changer
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionTitle icon={CreditCard} title="Abonnement" />
          </CardHeader>
          <CardContent>
            <form
              action={async (formData: FormData) => {
                'use server'
                await updateSubscription(userId, {
                  status: formData.get('status') as 'active' | 'inactive' | 'expired',
                  expires_at: (formData.get('expires_at') as string) || null,
                  amount_paid: formData.get('amount_paid') ? Number(formData.get('amount_paid')) : null,
                  payment_notes: (formData.get('payment_notes') as string) || null,
                })
              }}
              className="flex flex-col gap-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Statut</Label>
                  <Select name="status" defaultValue={currentStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                      <SelectItem value="expired">Expiré</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expires_at">Date d&apos;expiration</Label>
                  <Input id="expires_at" name="expires_at" type="date" defaultValue={expiresAt} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amount_paid">Montant payé (DZD)</Label>
                  <Input id="amount_paid" name="amount_paid" type="number" defaultValue={subscription?.amount_paid ?? ''} placeholder="ex: 2000" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="payment_notes">Notes de paiement</Label>
                  <Input id="payment_notes" name="payment_notes" defaultValue={subscription?.payment_notes ?? ''} placeholder="Payé cash le 20/05" />
                </div>
              </div>
              <Button type="submit" className="self-start">
                Enregistrer
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionTitle icon={Bot} title="Mots-clés & réponses" />
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
                  <Input name="keyword" placeholder="Mot-clé · ex : prix" required />
                  <Input name="reply_text" placeholder="Réponse automatique" required />
                  <Button type="submit">Ajouter</Button>
                </form>

                {!rules || rules.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground">Aucun mot-clé configuré.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {(rules as AutomationRule[]).map((rule) => (
                      <div
                        key={rule.id}
                        className={`grid grid-cols-1 items-center gap-3 rounded-md border px-4 py-3 sm:grid-cols-[180px_1fr_auto] ${
                          rule.is_active ? 'border-success/25 bg-success/5' : 'border-border bg-muted/40'
                        }`}
                      >
                        <span className="truncate text-[13px] font-bold text-primary">
                          {rule.trigger_type === 'any_message' ? 'Tout message' : rule.trigger_keywords?.join(', ')}
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
                              aria-label="Supprimer"
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
              <p className="text-center text-xs text-muted-foreground">Ce client n&apos;a pas encore connecté de compte.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionTitle icon={StickyNote} title="Notes admin" sub="Visibles uniquement par les administrateurs" />
          </CardHeader>
          <CardContent>
            <form
              action={async (formData: FormData) => {
                'use server'
                await saveAdminNotes(userId, (formData.get('admin_notes') as string) ?? '')
              }}
              className="flex flex-col gap-3"
            >
              <Textarea name="admin_notes" defaultValue={profile.admin_notes ?? ''} placeholder="Notes internes sur ce client…" rows={4} />
              <Button type="submit" variant="outline" className="self-start">
                Sauvegarder
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-destructive/20">
          <CardHeader>
            <SectionTitle icon={Trash2} title="Zone de danger" />
          </CardHeader>
          <CardContent>
            <p className="mb-4 max-w-lg text-xs leading-relaxed text-muted-foreground">
              La suppression de cet utilisateur est <span className="font-bold text-destructive">définitive</span>. Ses règles
              d&apos;automatisation, son abonnement et la liaison avec son compte seront immédiatement détruits.
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
