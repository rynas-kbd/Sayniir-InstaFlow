import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jsonError } from '@/lib/api/errors'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { resolveOnboardingState } from '@/lib/onboarding/state'
import { trackOnboardingEvent } from '@/lib/onboarding/track'

/**
 * PATCH /api/onboarding/complete
 * Marks the user as activated — the "aha moment" milestone: they connected
 * a channel, created an automation, and (per the client, right before this
 * call) saw it produce a reply in the simulator.
 *
 * Re-derives connect_channel/create_automation server-side via
 * resolveOnboardingState() rather than trusting the client's word alone —
 * a forged direct call to this route without ever having gone through
 * /api/onboarding/simulate must not be able to claim activation.
 */
export async function PATCH() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return jsonError(401, 'Non authentifié')

  const state = await resolveOnboardingState()
  if (!state.completed.connect_channel || !state.completed.create_automation) {
    return NextResponse.json(
      { error: 'Connectez un canal et créez une automatisation avant de finaliser.' },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('profiles')
    .update({ activated_at: now, onboarding_completed_at: now })
    .eq('id', user.id)
  if (error) return jsonError(500, 'Une erreur est survenue', error)

  await supabase.from('onboarding_steps').upsert(
    { user_id: user.id, step_id: 'test_it', completed_at: now },
    { onConflict: 'user_id,step_id' }
  )

  const { active } = await resolveActiveAccount()
  if (active) {
    await trackOnboardingEvent('onboarding.activated', active.id)
  }

  return NextResponse.json({ ok: true })
}
