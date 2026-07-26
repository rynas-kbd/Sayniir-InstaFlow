-- =============================================
-- Migration: ai_insights + ai_digests — Phase 1 (deterministic lint engine)
-- Date: 2026-08-05
-- Depends on: 20260717_flows.sql, 20260718_campaigns.sql
-- See docs/AI_NATIVE_DESIGN.md §5.1, §8.6, §8.10
--
-- ai_insights holds findings from the zero-cost deterministic lint rules
-- (flow/unreachable, campaign/window-24h, etc). UNIQUE(channel_account_id,
-- rule_id, subject_id) makes the nightly recompute an idempotent upsert
-- that preserves dismissed_at/explanation instead of recreating rows.
--
-- ai_digests is the daily dashboard summary. Written by the cron/admin
-- client only — users get FOR SELECT.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('flow','campaign','account','contacts','automation')),
  subject_id TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('error','warning','info')),
  title TEXT NOT NULL,
  detail TEXT,
  fix_tool_name TEXT,
  fix_tool_input JSONB,
  explanation TEXT,
  dismissed_at TIMESTAMPTZ,
  dismissed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (channel_account_id, rule_id, subject_id)
);

CREATE TABLE IF NOT EXISTS public.ai_digests (
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  digest_date DATE NOT NULL,
  title TEXT,
  counts JSONB NOT NULL DEFAULT '{}',
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (channel_account_id, digest_date)
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ai_insights_account_scope ON public.ai_insights(channel_account_id, scope);
-- Partial index: pages render "active findings" (not dismissed) most often.
CREATE INDEX IF NOT EXISTS idx_ai_insights_active ON public.ai_insights(channel_account_id, severity) WHERE dismissed_at IS NULL;

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_digests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_insights'
      AND policyname = 'Users manage own ai insights'
  ) THEN
    CREATE POLICY "Users manage own ai insights"
      ON public.ai_insights FOR ALL
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
      WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_digests'
      AND policyname = 'Users read own ai digests'
  ) THEN
    CREATE POLICY "Users read own ai digests"
      ON public.ai_digests FOR SELECT
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

COMMIT;
