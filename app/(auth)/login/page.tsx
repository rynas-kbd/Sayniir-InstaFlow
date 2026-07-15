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

export default function LoginPage() {
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
      setError('Email ou mot de passe incorrect.')
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
      setError('Impossible de se connecter avec Google. Réessayez.')
      setGoogleLoading(false)
    }
  }

  return (
    <AuthCard tagline="Connectez-vous à votre compte">
      {error && (
        <div className="mb-5 rounded-md border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-center text-[13px] text-destructive">
          {error}
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="w-full"
      >
        <GoogleIcon />
        {googleLoading ? 'Redirection…' : 'Continuer avec Google'}
      </Button>

      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          ou
        </span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Adresse email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <Button type="submit" size="lg" disabled={loading || googleLoading} className="mt-1 w-full">
          {loading ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>

      <Separator className="my-6" />

      <p className="mb-3 text-center text-[13px] text-muted-foreground">
        Pas encore de compte ?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Créer un compte
        </Link>
      </p>

      <Link
        href="/"
        className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={13} /> Retour à l&apos;accueil
      </Link>
    </AuthCard>
  )
}
