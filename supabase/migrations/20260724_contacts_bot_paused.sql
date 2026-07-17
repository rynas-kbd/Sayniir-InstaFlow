-- =============================================
-- Migration: bot_paused flag on contacts
-- Date: 2026-07-24
-- Roadmap Phase 1, item 4 — manual inbox replies + human takeover.
-- When true, dispatchInboundMessage logs the message but skips all
-- automation (flows/rules/AI agents) for that contact.
-- Idempotent, additive only.
-- =============================================

BEGIN;

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS bot_paused BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
