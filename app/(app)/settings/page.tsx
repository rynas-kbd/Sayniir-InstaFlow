import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/app-shell/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SignOutButton } from '@/components/settings/sign-out-button'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const instagramUsername = user!.user_metadata?.instagram_username

  const fields = [
    { label: 'Email', value: user!.email ?? '' },
    { label: 'Compte Instagram', value: instagramUsername ? `@${instagramUsername}` : '—' },
    {
      label: 'Membre depuis',
      value: new Date(user!.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }),
    },
    { label: 'ID utilisateur', value: user!.id, mono: true },
  ]

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Paramètres" description="Gérez votre compte et vos préférences." />

      <div className="space-y-4 p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Informations du compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map(({ label, value, mono }) => (
              <div key={label} className="space-y-1.5">
                <Label>{label}</Label>
                <Input readOnly defaultValue={value} className={mono ? 'font-mono text-xs text-muted-foreground' : ''} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-destructive">Zone de danger</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">Déconnecter votre session sur cet appareil.</p>
            <SignOutButton />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
