import { createWebhookRoute } from '@/lib/channels/shared/next-webhook-route'

/**
 * Instagram webhook receiver on lib/channels — NOT YET registered as the
 * callback URL in the Meta App Dashboard. supabase/functions/instagram-webhook
 * remains the live endpoint until the Phase 1 cutover (see plan: multi-canal
 * + multi-metier). Exists here so it can be built, deployed and manually
 * verified (GET challenge + signed POST replay) ahead of the actual cutover.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Real dispatch work now runs in after() following an immediate 200 (see
// createWebhookRoute) — this bounds that background work, it no longer
// gates how fast Meta gets acknowledged.
export const maxDuration = 60

export const { GET, POST } = createWebhookRoute('instagram')
