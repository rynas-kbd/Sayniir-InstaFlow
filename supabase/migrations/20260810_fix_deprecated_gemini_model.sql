-- =============================================
-- Migration: replace deprecated gemini-1.5-flash default/values
-- Date: 2026-08-10
--
-- Google retired the Gemini 1.5 model family — the customer bot
-- (lib/agent/engine.ts::callLLMWithGemini) has been failing in production
-- with "models/gemini-1.5-flash is not found for API version v1" for every
-- account whose agent_settings.ai_model still holds the old column default.
-- Backfills existing rows and points the column default at gemini-2.0-flash
-- so newly created accounts don't hit the same wall.
-- =============================================

BEGIN;

ALTER TABLE public.agent_settings
  ALTER COLUMN ai_model SET DEFAULT 'gemini-2.0-flash';

UPDATE public.agent_settings
SET ai_model = 'gemini-2.0-flash'
WHERE ai_model = 'gemini-1.5-flash';

COMMIT;
