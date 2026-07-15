import { createWebhookRoute } from '@/lib/channels/shared/inbound'

/**
 * Instagram webhook receiver on lib/channels — NOT YET registered as the
 * callback URL in the Meta App Dashboard. supabase/functions/instagram-webhook
 * remains the live endpoint until the Phase 1 cutover (see plan: multi-canal
 * + multi-metier). Exists here so it can be built, deployed and manually
 * verified (GET challenge + signed POST replay) ahead of the actual cutover.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const { GET, POST } = createWebhookRoute('instagram')
