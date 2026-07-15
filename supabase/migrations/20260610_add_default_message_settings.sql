-- Migration: Add default message settings to ecommerce_settings

ALTER TABLE public.ecommerce_settings
ADD COLUMN IF NOT EXISTS default_message_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS default_message_text TEXT DEFAULT 'Merci pour votre message ! Nous vous répondrons bientôt. 🙏',
ADD COLUMN IF NOT EXISTS default_message_frequency TEXT DEFAULT 'always';
