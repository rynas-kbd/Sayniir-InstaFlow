-- =============================================
-- Migration: constrain agent_settings.copilot_provider to known providers
-- Date: 2026-08-09
-- Depends on: 20260808_ai_credits.sql
--
-- Copilot now supports 6 providers: Groq (platform default, rotated API
-- keys), Anthropic, OpenAI, OpenRouter, DeepSeek, Gemini (all BYOK only).
-- Safe to add now — the column was introduced in 20260808 and carries no
-- production data yet.
-- =============================================

BEGIN;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_settings_copilot_provider_check'
  ) THEN
    ALTER TABLE public.agent_settings
      ADD CONSTRAINT agent_settings_copilot_provider_check
      CHECK (copilot_provider IN ('groq', 'anthropic', 'openai', 'openrouter', 'deepseek', 'gemini'));
  END IF;
END $$;

COMMIT;
