-- =============================================
-- Migration: default the customer bot's AI provider to Groq
-- Date: 2026-08-11
-- Depends on: 20260609_add_ai_credentials_to_settings.sql
--
-- lib/agent/engine.ts::callAgentLLM now defaults to Groq instead of Gemini
-- when agent_settings.ai_provider is unset. This only affects the column
-- DEFAULT for newly inserted rows — every existing row already has the
-- literal string 'gemini' materialized (Postgres backfills a constant
-- DEFAULT on ADD COLUMN immediately), so there is no way to distinguish
-- "never chose a provider" from "explicitly chose Gemini" after the fact.
-- Deliberately NOT backfilling existing rows: that would silently change
-- live tenants' bot behavior (language, response quality) without them
-- asking for it. Existing accounts keep Gemini until changed via the UI.
-- =============================================

BEGIN;

ALTER TABLE public.agent_settings
  ALTER COLUMN ai_provider SET DEFAULT 'groq';

COMMIT;
