-- =============================================
-- Migration: copilot credits + BYOK — Phase 4
-- Date: 2026-08-08
-- Depends on: 20260609_add_ai_credentials_to_settings.sql (agent_settings)
-- See docs/AI_NATIVE_DESIGN.md §8.10, §8.11
--
-- copilot_api_key is deliberately separate from the existing ai_api_key
-- column: ai_api_key powers the customer-facing bot (lib/agent/engine.ts),
-- copilot_api_key powers the product copilot (lib/ai/*) — different cost
-- profile, different consent, must never be conflated.
--
-- ai_usage_events is append-only and has no INSERT policy for
-- `authenticated` on purpose: only the service role (via createAdminClient
-- in lib/ai/credits/meter.ts) may write usage, so a compromised client
-- session can't forge or suppress billing events. Users get read-only
-- access to their own rows.
-- =============================================

BEGIN;

ALTER TABLE public.agent_settings
  ADD COLUMN IF NOT EXISTS copilot_provider TEXT DEFAULT 'anthropic',
  ADD COLUMN IF NOT EXISTS copilot_api_key TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS copilot_model TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS copilot_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INT NOT NULL DEFAULT 0,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  cache_read_tokens INT NOT NULL DEFAULT 0,
  byok BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_month ON public.ai_usage_events(user_id, created_at);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_usage_events'
      AND policyname = 'Users read own ai usage events'
  ) THEN
    CREATE POLICY "Users read own ai usage events"
      ON public.ai_usage_events FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

COMMIT;
