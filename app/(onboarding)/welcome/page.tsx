import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WelcomeForm } from '@/components/onboarding/welcome-form'

export default async function WelcomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed_at, onboarding_skipped_at')
    .eq('id', user!.id)
    .single()

  // Already answered (or explicitly skipped) — /welcome is a one-time gate,
  // not a page a returning user should ever land back on.
  if (profile?.onboarding_completed_at || profile?.onboarding_skipped_at) {
    redirect('/dashboard')
  }

  return <WelcomeForm />
}
