-- =============================================
-- Migration: campaigns / broadcast — Sayniir Phase 4 (greenfield)
-- Date: 2026-07-18
-- Depends on: 20260716_crm_contacts.sql (contacts, tags)
-- Idempotent, additive only — no existing table touched.
--
-- Design notes:
--  - campaign_sends has a unique (campaign_id, contact_id) key so
--    enqueueRecipients() is idempotent and re-running it never
--    double-queues a recipient.
--  - Meta's 24h messaging window (contacts.last_inbound_at) is enforced
--    by lib/campaigns/service.ts::sendBatch at send time, not here —
--    recipients outside the window are marked skipped_window.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  message_template TEXT NOT NULL,
  audience_tag_ids UUID[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','sending','sent','cancelled','failed')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  stats JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed','skipped_window','skipped_unsubscribed')),
  sent_message_id TEXT,
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (campaign_id, contact_id)
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_campaigns_channel_status ON public.campaigns(channel_account_id, status);
-- Partial index: the campaign-dispatch cron polls exactly this shape.
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON public.campaigns(status, scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_campaign_sends_pending ON public.campaign_sends(campaign_id, status);

-- ─────────────────────────────────────────────────────────────
-- RLS — same pattern as products/order_sessions/orders
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users manage own campaigns"
  ON public.campaigns FOR ALL
  USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
  WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Users manage own campaign sends"
  ON public.campaign_sends FOR ALL
  USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
  WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));

COMMIT;
