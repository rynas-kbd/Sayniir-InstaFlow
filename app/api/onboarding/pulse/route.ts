import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jsonError } from '@/lib/api/errors'
import { resolveActiveAccount } from '@/lib/accounts/active-account'
import { trackOnboardingEvent } from '@/lib/onboarding/track'

const CHOICES = new Set(['connect_channel', 'automation_setup', 'understanding_product', 'other'])

/**
 * POST /api/onboarding/pulse
 * Body: { answer?: string, detail?: string } — both optional, an empty body
 * means "dismissed without answering". Either way this is a one-time
 * survey: the onboarding_steps row it writes is what
 * hasAnsweredPulseSurvey() (lib/onboarding/pulse.ts) checks to never show
 * it again, answered or not.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return jsonError(401, 'Non authentifié')

  const body = await req.json().catch(() => ({}))
  const answer = typeof body?.answer === 'string' && CHOICES.has(body.answer) ? body.answer : null
  const detail = typeof body?.detail === 'string' ? body.detail.trim().slice(0, 500) : null

  const { error } = await supabase
    .from('onboarding_steps')
    .upsert({ user_id: user.id, step_id: 'pulse_survey', completed_at: new Date().toISOString() }, { onConflict: 'user_id,step_id' })
  if (error) return jsonError(500, 'Une erreur est survenue', error)

  const { active } = await resolveActiveAccount()
  if (active && (answer || detail)) {
    await trackOnboardingEvent('onboarding.pulse', active.id, { answer, detail })
  }

  return NextResponse.json({ ok: true })
}
