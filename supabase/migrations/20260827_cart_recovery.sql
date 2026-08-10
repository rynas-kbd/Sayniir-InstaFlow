-- =============================================
-- Migration: Abandoned-cart recovery (Palier A)
-- Date: 2026-08-27
--
-- lib/agent/ecommerce/cart-recovery.ts needs to know, per order_sessions
-- row, whether a reminder has already gone out and when — nothing tracked
-- this before (the abandoned-session list in the boutique UI was read-only,
-- see components/boutique/abandoned-sessions-list.tsx).
--
-- No CHECK constraint exists on order_sessions.status anywhere in this
-- migration history (verified) — reusing the existing 'cancelled' value for
-- a session that got one reminder and still went unanswered needs no schema
-- change beyond the two new columns below.
-- =============================================

BEGIN;

ALTER TABLE public.order_sessions
  ADD COLUMN IF NOT EXISTS reminder_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Partial index — only sessions still in progress are ever candidates for
-- the recovery sweep, which is the overwhelming majority of query volume
-- this index needs to serve.
CREATE INDEX IF NOT EXISTS idx_order_sessions_recovery
  ON public.order_sessions(channel_account_id, status, last_message_at)
  WHERE status IN ('selecting_product', 'gathering_info');

COMMIT;
