-- =============================================
-- Migration: business_type vertical tables (coaching + agency) — Phase 4
-- Date: 2026-07-12
-- Depends on: 20260712_channel_generalization.sql (channel_accounts, profiles.business_type)
-- Idempotent, additive only — no existing table touched.
-- =============================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- Coaching: transient booking-in-progress state (mirrors order_sessions)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.booking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  external_user_id TEXT NOT NULL,
  desired_service TEXT,
  desired_datetime TEXT,
  client_name TEXT,
  client_phone TEXT,
  status TEXT NOT NULL DEFAULT 'gathering_info', -- gathering_info | proposed_slot | confirmed | cancelled
  extra_data JSONB DEFAULT '{}',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_account_id, external_user_id)
);

-- ─────────────────────────────────────────────────────────────
-- Coaching: committed appointments (mirrors orders)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  booking_session_id UUID REFERENCES public.booking_sessions(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  service_name TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INT DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | completed | cancelled | no_show
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Agency: leads (single evolving record — no separate session table,
-- lead qualification isn't a checkout-style state machine)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  external_user_id TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  qualification_status TEXT NOT NULL DEFAULT 'new', -- new|qualifying|qualified|disqualified|booked|lost
  budget_range TEXT,
  need_summary TEXT,
  score INT,
  extra_data JSONB DEFAULT '{}',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_account_id, external_user_id)
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_booking_sessions_channel_account_sender ON public.booking_sessions(channel_account_id, external_user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_channel_account ON public.appointments(channel_account_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_leads_channel_account_sender ON public.leads(channel_account_id, external_user_id);

-- ─────────────────────────────────────────────────────────────
-- RLS — same pattern as products/order_sessions/orders
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.booking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'booking_sessions'
      AND policyname = 'Users manage own booking sessions'
  ) THEN
    CREATE POLICY "Users manage own booking sessions"
      ON public.booking_sessions FOR ALL
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
      WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'appointments'
      AND policyname = 'Users manage own appointments'
  ) THEN
    CREATE POLICY "Users manage own appointments"
      ON public.appointments FOR ALL
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
      WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'leads'
      AND policyname = 'Users manage own leads'
  ) THEN
    CREATE POLICY "Users manage own leads"
      ON public.leads FOR ALL
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
      WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- Fix: channel_accounts unique constraint doesn't cover WhatsApp rows
-- (page_id stays NULL there) — add a second partial constraint so a
-- WhatsApp phone_number_id can't be connected twice for the same user.
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'channel_accounts_user_platform_phone_key'
  ) THEN
    ALTER TABLE public.channel_accounts
      ADD CONSTRAINT channel_accounts_user_platform_phone_key UNIQUE (user_id, platform, phone_number_id);
  END IF;
END $$;

COMMIT;
