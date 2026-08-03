-- =============================================
-- Migration: Boutique refonte — Phase 7 (catalogue enrichi)
-- Date: 2026-08-22
--
-- 1. products.category — simple text field (no separate table: one merchant's
--    catalog is small enough that a free-text category with client-side
--    filtering is proportionate; a real taxonomy table would be premature).
-- 2. products.images — additional gallery images. image_url stays the cover
--    image for backward compatibility with every existing consumer
--    (product-thumb.tsx, Shopify/CSV/Sheet imports, the AI prompt catalog).
-- 3. product_variants — real per-(size,color) price/stock, which sizes/colors
--    on `products` never had (they're flat display tags). A product with no
--    row here falls back to its own price/stock — existing products are
--    unaffected.
-- 4. discount_codes — promo code redemption. Agent instructions already
--    reference "codes promo" with nothing behind them.
-- =============================================

BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS images TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  -- NULL means "use the parent product's price" — only stock is mandatory per variant.
  price_override DECIMAL(10, 2),
  stock_quantity INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, size, color)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_variants'
  ) THEN
    CREATE POLICY "Users manage variants of their own products" ON public.product_variants FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.channel_accounts ca ON ca.id = p.channel_account_id
        WHERE p.id = product_variants.product_id AND ca.user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.channel_accounts ca ON ca.id = p.channel_account_id
        WHERE p.id = product_variants.product_id AND ca.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Same atomic-decrement pattern as decrement_product_stock (migration 20260820).
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(p_variant_id UUID, p_quantity INT)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.product_variants
  SET stock_quantity = GREATEST(stock_quantity - p_quantity, 0),
      updated_at = NOW()
  WHERE id = p_variant_id;
$$;

CREATE TABLE IF NOT EXISTS public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  percent_off INT CHECK (percent_off IS NULL OR (percent_off > 0 AND percent_off <= 100)),
  amount_off DECIMAL(10, 2) CHECK (amount_off IS NULL OR amount_off > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  max_uses INT,
  times_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (channel_account_id, code),
  CHECK (percent_off IS NOT NULL OR amount_off IS NOT NULL)
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'discount_codes'
  ) THEN
    CREATE POLICY "Users manage their own discount codes" ON public.discount_codes FOR ALL
      USING (EXISTS (SELECT 1 FROM public.channel_accounts ca WHERE ca.id = discount_codes.channel_account_id AND ca.user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.channel_accounts ca WHERE ca.id = discount_codes.channel_account_id AND ca.user_id = auth.uid()));
  END IF;
END $$;

-- Atomic redemption: only increments (and only succeeds) if still active,
-- unexpired, and under max_uses — avoids a race where two orders redeem the
-- last use of a max_uses-limited code simultaneously.
CREATE OR REPLACE FUNCTION public.redeem_discount_code(p_channel_account_id UUID, p_code TEXT)
RETURNS public.discount_codes
LANGUAGE plpgsql
AS $$
DECLARE
  v_row public.discount_codes;
BEGIN
  UPDATE public.discount_codes
  SET times_used = times_used + 1
  WHERE channel_account_id = p_channel_account_id
    AND code = p_code
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR times_used < max_uses)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMIT;
