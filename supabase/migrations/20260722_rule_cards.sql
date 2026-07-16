-- =============================================
-- Migration: card/button responses for automation_rules
-- Date: 2026-07-22
-- Idempotent, additive only.
-- =============================================

BEGIN;

ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS response_type TEXT NOT NULL DEFAULT 'text';
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS card_title TEXT;
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS card_subtitle TEXT;
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS card_image_url TEXT;
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS card_buttons JSONB NOT NULL DEFAULT '[]';

COMMIT;
