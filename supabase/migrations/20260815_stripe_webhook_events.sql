-- =============================================
-- Migration: Stripe webhook replay protection
-- Date: 2026-08-15
--
-- app/api/billing/webhook/route.ts verifies the Stripe-Signature HMAC but
-- never checked timestamp freshness or event-id uniqueness — a captured
-- webhook body could be replayed indefinitely, each time extending the
-- subscription's expires_at by another month. This table records processed
-- event ids so a replay is a no-op instead of a resend.
--
-- Written only by the service-role client (webhook route uses
-- createAdminClient()) — no anon/authenticated access is meaningful here.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- No policies — service role bypasses RLS, and no other role has any
-- legitimate reason to read or write this table.

COMMIT;
