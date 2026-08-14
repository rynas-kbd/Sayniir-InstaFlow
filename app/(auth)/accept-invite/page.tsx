'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthCard } from '@/components/auth/auth-card'
import { useT } from '@/components/i18n-provider'

const MIN_PASSWORD_LENGTH = 8

/**
 * Landed on via the Supabase invite email's magic link (see
 * app/api/team/invite/route.ts) — the browser already holds an
 * authenticated session for the invited user at this point. This page only
 * needs to (1) let them set a password and (2) mark their team_members row
 * accepted (app/api/team/accept-invite/route.ts).
 */
export default function AcceptInvitePage() {
  const t = useT()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth.acceptInvite.passwordTooShortError', { count: MIN_PASSWORD_LENGTH }))
      return
    }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(t('auth.acceptInvite.updatePasswordError'))
      setLoading(false)
      return
    }

    const res = await fetch('/api/team/accept-invite', { method: 'POST' })
    if (!res.ok) {
      setError(t('auth.acceptInvite.acceptInviteError'))
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <AuthCard tagline={t('auth.acceptInvite.tagline')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="space-y-1.5">
          <Label htmlFor="password">{t('auth.acceptInvite.passwordLabel')}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={MIN_PASSWORD_LENGTH}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label={showPassword ? t('auth.common.hidePassword') : t('auth.common.showPassword')}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('auth.acceptInvite.submitting') : t('auth.acceptInvite.submitButton')}
        </Button>
      </form>
    </AuthCard>
  )
}
