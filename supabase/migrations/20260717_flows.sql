-- =============================================
-- Migration: visual flow builder — Sayniir Phase 3 (greenfield)
-- Date: 2026-07-17
-- Depends on: 20260716_crm_contacts.sql (contacts), agent_settings (schema.sql)
-- Idempotent, additive only — no existing table touched.
--
-- Design notes:
--  - flow_nodes/flow_edges are normalized (not one JSON blob) so the
--    engine can look up a single node cheaply when resuming a delayed
--    run, and the builder can autosave one node/edge without rewriting
--    the whole graph. flows.graph_snapshot stays as the builder's own
--    editing document/version cache — the engine never reads it.
--  - flow_runs.resume_at + the partial index below is what the
--    flow-runs cron polls every minute to resume delayed executions.
--  - agent_settings.flows_enabled defaults to FALSE: existing accounts
--    keep their exact current behavior (classic automation_rules
--    fallback) until they build and enable a flow. See the execution
--    order in lib/channels/shared/inbound.ts.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused')),
  trigger_type TEXT NOT NULL DEFAULT 'any_message'
    CHECK (trigger_type IN ('any_message','keyword','any_comment','comment_keyword')),
  trigger_keywords TEXT[] DEFAULT '{}',
  target_post_ids TEXT[] DEFAULT '{}',
  priority INT NOT NULL DEFAULT 0,
  graph_snapshot JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.flow_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  node_key TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('trigger','send_message','condition','delay','set_tag','remove_tag','ai_reply','jump')),
  config JSONB NOT NULL DEFAULT '{}',
  position JSONB DEFAULT '{}',
  UNIQUE (flow_id, node_key)
);

CREATE TABLE IF NOT EXISTS public.flow_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  source_node_key TEXT NOT NULL,
  target_node_key TEXT NOT NULL,
  source_handle TEXT DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS public.flow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  current_node_key TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','waiting','completed','failed','cancelled')),
  resume_at TIMESTAMPTZ,
  context JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agent_settings ADD COLUMN IF NOT EXISTS flows_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_flows_channel_status ON public.flows(channel_account_id, status);
CREATE INDEX IF NOT EXISTS idx_flow_nodes_flow ON public.flow_nodes(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_edges_flow ON public.flow_edges(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_runs_contact ON public.flow_runs(contact_id);
-- Partial index: the flow-runs cron polls exactly this shape every minute.
CREATE INDEX IF NOT EXISTS idx_flow_runs_due ON public.flow_runs(status, resume_at) WHERE status = 'waiting';

-- ─────────────────────────────────────────────────────────────
-- RLS — same pattern as products/order_sessions/orders. flow_nodes/
-- flow_edges/flow_runs carry a denormalized channel_account_id so the
-- policy checks ownership directly instead of a join through flows.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users manage own flows"
  ON public.flows FOR ALL
  USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
  WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Users manage own flow nodes"
  ON public.flow_nodes FOR ALL
  USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
  WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Users manage own flow edges"
  ON public.flow_edges FOR ALL
  USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
  WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Users manage own flow runs"
  ON public.flow_runs FOR ALL
  USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
  WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));

COMMIT;
