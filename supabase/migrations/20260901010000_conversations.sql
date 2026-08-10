-- =============================================
-- Migration: conversations (multi-canal sync system, Phase 1)
-- Date: 2026-09-01
-- Depends on: 20260901000000_workspaces.sql
--
-- Today the inbox (app/(app)/inbox/page.tsx) has no conversations table —
-- it scans the last 500 message_logs rows for the active account and
-- groups them into threads in memory on every render. That doesn't scale
-- past 500 messages, can't be queried across multiple accounts, and
-- doesn't survive a historical import (Phase 4).
--
-- This table is a materialized, trigger-maintained summary of
-- message_logs, one row per (channel_account_id, sender_id) thread —
-- exactly the same grouping key page.tsx already uses. The trigger fires
-- on every insert/relevant update of message_logs, so every existing
-- write path (lib/channels/shared/inbound.ts, app/api/inbox/send/route.ts,
-- and any future historical importer) stays completely unmodified and
-- automatically keeps this table in sync. Faithfully mirrors today's
-- exact display semantics (see inline comments) — no behavior change,
-- just a materialized version of the same computation.
--
-- Idempotent, additive only. Safe to run multiple times.
-- =============================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. conversations
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,

  -- Denormalized from channel_accounts.platform so the inbox can badge/filter
  -- by platform without a join.
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'whatsapp', 'messenger')),
  sender_id TEXT NOT NULL,

  sender_username TEXT,
  sender_full_name TEXT,
  sender_profile_pic TEXT,

  last_message_text TEXT,
  last_message_at TIMESTAMPTZ NOT NULL,
  last_direction TEXT NOT NULL CHECK (last_direction IN ('incoming', 'outgoing')),

  message_count INTEGER NOT NULL DEFAULT 0,
  -- Same definition as today's in-memory computation: true if ANY incoming
  -- message in the thread has auto_reply_sent = false, not just the latest
  -- one. A manual reply from the inbox does not clear this (no code path
  -- sets auto_reply_sent on manual replies today) — pre-existing behavior,
  -- intentionally not changed here.
  has_unreplied BOOLEAN NOT NULL DEFAULT FALSE,
  has_auto_replied BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (channel_account_id, sender_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_workspace_last_message ON public.conversations(workspace_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_channel_account_last_message ON public.conversations(channel_account_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON public.conversations(contact_id);

-- ─────────────────────────────────────────────────────────────
-- 2. Trigger: keep conversations in sync with message_logs.
--
-- Recomputes from message_logs on every relevant write rather than doing
-- incremental math — thread sizes are small enough that an aggregate over
-- one (channel_account_id, sender_id) group is cheap, and this guarantees
-- conversations can never drift from message_logs even if a write path is
-- added later that this migration's author didn't anticipate.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_conversation_from_message_log()
RETURNS TRIGGER AS $$
DECLARE
  v_workspace_id UUID;
  v_platform TEXT;
  v_latest RECORD;
  v_count INTEGER;
  v_has_unreplied BOOLEAN;
  v_has_auto_replied BOOLEAN;
BEGIN
  SELECT workspace_id, platform INTO v_workspace_id, v_platform
  FROM public.channel_accounts WHERE id = NEW.channel_account_id;

  -- Account may have been hard-deleted between the message_logs write and
  -- this trigger in a race with account deletion — nothing sensible to
  -- upsert in that case, skip rather than error the write.
  IF v_workspace_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT message_text, created_at, direction, sender_username, sender_full_name, sender_profile_pic, contact_id
    INTO v_latest
  FROM public.message_logs
  WHERE channel_account_id = NEW.channel_account_id AND sender_id = NEW.sender_id
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  SELECT count(*),
         coalesce(bool_or(direction = 'incoming' AND NOT auto_reply_sent), FALSE),
         coalesce(bool_or(auto_reply_sent), FALSE)
    INTO v_count, v_has_unreplied, v_has_auto_replied
  FROM public.message_logs
  WHERE channel_account_id = NEW.channel_account_id AND sender_id = NEW.sender_id;

  INSERT INTO public.conversations (
    workspace_id, channel_account_id, contact_id, platform, sender_id,
    sender_username, sender_full_name, sender_profile_pic,
    last_message_text, last_message_at, last_direction,
    message_count, has_unreplied, has_auto_replied, updated_at
  ) VALUES (
    v_workspace_id, NEW.channel_account_id, v_latest.contact_id, v_platform, NEW.sender_id,
    v_latest.sender_username, v_latest.sender_full_name, v_latest.sender_profile_pic,
    v_latest.message_text, v_latest.created_at, v_latest.direction,
    v_count, v_has_unreplied, v_has_auto_replied, NOW()
  )
  ON CONFLICT (channel_account_id, sender_id) DO UPDATE SET
    contact_id = EXCLUDED.contact_id,
    sender_username = EXCLUDED.sender_username,
    sender_full_name = EXCLUDED.sender_full_name,
    sender_profile_pic = EXCLUDED.sender_profile_pic,
    last_message_text = EXCLUDED.last_message_text,
    last_message_at = EXCLUDED.last_message_at,
    last_direction = EXCLUDED.last_direction,
    message_count = EXCLUDED.message_count,
    has_unreplied = EXCLUDED.has_unreplied,
    has_auto_replied = EXCLUDED.has_auto_replied,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS after_message_log_sync_conversation ON public.message_logs;
CREATE TRIGGER after_message_log_sync_conversation
  AFTER INSERT OR UPDATE OF auto_reply_sent, reply_text, replied_at, contact_id, message_text, direction
  ON public.message_logs
  FOR EACH ROW EXECUTE FUNCTION public.sync_conversation_from_message_log();

-- ─────────────────────────────────────────────────────────────
-- 3. Backfill existing threads from message_logs.
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.conversations (
  workspace_id, channel_account_id, contact_id, platform, sender_id,
  sender_username, sender_full_name, sender_profile_pic,
  last_message_text, last_message_at, last_direction,
  message_count, has_unreplied, has_auto_replied
)
SELECT
  ca.workspace_id,
  ml.channel_account_id,
  latest.contact_id,
  ca.platform,
  ml.sender_id,
  latest.sender_username,
  latest.sender_full_name,
  latest.sender_profile_pic,
  latest.message_text,
  latest.created_at,
  latest.direction,
  agg.message_count,
  agg.has_unreplied,
  agg.has_auto_replied
FROM (
  SELECT DISTINCT channel_account_id, sender_id FROM public.message_logs
) ml
JOIN public.channel_accounts ca ON ca.id = ml.channel_account_id
JOIN LATERAL (
  SELECT message_text, created_at, direction, sender_username, sender_full_name, sender_profile_pic, contact_id
  FROM public.message_logs m
  WHERE m.channel_account_id = ml.channel_account_id AND m.sender_id = ml.sender_id
  ORDER BY created_at DESC, id DESC
  LIMIT 1
) latest ON TRUE
JOIN LATERAL (
  SELECT count(*) AS message_count,
         coalesce(bool_or(direction = 'incoming' AND NOT auto_reply_sent), FALSE) AS has_unreplied,
         coalesce(bool_or(auto_reply_sent), FALSE) AS has_auto_replied
  FROM public.message_logs m
  WHERE m.channel_account_id = ml.channel_account_id AND m.sender_id = ml.sender_id
) agg ON TRUE
ON CONFLICT (channel_account_id, sender_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 4. RLS — same ownership pattern as message_logs/contacts. Team members
--    get the same additive access as every other table in
--    20260831_team_rbac.sql's list (conversations didn't exist yet then).
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'Users view own conversations'
  ) THEN
    CREATE POLICY "Users view own conversations"
      ON public.conversations FOR SELECT
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'conversations' AND policyname = 'team_member_access'
  ) THEN
    CREATE POLICY "team_member_access"
      ON public.conversations FOR ALL
      USING (public.user_is_accepted_team_member(channel_account_id))
      WITH CHECK (public.user_is_accepted_team_member(channel_account_id));
  END IF;
END $$;

COMMIT;

-- =============================================
-- Post-migration verification (run manually):
--
--   SELECT (SELECT count(DISTINCT (channel_account_id, sender_id)) FROM public.message_logs)
--        - (SELECT count(*) FROM public.conversations);
--   -- expect: 0 (every thread got exactly one conversations row)
--
--   SELECT c.id FROM public.conversations c
--   WHERE c.message_count != (
--     SELECT count(*) FROM public.message_logs m
--     WHERE m.channel_account_id = c.channel_account_id AND m.sender_id = c.sender_id
--   ) LIMIT 5;
--   -- expect: 0 rows
-- =============================================
