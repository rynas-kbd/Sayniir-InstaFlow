-- =============================================
-- Migration: Bot auto-resume after human inactivity (Palier E, scoped)
-- Date: 2026-08-30
--
-- contacts.bot_paused had no timestamp — impossible to tell how long a
-- conversation has been paused, so nothing could ever safely auto-resume
-- it. This is a safety net on top of the existing manual "Bot actif / Bot
-- en pause" toggle (components/inbox/conversation-thread.tsx): a merchant
-- who pauses the bot to handle a conversation and then forgets to
-- re-enable it no longer leaves that customer stuck with a silent bot
-- indefinitely.
-- =============================================

BEGIN;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS bot_paused_at TIMESTAMPTZ;

COMMIT;
