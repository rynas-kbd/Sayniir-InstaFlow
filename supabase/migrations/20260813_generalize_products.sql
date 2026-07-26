-- =============================================
-- Migration: generalize products beyond physical retail
-- Date: 2026-08-13
-- Depends on: schema.sql (products, order_sessions, orders)
--
-- Boutique currently only sells physical goods (sizes/colors/stock_quantity
-- are the only extension point). This adds a `kind` discriminator + a
-- `metadata JSONB` bag (mirroring the `extra_data` pattern already used by
-- order_sessions/orders) so services, digital goods, subscriptions, and
-- event tickets can be modeled without new tables:
--   service:      metadata.duration_minutes, metadata.location
--   digital:      metadata.file_url, metadata.download_limit
--   subscription: metadata.billing_period
--   event:        metadata.event_date, metadata.capacity, metadata.remaining
--
-- sizes/colors/stock_quantity are untouched and stay meaningful only for
-- kind='physical' — purely additive, no existing row changes shape.
--
-- orders.shipping_address becomes nullable: non-physical kinds (service,
-- digital, subscription) have no shipping address to collect. Application
-- logic (lib/agent/ecommerce/state.ts, Phase 1) decides what's required
-- per kind — the DB just stops hard-blocking it.
-- =============================================

BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'physical',
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'DZD';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_kind_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_kind_check
      CHECK (kind IN ('physical', 'service', 'digital', 'subscription', 'event'));
  END IF;
END $$;

ALTER TABLE public.orders
  ALTER COLUMN shipping_address DROP NOT NULL;

COMMIT;
