'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, ArrowLeft, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { AuthCard, GoogleIcon } from '@/components/auth/auth-card'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSuccess(true)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <AuthCard tagline="Automatisez vos conversations">
      {success ? (
        <div className="rounded-md border border-success/25 bg-success/10 px-6 py-7 text-center">
          <div className="mx-auto mb-3.5 flex size-11 items-center justify-center rounded-full bg-success/15">
            <MailCheck className="size-5 text-success" />
          </div>
          <h3 className="text-[15px] font-bold text-foreground">Vérifiez votre email</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Un lien de confirmation a été envoyé à{' '}
            <strong className="font-semibold text-foreground">{email}</strong>
          </p>
        </div>
      ) : (
        <>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleGoogle}
            disabled={googleLoading}
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

          {error && (
            <div className="mb-5 rounded-md border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-center text-[13px] text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
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
                  placeholder="Minimum 8 caractères"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" size="lg" disabled={loading || googleLoading} className="mt-1 w-full">
              {loading ? 'Création…' : 'Créer mon compte'}
            </Button>
          </form>
        </>
      )}

      <Separator className="my-6" />

      <p className="mb-3 text-center text-[13px] text-muted-foreground">
        Déjà un compte ?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Se connecter
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
