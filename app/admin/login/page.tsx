'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthCard } from '@/components/auth/auth-card'
import { useT } from '@/components/i18n-provider'

export default function AdminLoginPage() {
  const t = useT()
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
      setError(t('admin.login.errorInvalidCredentials'))
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
      setError(t('admin.login.errorAccessDenied'))
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary/8 via-background to-background px-6 py-12">
      <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative w-full max-w-[400px]">
        <AuthCard tagline={t('admin.login.tagline')}>
          {error && (
            <div className="mb-5 rounded-md border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-center text-[13px] text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">{t('admin.login.emailLabel')}</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@instaflow.app"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">{t('admin.login.passwordLabel')}</Label>
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
              {loading ? t('admin.login.submitLoading') : t('admin.login.submit')}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t('admin.login.clientSpacePrompt')}{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t('admin.login.clientSpaceLink')}
            </Link>
          </p>
        </AuthCard>
      </div>
    </main>
  )
}
