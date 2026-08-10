-- =============================================
-- Migration: Conversational-quality audit fixes
-- Date: 2026-08-26
--
-- Companion to the dispatch/agent refactor in lib/channels/shared and
-- lib/agent (see /home/rynas/.claude/plans/je-veux-que-tu-declarative-pony.md).
--
-- 1. message_logs.handled_by — every agent handler now returns a typed
--    AgentOutcome instead of the dispatch layer writing a fixed
--    '[Géré par …]' placeholder into reply_text regardless of whether a
--    reply actually went out. reply_text now holds the real text sent to
--    the customer; handled_by keeps the routing label the dashboard used
--    to read out of reply_text (audit findings F3/F4).
-- 2. idx_message_logs_account_sender_created — conversational memory
--    (lib/agent/history.ts) reads the last N turns for a single
--    (channel_account_id, sender_id) pair ordered by created_at; only
--    single-column indexes existed on this table before.
-- 3. products.track_stock + rewritten decrement_product_stock /
--    decrement_variant_stock — both RPCs used
--    `GREATEST(stock_quantity - p_quantity, 0)`, which always "succeeds"
--    even at zero stock. Nothing ever re-checked availability between
--    showing a product to a customer and confirming their order, so two
--    concurrent buyers could both confirm the last unit (audit finding
--    F10). track_stock is a separate flag (not "stock_quantity > 0")
--    because stock_quantity defaults to 0 — a shop that never bothered
--    entering stock counts must not have its entire catalog treated as
--    perpetually out of stock. Backfilled true only for rows that already
--    have a positive count, i.e. a merchant who was clearly already using
--    the field.
-- =============================================

BEGIN;

ALTER TABLE public.message_logs
  ADD COLUMN IF NOT EXISTS handled_by TEXT;

CREATE INDEX IF NOT EXISTS idx_message_logs_account_sender_created
  ON public.message_logs(channel_account_id, sender_id, created_at DESC);

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS track_stock BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE public.products SET track_stock = TRUE WHERE stock_quantity > 0;

-- Now atomic AND enforced: fails (returns FALSE) instead of silently
-- flooring at zero when track_stock is on and the requested quantity
-- exceeds what's left. Products/variants that don't track stock always
-- succeed, matching today's "stock is decorative" behavior for them.
-- Return type changes from void (20260820) to BOOLEAN — CREATE OR REPLACE
-- cannot change a function's return type, so the old signature must be
-- dropped first.
DROP FUNCTION IF EXISTS public.decrement_product_stock(UUID, INT);

CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_product_id UUID, p_quantity INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_tracks BOOLEAN;
  v_updated INT;
BEGIN
  SELECT track_stock INTO v_tracks FROM public.products WHERE id = p_product_id;
  IF v_tracks IS NOT TRUE THEN
    RETURN TRUE;
  END IF;

  UPDATE public.products
  SET stock_quantity = stock_quantity - p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id AND stock_quantity >= p_quantity;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- Same return-type change as decrement_product_stock above (void → BOOLEAN,
-- see 20260822_boutique_phase7_catalog.sql for the prior signature).
DROP FUNCTION IF EXISTS public.decrement_variant_stock(UUID, INT);

CREATE OR REPLACE FUNCTION public.decrement_variant_stock(p_variant_id UUID, p_quantity INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_tracks BOOLEAN;
  v_updated INT;
BEGIN
  SELECT p.track_stock INTO v_tracks
  FROM public.product_variants pv
  JOIN public.products p ON p.id = pv.product_id
  WHERE pv.id = p_variant_id;

  IF v_tracks IS NOT TRUE THEN
    RETURN TRUE;
  END IF;

  UPDATE public.product_variants
  SET stock_quantity = stock_quantity - p_quantity,
      updated_at = NOW()
  WHERE id = p_variant_id AND stock_quantity >= p_quantity;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

COMMIT;
