-- =============================================
-- Migration: AI confidence-based escalation (Palier B.1)
-- Date: 2026-08-28
--
-- lib/agent/confidence.ts::checkConfidenceEscalation needs to track
-- consecutive low-confidence AI turns per contact, keyed the same way the
-- existing 'human' intent handoff already updates contacts
-- (channel_account_id + sender_id — see lib/agent/ecommerce/intent.ts and
-- handler.ts). Two consecutive turns below the confidence threshold pauses
-- the bot automatically, instead of only ever pausing on an explicit
-- keyword or manual action — matching how category-leading conversational
-- AI agents (Fin, Sierra, Decagon) escalate.
-- =============================================

BEGIN;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS low_confidence_streak INT NOT NULL DEFAULT 0;

COMMIT;
