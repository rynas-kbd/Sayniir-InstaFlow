-- =============================================
-- Migration: saved audience segments
-- Date: 2026-07-26
-- Roadmap Phase 2, item 7. A segment is a reusable AND-combined filter
-- (all listed tags required, optional single custom-field match, optional
-- "inactive since N days" recency check) resolvable to a contact id list
-- anywhere audience_tag_ids is used today (starting with campaigns).
-- Idempotent, additive only.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tag_ids UUID[] NOT NULL DEFAULT '{}',
  custom_field_key TEXT,
  custom_field_value TEXT,
  min_days_since_last_inbound INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES public.segments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_segments_channel_account ON public.segments(channel_account_id);

ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'segments'
      AND policyname = 'Users manage own segments'
  ) THEN
    CREATE POLICY "Users manage own segments"
      ON public.segments FOR ALL
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
      WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

COMMIT;
