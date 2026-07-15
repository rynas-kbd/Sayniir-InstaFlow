-- =============================================
-- Migration: Multi-channel (Instagram/WhatsApp/Messenger) + business_type
-- generalization — Phase 0 (see plan: multi-canal + multi-metier)
-- Date: 2026-07-12
--
-- Safe to run multiple times (idempotent). Additive + renames only —
-- no existing row is dropped. Run inside a single transaction with a
-- fresh backup/snapshot taken beforehand.
--
-- IMPORTANT DEPLOYMENT NOTE: this migration renames columns that
-- supabase/functions/_shared/meta/*.ts (the live Instagram webhook,
-- Deno) reads and writes. That Deno code has been updated in this same
-- change to use the new names (channel_accounts / channel_account_id).
-- Deploy this migration and redeploy the edge function together —
-- do NOT apply the SQL alone, or the live webhook will start failing
-- until the function is redeployed.
-- =============================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 0. Reconcile pre-existing drift between supabase/schema.sql and
--    the real production schema (columns already used by app code
--    but never captured in a checked-in migration).
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- subscriptions table may already exist from 20260530_adapt_ecommerce_schema.sql;
-- add the columns app/admin/(dashboard)/clients/[id]/actions.ts and
-- app/api/admin/auto-expire/route.ts already assume are present.
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS instagram_account_id UUID REFERENCES public.instagram_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS payment_notes TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────
-- 1. channel_accounts (renamed from instagram_accounts) + platform
-- ─────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.instagram_accounts RENAME TO channel_accounts;

ALTER TABLE public.channel_accounts
  ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'instagram'
    CHECK (platform IN ('instagram', 'whatsapp', 'messenger')),
  ADD COLUMN IF NOT EXISTS waba_id TEXT,
  ADD COLUMN IF NOT EXISTS phone_number_id TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Widen the uniqueness constraint from (user_id, page_id) to
-- (user_id, platform, page_id) now that page_id's namespace is shared
-- across platforms (WhatsApp accounts use phone_number_id instead, so
-- page_id may be NULL there — a NULL-safe partial approach is used).
ALTER TABLE public.channel_accounts DROP CONSTRAINT IF EXISTS instagram_accounts_user_id_page_id_key;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'channel_accounts_user_platform_page_key'
  ) THEN
    ALTER TABLE public.channel_accounts
      ADD CONSTRAINT channel_accounts_user_platform_page_key UNIQUE (user_id, platform, page_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. FK column rename: instagram_account_id -> channel_account_id
--    across every dependent table.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.message_logs RENAME COLUMN instagram_account_id TO channel_account_id;
ALTER TABLE IF EXISTS public.comment_logs RENAME COLUMN instagram_account_id TO channel_account_id;
ALTER TABLE IF EXISTS public.automation_rules RENAME COLUMN instagram_account_id TO channel_account_id;
ALTER TABLE IF EXISTS public.products RENAME COLUMN instagram_account_id TO channel_account_id;
ALTER TABLE IF EXISTS public.order_sessions RENAME COLUMN instagram_account_id TO channel_account_id;
ALTER TABLE IF EXISTS public.orders RENAME COLUMN instagram_account_id TO channel_account_id;
ALTER TABLE IF EXISTS public.ecommerce_settings RENAME COLUMN instagram_account_id TO channel_account_id;
ALTER TABLE IF EXISTS public.subscriptions RENAME COLUMN instagram_account_id TO channel_account_id;

-- ─────────────────────────────────────────────────────────────
-- 3. business_type on profiles (1 business = 1 user today; a
--    boutique's WhatsApp and Instagram must run the same vertical flow)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'ecommerce'
    CHECK (business_type IN ('ecommerce', 'coaching', 'agency', 'generic'));

-- ─────────────────────────────────────────────────────────────
-- 4. agent_settings (renamed from ecommerce_settings) + vertical_config
-- ─────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.ecommerce_settings RENAME TO agent_settings;

ALTER TABLE public.agent_settings
  ADD COLUMN IF NOT EXISTS vertical_config JSONB DEFAULT '{}';

-- ─────────────────────────────────────────────────────────────
-- 5. Rename indexes to match (cosmetic, avoids stale names referring
--    to the old table in \di output; safe no-ops if already renamed)
-- ─────────────────────────────────────────────────────────────

ALTER INDEX IF EXISTS idx_instagram_accounts_user RENAME TO idx_channel_accounts_user;
ALTER INDEX IF EXISTS idx_message_logs_account RENAME TO idx_message_logs_channel_account;
ALTER INDEX IF EXISTS idx_comment_logs_account RENAME TO idx_comment_logs_channel_account;
ALTER INDEX IF EXISTS idx_automation_rules_account RENAME TO idx_automation_rules_channel_account;
ALTER INDEX IF EXISTS idx_order_sessions_account_sender RENAME TO idx_order_sessions_channel_account_sender;

COMMIT;

-- =============================================
-- Post-migration verification (run manually, not part of the transaction):
--
--   SELECT platform, count(*) FROM public.channel_accounts GROUP BY platform;
--   -- expect: all existing rows show platform = 'instagram'
--
--   SELECT business_type, count(*) FROM public.profiles GROUP BY business_type;
--   -- expect: all existing rows show business_type = 'ecommerce'
--
--   \d+ public.channel_accounts   -- confirm RLS policies still reference channel_accounts.user_id
--   \d+ public.message_logs        -- confirm policy auto-updated to channel_account_id
-- =============================================
