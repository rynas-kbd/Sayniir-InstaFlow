-- =============================================
-- Migration: Boutique refonte — Phase 8 (cohérence devise)
-- Date: 2026-08-23
--
-- orders had no currency column — order-table.tsx hard-coded "DZD" in the
-- UI regardless of the product's actual currency. products.currency already
-- exists per product; this carries it onto the order at insert time.
-- =============================================

BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'DZD';

COMMIT;
