'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Identifiants administrateur incorrects.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user?.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      await supabase.auth.signOut()
      setError("Accès refusé. Ce compte n'est pas administrateur.")
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-[400px]">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-8 text-center">
              <p className="text-[15px] font-semibold tracking-tight text-foreground">Sayniir</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Espace admin — accès restreint</p>
            </div>

            {error && (
              <div className="mb-5 rounded-md border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-center text-[13px] text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Adresse email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sayniir.app"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Mot de passe</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                />
              </div>
              <Button type="submit" size="lg" disabled={loading} className="mt-1 w-full">
                {loading ? 'Vérification…' : 'Accéder au panel'}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Espace client ?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Se connecter ici
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
