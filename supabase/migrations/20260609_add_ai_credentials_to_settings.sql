-- Migration: Add custom AI API credentials to ecommerce_settings
-- Date: 2026-06-09

ALTER TABLE public.ecommerce_settings
  ADD COLUMN IF NOT EXISTS ai_provider TEXT DEFAULT 'gemini',
  ADD COLUMN IF NOT EXISTS ai_api_key  TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_model    TEXT DEFAULT 'gemini-1.5-flash';
