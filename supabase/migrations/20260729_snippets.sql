-- =============================================
-- Migration: saved replies (snippets) for the inbox
-- Date: 2026-07-29
-- Roadmap Phase 2, item 10.
-- Idempotent, additive only.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  shortcut TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_snippets_channel_account ON public.snippets(channel_account_id);

ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'snippets'
      AND policyname = 'Users manage own snippets'
  ) THEN
    CREATE POLICY "Users manage own snippets"
      ON public.snippets FOR ALL
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
      WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

COMMIT;
