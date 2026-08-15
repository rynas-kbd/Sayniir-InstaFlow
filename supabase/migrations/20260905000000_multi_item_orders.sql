-- =============================================
-- Migration: Commandes multi-articles
-- Date: 2026-09-05
--
-- orders remains the durable order header. order_items becomes the source of
-- truth for the purchased lines, while legacy flat columns on orders stay
-- populated from the first line so existing reads keep working.
-- order_sessions.items is intentionally JSONB: it is transient conversational
-- state, rewritten as a whole on every turn and never queried as analytics.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DZD',
  position INT NOT NULL DEFAULT 0,
  extra_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id, position);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id) WHERE product_id IS NOT NULL;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'order_items'
  ) THEN
    CREATE POLICY "Users manage items of their own orders" ON public.order_items FOR ALL
      USING (EXISTS (
        SELECT 1
        FROM public.orders o
        JOIN public.channel_accounts ca ON ca.id = o.channel_account_id
        WHERE o.id = order_items.order_id AND ca.user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1
        FROM public.orders o
        JOIN public.channel_accounts ca ON ca.id = o.channel_account_id
        WHERE o.id = order_items.order_id AND ca.user_id = auth.uid()
      ));
  END IF;
END $$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount_percent_off INT,
  ADD COLUMN IF NOT EXISTS discount_amount_off DECIMAL(10, 2);

ALTER TABLE public.order_sessions
  ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS add_more TEXT;

CREATE OR REPLACE FUNCTION public.increment_product_stock(p_product_id UUID, p_quantity INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_tracks BOOLEAN;
BEGIN
  SELECT track_stock INTO v_tracks FROM public.products WHERE id = p_product_id;
  IF v_tracks IS NOT TRUE THEN
    RETURN TRUE;
  END IF;

  UPDATE public.products
  SET stock_quantity = stock_quantity + p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_variant_stock(p_variant_id UUID, p_quantity INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_tracks BOOLEAN;
BEGIN
  SELECT p.track_stock INTO v_tracks
  FROM public.product_variants pv
  JOIN public.products p ON p.id = pv.product_id
  WHERE pv.id = p_variant_id;

  IF v_tracks IS NOT TRUE THEN
    RETURN TRUE;
  END IF;

  UPDATE public.product_variants
  SET stock_quantity = stock_quantity + p_quantity,
      updated_at = NOW()
  WHERE id = p_variant_id;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_order_with_items(p_order JSONB, p_items JSONB)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_position INT := 0;
BEGIN
  INSERT INTO public.orders (
    channel_account_id,
    order_session_id,
    contact_id,
    customer_name,
    customer_phone,
    wilaya,
    delivery_mode,
    shipping_address,
    product_name,
    currency,
    price,
    size,
    color,
    quantity,
    total_amount,
    discount_percent_off,
    discount_amount_off,
    extra_data,
    payment_status,
    shipping_status
  )
  VALUES (
    (p_order->>'channel_account_id')::UUID,
    NULLIF(p_order->>'order_session_id', '')::UUID,
    NULLIF(p_order->>'contact_id', '')::UUID,
    p_order->>'customer_name',
    p_order->>'customer_phone',
    NULLIF(p_order->>'wilaya', ''),
    NULLIF(p_order->>'delivery_mode', ''),
    NULLIF(p_order->>'shipping_address', ''),
    p_order->>'product_name',
    COALESCE(NULLIF(p_order->>'currency', ''), 'DZD'),
    (p_order->>'price')::DECIMAL,
    NULLIF(p_order->>'size', ''),
    NULLIF(p_order->>'color', ''),
    COALESCE((p_order->>'quantity')::INT, 1),
    (p_order->>'total_amount')::DECIMAL,
    NULLIF(p_order->>'discount_percent_off', '')::INT,
    NULLIF(p_order->>'discount_amount_off', '')::DECIMAL,
    COALESCE(p_order->'extra_data', '{}'::JSONB),
    COALESCE(NULLIF(p_order->>'payment_status', ''), 'pending'),
    COALESCE(NULLIF(p_order->>'shipping_status', ''), 'pending')
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      size,
      color,
      quantity,
      unit_price,
      currency,
      position,
      extra_data
    )
    VALUES (
      v_order_id,
      NULLIF(v_item->>'product_id', '')::UUID,
      NULLIF(v_item->>'variant_id', '')::UUID,
      v_item->>'product_name',
      NULLIF(v_item->>'size', ''),
      NULLIF(v_item->>'color', ''),
      (v_item->>'quantity')::INT,
      (v_item->>'unit_price')::DECIMAL,
      COALESCE(NULLIF(v_item->>'currency', ''), COALESCE(NULLIF(p_order->>'currency', ''), 'DZD')),
      COALESCE((v_item->>'position')::INT, v_position),
      COALESCE(v_item->'extra_data', '{}'::JSONB)
    );
    v_position := v_position + 1;
  END LOOP;

  RETURN v_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.replace_order_items(p_order_id UUID, p_items JSONB)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_item JSONB;
  v_position INT := 0;
BEGIN
  DELETE FROM public.order_items WHERE order_id = p_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      size,
      color,
      quantity,
      unit_price,
      currency,
      position,
      extra_data
    )
    VALUES (
      p_order_id,
      NULLIF(v_item->>'product_id', '')::UUID,
      NULLIF(v_item->>'variant_id', '')::UUID,
      v_item->>'product_name',
      NULLIF(v_item->>'size', ''),
      NULLIF(v_item->>'color', ''),
      (v_item->>'quantity')::INT,
      (v_item->>'unit_price')::DECIMAL,
      COALESCE(NULLIF(v_item->>'currency', ''), 'DZD'),
      COALESCE((v_item->>'position')::INT, v_position),
      COALESCE(v_item->'extra_data', '{}'::JSONB)
    );
    v_position := v_position + 1;
  END LOOP;
END;
$$;

INSERT INTO public.order_items (order_id, product_name, size, color, quantity, unit_price, currency, position)
SELECT o.id, o.product_name, o.size, o.color, COALESCE(o.quantity, 1), o.price, COALESCE(o.currency, 'DZD'), 0
FROM public.orders o
WHERE NOT EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = o.id);

COMMIT;
