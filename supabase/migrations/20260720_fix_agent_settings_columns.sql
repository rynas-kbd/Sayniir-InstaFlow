-- Migration: Fix missing default_message_* columns on agent_settings
-- Date: 2026-07-20

ALTER TABLE public.agent_settings
  ADD COLUMN IF NOT EXISTS default_message_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS default_message_text TEXT DEFAULT 'Merci pour votre message ! Nous vous répondrons bientôt. 🙏',
  ADD COLUMN IF NOT EXISTS default_message_frequency TEXT DEFAULT 'always';
