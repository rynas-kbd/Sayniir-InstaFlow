-- =============================================
-- Migration: allow story_reply / story_mention as flows.trigger_type
-- Date: 2026-07-27
-- Roadmap Phase 2, item 8. automation_rules.trigger_type has no CHECK
-- constraint, so no change needed there.
-- Idempotent (drop/recreate the check constraint).
-- =============================================

BEGIN;

ALTER TABLE public.flows DROP CONSTRAINT IF EXISTS flows_trigger_type_check;
ALTER TABLE public.flows ADD CONSTRAINT flows_trigger_type_check
  CHECK (trigger_type IN ('any_message','keyword','any_comment','comment_keyword','story_reply','story_mention'));

COMMIT;
