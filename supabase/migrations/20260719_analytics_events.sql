-- =============================================
-- Migration: analytics events — Sayniir Phase 2 (greenfield)
-- Date: 2026-07-19
-- Depends on: 20260716_crm_contacts.sql (contacts)
-- Idempotent, additive only — no existing table touched.
--
-- Design notes:
--  - Most metrics (messages/day, reply rate) are reconstructable from
--    message_logs/orders and are queried directly — this table only
--    captures what has no other home (flow/campaign performance, once
--    those features land) so it stays append-only and cheap to write.
--  - BIGINT identity (not UUID) — high-volume, sequential, no need for
--    global uniqueness outside this table.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  ref_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_channel_type_created ON public.events(channel_account_id, type, created_at);
CREATE INDEX IF NOT EXISTS idx_events_channel_created ON public.events(channel_account_id, created_at);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Read-only for users; writes happen via the admin (service-role) client only.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'events'
      AND policyname = 'Users read own events'
  ) THEN
    CREATE POLICY "Users read own events"
      ON public.events FOR SELECT
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

COMMIT;

