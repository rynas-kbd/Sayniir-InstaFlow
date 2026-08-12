-- =============================================
-- Migration: Chargily Pay v2 billing
-- Date: 2026-09-04
--
-- Wires the Manychats subscription (lib/plans.ts, lib/plans/restrictions.ts,
-- app/api/billing/checkout/route.ts, app/api/webhooks/chargily/route.ts) to a
-- real payment provider (Chargily Pay v2, EDAHABIA/CIB, DZD). Until now
-- billing was collected offline and activated by hand via
-- app/admin/(dashboard)/clients/[id]/SubscriptionForm.tsx.
--
-- 1. subscriptions.plan did not exist in any prior migration despite being
--    read/written from lib/plans/restrictions.ts, app/(app)/settings/page.tsx,
--    app/api/team-members/route.ts and the admin action — added IF NOT EXISTS
--    so this is safe whether or not it was already added out-of-band.
-- 2. PlanKey moves from 'free'|'pro'|'premium' to 'free'|'starter'|'pro'|
--    'business' (see lib/plans.ts) — existing 'premium' rows are remapped to
--    'business'.
-- 3. "Users manage own subscription" was a FOR ALL policy — any authenticated
--    user could self-activate their own subscription (status/plan/expires_at)
--    via the anon-key client. All subscription writes already go through
--    createAdminClient() (webhook, cron auto-expire, admin action), so this
--    is replaced by a SELECT-only policy.
-- 4. billing_checkouts records what plan/period/amount a checkout was
--    created for, server-side — the Chargily webhook uses it to know what to
--    activate without trusting the inbound payload, and to cross-check the
--    paid amount.
-- 5. chargily_webhook_events is the replay-protection ledger. Chargily's
--    webhook signature has no timestamp component (unlike Stripe's
--    t=...,v1=... scheme) — event-id dedup here is the ONLY replay defense.
-- =============================================

BEGIN;

-- ---- 1-3. subscriptions: plan column, key remap, custom pricing, RLS fix ----

ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

UPDATE public.subscriptions SET plan = 'business' WHERE plan = 'premium';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_plan_check'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('free', 'starter', 'pro', 'business'));
  END IF;
END $$;

-- Custom pricing for the 'business' plan, set per-client from the admin
-- (SubscriptionForm.tsx) — NULL means "not negotiated yet", which the
-- checkout route must refuse rather than charging 0.
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS custom_price_monthly_dzd INT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS custom_price_annual_dzd INT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS billing_period TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS chargily_customer_id TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_billing_period_check'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_billing_period_check CHECK (billing_period IS NULL OR billing_period IN ('monthly', 'annual'));
  END IF;
END $$;

-- Privilege-escalation fix: writes to this table now happen exclusively via
-- createAdminClient() (checkout route inserts billing_checkouts only; the
-- webhook, the auto-expire cron, and the admin action write subscriptions
-- directly with the service role). No authenticated-role write path depends
-- on the old FOR ALL policy.
DROP POLICY IF EXISTS "Users manage own subscription" ON public.subscriptions;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'Users view own subscription'
  ) THEN
    CREATE POLICY "Users view own subscription"
      ON public.subscriptions FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ---- 4. billing_checkouts — server-side record of what a checkout is for ----

CREATE TABLE IF NOT EXISTS public.billing_checkouts (
  id             TEXT PRIMARY KEY,   -- Chargily checkout id (ULID)
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan           TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'business')),
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'annual')),
  amount_dzd     INT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'canceled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_billing_checkouts_user_id ON public.billing_checkouts(user_id);

ALTER TABLE public.billing_checkouts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'billing_checkouts' AND policyname = 'Users view own checkouts'
  ) THEN
    CREATE POLICY "Users view own checkouts"
      ON public.billing_checkouts FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ---- 5. chargily_webhook_events — replay-protection ledger ----

CREATE TABLE IF NOT EXISTS public.chargily_webhook_events (
  event_id     TEXT PRIMARY KEY,
  event_type   TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.chargily_webhook_events ENABLE ROW LEVEL SECURITY;

-- No policies — service role bypasses RLS, and no other role has any
-- legitimate reason to read or write this table. Chargily's webhook
-- signature carries no timestamp, so this dedup table is the only replay
-- defense (unlike the Stripe scaffold, which also had a freshness window).

-- ---- Cleanup: dead Stripe scaffold ----
-- app/api/billing/webhook/route.ts (its only consumer) is removed by this
-- change — the table is empty in every environment.
DROP TABLE IF EXISTS public.stripe_webhook_events;

COMMIT;
