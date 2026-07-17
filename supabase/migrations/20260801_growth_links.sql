-- =============================================
-- Migration: growth links (ref-link + QR deep links that auto-trigger a flow)
-- Date: 2026-08-01
-- Roadmap Phase 3, item 14.
-- Idempotent, additive only.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.growth_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  clicks INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_links_code ON public.growth_links(code);
CREATE INDEX IF NOT EXISTS idx_growth_links_flow ON public.growth_links(flow_id);

ALTER TABLE public.growth_links ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'growth_links'
      AND policyname = 'Users manage own growth links'
  ) THEN
    CREATE POLICY "Users manage own growth links"
      ON public.growth_links FOR ALL
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
      WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

COMMIT;
