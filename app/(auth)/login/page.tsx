'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { AuthCard, GoogleIcon } from '@/components/auth/auth-card'
import { motion, AnimatePresence } from 'framer-motion'
import { useT } from '@/components/i18n-provider'

export default function LoginPage() {
  const t = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(t('auth.login.errorInvalidCredentials'))
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(t('auth.login.errorGoogleFailed'))
      setGoogleLoading(false)
    }
  }

  return (
    <AuthCard tagline={t('auth.login.tagline')}>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mb-5 overflow-hidden rounded-md border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-center text-[13px] text-destructive"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="w-full"
      >
        <GoogleIcon />
        {googleLoading ? t('auth.common.redirecting') : t('auth.common.continueWithGoogle')}
      </Button>

      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t('auth.common.or')}
        </span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('auth.login.emailLabel')}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.common.emailPlaceholder')}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{t('auth.login.passwordLabel')}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.common.passwordPlaceholder')}
              required
              className="pe-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t('auth.common.hidePassword') : t('auth.common.showPassword')}
              className="absolute end-1 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <Button type="submit" size="lg" disabled={loading || googleLoading} className="mt-1 w-full">
          {loading ? t('auth.login.submitting') : t('auth.login.submitButton')}
        </Button>
      </form>

      <Separator className="my-6" />

      <p className="mb-3 text-center text-[13px] text-muted-foreground">
        {t('auth.login.noAccountYet')}{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          {t('auth.login.createAccount')}
        </Link>
      </p>

      <Link
        href="/"
        className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={13} className="rtl:-scale-x-100" /> {t('auth.common.backToHome')}
      </Link>
    </AuthCard>
  )
}
