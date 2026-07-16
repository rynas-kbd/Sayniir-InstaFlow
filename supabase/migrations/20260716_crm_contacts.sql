-- =============================================
-- Migration: CRM contacts + tags — Sayniir Phase 1 (greenfield)
-- Date: 2026-07-16
-- Depends on: 20260712_channel_generalization.sql (channel_accounts), message_logs (schema.sql)
-- Idempotent, additive only — no existing table touched.
--
-- Design notes:
--  - contacts.channel_account_id + sender_id is the upsert key, populated
--    on every inbound message by lib/contacts/service.ts::upsertContact().
--  - contact_tags carries a denormalized channel_account_id purely so its
--    RLS policy can check ownership directly instead of a join subquery.
--  - message_logs.contact_id is nullable and populated forward-only —
--    existing rows stay NULL, nothing that reads message_logs today breaks.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  full_name TEXT,
  username TEXT,
  profile_pic TEXT,
  phone TEXT,
  email TEXT,
  custom_fields JSONB NOT NULL DEFAULT '{}',
  is_subscribed BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_inbound_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (channel_account_id, sender_id)
);

CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#888888',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (channel_account_id, name)
);

CREATE TABLE IF NOT EXISTS public.contact_tags (
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (contact_id, tag_id)
);

ALTER TABLE public.message_logs ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_contacts_channel_account_sender ON public.contacts(channel_account_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_contacts_last_inbound ON public.contacts(channel_account_id, last_inbound_at);
CREATE INDEX IF NOT EXISTS idx_tags_channel_account ON public.tags(channel_account_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_tag ON public.contact_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_channel ON public.contact_tags(channel_account_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_contact ON public.message_logs(contact_id);

-- ─────────────────────────────────────────────────────────────
-- RLS — same pattern as products/order_sessions/orders
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contacts'
      AND policyname = 'Users manage own contacts'
  ) THEN
    CREATE POLICY "Users manage own contacts"
      ON public.contacts FOR ALL
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
      WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tags'
      AND policyname = 'Users manage own tags'
  ) THEN
    CREATE POLICY "Users manage own tags"
      ON public.tags FOR ALL
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
      WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contact_tags'
      AND policyname = 'Users manage own contact tags'
  ) THEN
    CREATE POLICY "Users manage own contact tags"
      ON public.contact_tags FOR ALL
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
      WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

COMMIT;

