import 'server-only'
import { createClient } from '@/lib/supabase/server'

const MIN_ACCOUNT_AGE_DAYS = 5
const MAX_ACCOUNT_AGE_DAYS = 9
const MS_PER_DAY = 86_400_000

/** True during the [5, 9] day window after signup, and only if the one-time pulse survey hasn't already been answered or dismissed. */
export async function shouldShowPulseSurvey(userId: string, profileCreatedAt: string | null): Promise<boolean> {
  if (!profileCreatedAt) return false

  const ageDays = (Date.now() - new Date(profileCreatedAt).getTime()) / MS_PER_DAY
  if (ageDays < MIN_ACCOUNT_AGE_DAYS || ageDays > MAX_ACCOUNT_AGE_DAYS) return false

  const supabase = await createClient()
  const { data } = await supabase
    .from('onboarding_steps')
    .select('step_id')
    .eq('user_id', userId)
    .eq('step_id', 'pulse_survey')
    .maybeSingle()

  return !data
}
