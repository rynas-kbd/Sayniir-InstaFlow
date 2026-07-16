import { Mail, AtSign, Calendar, Hash, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SignOutButton } from '@/components/settings/sign-out-button'
import { getAvatarColor, getInitials } from '@/lib/avatar-color'

function SectionTitle({
  icon: Icon,
  title,
  sub,
  destructive,
}: {
  icon: React.ElementType
  title: string
  sub?: string
  destructive?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Icon className={`size-3.5 ${destructive ? 'text-destructive' : 'text-muted-foreground'}`} strokeWidth={1.75} />
        <CardTitle className={destructive ? 'text-destructive' : undefined}>{title}</CardTitle>
      </div>
      {sub && <CardDescription className="mt-1">{sub}</CardDescription>}
    </div>
  )
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const instagramUsername = user!.user_metadata?.instagram_username
  const displayName = instagramUsername ? `@${instagramUsername}` : (user!.email ?? 'Utilisateur')

  const fields = [
    { label: 'Email', value: user!.email ?? '—', icon: Mail },
    { label: 'Compte Instagram', value: instagramUsername ? `@${instagramUsername}` : '—', icon: AtSign },
    {
      label: 'Membre depuis',
      value: new Date(user!.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }),
      icon: Calendar,
    },
    { label: 'ID utilisateur', value: user!.id, icon: Hash, mono: true },
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Paramètres" description="Gérez votre compte et vos préférences." />

        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-card to-card px-5 py-5">
            <div className={`flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${getAvatarColor(user!.id)}`}>
              {getInitials(displayName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{user!.email}</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informations du compte</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {fields.map(({ label, value, icon: Icon, mono }) => (
                <div key={label} className="flex items-center gap-3 px-5 py-3">
                  <Icon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                  <span className="w-36 shrink-0 text-xs text-muted-foreground">{label}</span>
                  <span className={`truncate text-sm text-foreground ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader>
              <SectionTitle icon={ShieldAlert} title="Zone de danger" sub="Déconnecter votre session sur cet appareil." destructive />
            </CardHeader>
            <CardContent>
              <SignOutButton />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
