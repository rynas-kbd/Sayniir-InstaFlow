-- =============================================
-- Migration: Boutique refonte — Phase 1 (bugs réels)
-- Date: 2026-08-20
--
-- 1. decrement_product_stock — atomic stock decrement, called from
--    lib/agent/ecommerce/handler.ts right after a physical-product order is
--    confirmed. Before this, stock_quantity was never touched anywhere
--    outside product CRUD/import — "Rupture" badges were purely decorative.
--    Done as a SQL function (not a read-then-write from the app) so two
--    near-simultaneous orders on the same product can't race each other.
--
-- 2. products.shopify_product_id — lets app/api/shopify/sync/route.ts upsert
--    instead of DELETE-then-INSERT on every sync, which previously wiped out
--    manually-added products and any kind/metadata/currency the sync never set.
-- =============================================

BEGIN;

CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_product_id UUID, p_quantity INT)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.products
  SET stock_quantity = GREATEST(stock_quantity - p_quantity, 0),
      updated_at = NOW()
  WHERE id = p_product_id;
$$;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS shopify_product_id TEXT;

-- One Shopify product maps to at most one row per account; NULL (non-Shopify
-- products) are unconstrained since a unique index ignores NULLs.
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_shopify_product_id
  ON public.products(channel_account_id, shopify_product_id)
  WHERE shopify_product_id IS NOT NULL;

COMMIT;
