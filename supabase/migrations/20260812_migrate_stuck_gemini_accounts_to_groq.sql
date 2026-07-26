-- =============================================
-- Migration: migrate platform-key Gemini accounts to Groq
-- Date: 2026-08-12
-- Depends on: 20260811_default_bot_provider_groq.sql
--
-- The platform's GEMINI_API_KEY project has zero free-tier quota
-- ("limit: 0" on generate_content_free_tier_requests for gemini-2.0-flash)
-- — every account relying on that platform key for the customer bot is
-- structurally broken, not just the one seen in production logs. This is
-- not a transient rate limit; retrying does nothing.
--
-- Only touches accounts with no ai_api_key of their own (i.e. actually
-- depending on the broken platform key). Accounts with their own Gemini
-- key are unaffected by this quota and are left untouched.
-- =============================================

BEGIN;

UPDATE public.agent_settings
SET ai_provider = 'groq'
WHERE ai_provider = 'gemini'
  AND ai_api_key IS NULL;

COMMIT;
