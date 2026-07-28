import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export type OnboardingEventType =
  | 'onboarding.step_completed'
  | 'onboarding.activated'
  | 'onboarding.skipped'
  | 'onboarding.pulse'

/**
 * Writes an onboarding milestone to the shared public.events table (admin
 * write-only, see supabase/migrations/20260719_analytics_events.sql).
 *
 * events.channel_account_id is NOT NULL — there is no row to attach a
 * pre-channel milestone to (e.g. the /welcome questionnaire happens before
 * any channel is connected). Those two milestones (profile saved, welcome
 * skipped) are instead captured directly as profiles.onboarding_skipped_at /
 * primary_goal — durable columns already read by resolveOnboardingState(),
 * so nothing is lost, just not double-logged here. Every event type this
 * function accepts implies a channel_account_id, by construction.
 *
 * Telemetry never blocks the onboarding flow: failures are swallowed after
 * being logged, not surfaced to the caller.
 */
export async function trackOnboardingEvent(
  type: OnboardingEventType,
  channelAccountId: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from('events').insert({
      channel_account_id: channelAccountId,
      type,
      metadata,
    })
  } catch (err) {
    console.error(`[onboarding] failed to track ${type}:`, err)
  }
}
