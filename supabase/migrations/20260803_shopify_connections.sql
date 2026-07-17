-- Shopify store connection per channel account (custom-app Admin API token).
CREATE TABLE IF NOT EXISTS public.shopify_connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL UNIQUE REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  shop_domain      TEXT NOT NULL,
  access_token     TEXT NOT NULL,
  connected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at   TIMESTAMPTZ
);

ALTER TABLE public.shopify_connections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'shopify_connections'
      AND policyname = 'Users manage own shopify connection'
  ) THEN
    CREATE POLICY "Users manage own shopify connection"
      ON public.shopify_connections FOR ALL
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
      WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;
