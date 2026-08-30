-- =============================================
-- Migration: Growth-link attribution + LTV/order-count segment criteria (Palier C)
-- Date: 2026-08-29
--
-- 1. contacts.acquisition_source(_id) — first-touch attribution. Neither
--    orders nor order_sessions reference flow_id/campaign_id anywhere in
--    this schema (verified), so flow/campaign revenue attribution isn't a
--    clean FK — only correlateable by contact_id + time window. A growth
--    link IS a clean signal: it already carries flow_id and fires on a
--    freshly-created contact (see lib/channels/shared/inbound.ts's
--    handleGrowthLink), so this stamps that specific case rather than
--    faking a broader "attribution" that doesn't actually exist yet.
-- 2. segments.min_total_orders / min_ltv — lets a segment express "high-LTV
--    customer" / "has ordered before", which was entirely unexpressable
--    before (no join from segments/contacts to orders anywhere).
-- =============================================

BEGIN;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS acquisition_source TEXT,
  ADD COLUMN IF NOT EXISTS acquisition_source_id UUID;

ALTER TABLE public.segments
  ADD COLUMN IF NOT EXISTS min_total_orders INT,
  ADD COLUMN IF NOT EXISTS min_ltv NUMERIC;

COMMIT;
