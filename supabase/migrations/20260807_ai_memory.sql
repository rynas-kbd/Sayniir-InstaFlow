-- =============================================
-- Migration: ai_memory — Phase 3 (copilot tone/preference memory)
-- Date: 2026-08-07
-- Depends on: 20260717_flows.sql (channel_accounts)
-- See docs/AI_NATIVE_DESIGN.md §8.9
--
-- Bounded to ~20-40 rows/tenant by the unique key — no vector store needed
-- at this scale (see §8.8). preference/glossary entries go into the cached
-- system block; correction/fact entries are volatile context.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('preference','glossary','fact','correction')),
  key TEXT NOT NULL,
  value TEXT NOT NULL CHECK (char_length(value) <= 280),
  source TEXT NOT NULL CHECK (source IN ('explicit','inferred','correction')),
  confidence REAL NOT NULL DEFAULT 0.5,
  hit_count INT NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (channel_account_id, kind, key)
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_account_kind ON public.ai_memory(channel_account_id, kind);

ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_memory'
      AND policyname = 'Users manage own ai memory'
  ) THEN
    CREATE POLICY "Users manage own ai memory"
      ON public.ai_memory FOR ALL
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
      WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

COMMIT;
