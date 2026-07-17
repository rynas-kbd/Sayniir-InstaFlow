-- =============================================
-- Migration: card/button messages for campaigns
-- Date: 2026-07-25
-- Roadmap Phase 1, item 6 — same shape as automation_rules' card columns.
-- Idempotent, additive only.
-- =============================================

BEGIN;

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS response_type TEXT NOT NULL DEFAULT 'text';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS card_title TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS card_subtitle TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS card_image_url TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS card_buttons JSONB NOT NULL DEFAULT '[]';

COMMIT;
