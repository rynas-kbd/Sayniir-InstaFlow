-- =============================================
-- Migration: Boutique refonte — Phase 3 (orders ↔ CRM)
-- Date: 2026-08-21
--
-- orders had no link back to contacts — no contact_id, only a denormalized
-- customer_name/customer_phone string pair. This blocked anything
-- purchase-aware (segments by buyer, LTV, repeat-buyer campaigns,
-- post-purchase flows). contacts.(channel_account_id, sender_id) is already
-- the resolution key (see 20260716_crm_contacts.sql) and order_sessions
-- carries the same sender_id, so both new rows (via
-- lib/agent/ecommerce/handler.ts) and this one-time backfill use it.
-- =============================================

BEGIN;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_contact_id ON public.orders(contact_id) WHERE contact_id IS NOT NULL;

-- Best-effort backfill for existing orders: join through order_sessions to
-- recover the sender_id, then match it to the contact created for the same
-- (channel_account_id, sender_id) pair. Orders whose session was deleted
-- (order_session_id is ON DELETE SET NULL) simply stay unlinked — no way to
-- recover the sender_id for those, and that's fine, this is a forward-fix.
UPDATE public.orders o
SET contact_id = c.id
FROM public.order_sessions os
JOIN public.contacts c
  ON c.channel_account_id = os.channel_account_id AND c.sender_id = os.sender_id
WHERE o.order_session_id = os.id
  AND o.contact_id IS NULL;

COMMIT;
