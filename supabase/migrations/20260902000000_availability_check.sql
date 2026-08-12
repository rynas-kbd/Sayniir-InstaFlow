-- =============================================
-- Migration: Availability check + post→product linking
-- Date: 2026-09-02
--
-- 1. agent_settings.is_availability_check_active — third independent
--    boutique capability alongside is_qa_active / is_order_taking_active
--    (see 20260526_split_ecommerce_systems.sql for that split). Defaults to
--    FALSE so no existing account's behavior changes on deploy.
-- 2. product_posts — cache of "this Instagram post/media is this product",
--    filled automatically when the RapidAPI-backed post resolver succeeds
--    (source='rapidapi_cache') or manually from the product form
--    (source='manual'). Nothing else in the schema links a post to a
--    product today (see audit: automation_rules.target_post_ids and
--    flows.target_post_ids only ever match posts against RULES, never
--    products).
-- =============================================

BEGIN;

ALTER TABLE public.agent_settings
  ADD COLUMN IF NOT EXISTS is_availability_check_active BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.product_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  -- Denormalized alongside product_id (rather than joining through products
  -- for every RLS check) — same tradeoff product_variants would have made if
  -- it needed cross-account uniqueness; here we actually do, see the partial
  -- unique indexes below.
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  media_id TEXT,
  shortcode TEXT,
  permalink TEXT,
  caption TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'rapidapi_cache')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_posts_product ON public.product_posts(product_id);
CREATE INDEX IF NOT EXISTS idx_product_posts_account ON public.product_posts(channel_account_id);

-- A given post resolves to exactly one product per shop — partial indexes so
-- rows with no media_id/shortcode (the other identifier was all that was
-- available) don't collide with each other under NULL = NULL semantics.
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_posts_media_unique
  ON public.product_posts(channel_account_id, media_id) WHERE media_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_posts_shortcode_unique
  ON public.product_posts(channel_account_id, shortcode) WHERE shortcode IS NOT NULL;

ALTER TABLE public.product_posts ENABLE ROW LEVEL SECURITY;

-- Same subquery-through-channel_accounts pattern as product_variants
-- (20260822_boutique_phase7_catalog.sql) and products (schema.sql).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'product_posts'
  ) THEN
    CREATE POLICY "Users manage posts linked to their own products" ON public.product_posts FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.channel_accounts ca ON ca.id = p.channel_account_id
        WHERE p.id = product_posts.product_id AND ca.user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.products p
        JOIN public.channel_accounts ca ON ca.id = p.channel_account_id
        WHERE p.id = product_posts.product_id AND ca.user_id = auth.uid()
      ));
  END IF;
END $$;

COMMIT;
