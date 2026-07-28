-- =============================================
-- Migration: add 'sell_more' to profiles.primary_goal
-- Date: 2026-08-18
--
-- The /welcome questionnaire (20260817_onboarding.sql) only offered 4
-- primary_goal values. Boutiques (business_type = 'ecommerce') now get a
-- 5th option — "Vendre plus" — which activates the ecommerce sales agent
-- (agent_settings.is_qa_active / is_order_taking_active) directly rather
-- than only creating a flow. Widens the existing CHECK constraint;
-- idempotent (drops and recreates it by name every run, safe to re-apply).
-- =============================================

BEGIN;

DO $$
DECLARE
  existing_constraint text;
BEGIN
  SELECT con.conname INTO existing_constraint
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
  WHERE rel.relname = 'profiles'
    AND att.attname = 'primary_goal'
    AND con.contype = 'c';

  IF existing_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', existing_constraint);
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_primary_goal_check
  CHECK (primary_goal IN ('reply_faster', 'automate_faq', 'convert_comments', 'qualify_leads', 'sell_more'));

COMMIT;
