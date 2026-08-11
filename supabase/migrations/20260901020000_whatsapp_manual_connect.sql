-- =============================================
-- Migration: channel_accounts.webhook_app_secret
-- Date: 2026-09-01
--
-- Supports manually admin-connected WhatsApp accounts (a client's own Meta
-- app, since our app is still in Development mode and can't add every
-- future client as a tester). Those accounts point their OWN app's
-- webhook at our server, so Meta signs their payloads with THEIR app
-- secret, not ours — lib/channels/shared/handle-webhook.ts now resolves
-- the signing secret per-account for WhatsApp, falling back to the
-- existing global META_APP_SECRET when this column is NULL (every
-- account connected via the self-serve Embedded Signup flow, which is
-- subscribed under our shared app and keeps working exactly as before).
--
-- Idempotent, additive only. Safe to run multiple times.
-- =============================================

BEGIN;

ALTER TABLE public.channel_accounts
  ADD COLUMN IF NOT EXISTS webhook_app_secret TEXT;

COMMENT ON COLUMN public.channel_accounts.webhook_app_secret IS
  'Encrypted (see lib/crypto.ts) Meta App Secret for accounts connected via their own Meta app (manual admin connect). NULL for accounts connected via the shared self-serve Embedded Signup app — those verify against the global META_APP_SECRET env var instead.';

COMMIT;
