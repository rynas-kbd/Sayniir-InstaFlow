-- =============================================
-- Migration: flow_node_events — lightweight per-node funnel log
-- Date: 2026-07-30
-- Roadmap Phase 2, item 12. flow_runs only stores current state, not
-- history, so per-node drop-off needs its own append-only log. One row
-- per node entered by any run — cheap insert, aggregated by count(*).
-- Idempotent, additive only.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.flow_node_events (
  id BIGSERIAL PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  node_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flow_node_events_flow ON public.flow_node_events(flow_id, node_key);

ALTER TABLE public.flow_node_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'flow_node_events'
      AND policyname = 'Users manage own flow node events'
  ) THEN
    CREATE POLICY "Users manage own flow node events"
      ON public.flow_node_events FOR ALL
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
      WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

COMMIT;
