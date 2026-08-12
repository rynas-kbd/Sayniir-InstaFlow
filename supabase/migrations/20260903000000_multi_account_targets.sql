-- =============================================
-- Migration: Multi-account targets for flows/rules + boutique sync toggle
-- Date: 2026-09-03
--
-- 1. flow_target_accounts / rule_target_accounts — a flow or automation
--    rule keeps exactly ONE "owner" channel_account_id (unchanged: builder
--    RLS, flow_nodes/flow_edges/flow_runs stay denormalized on it, no risk
--    to the existing execution path). These two join tables list the
--    ADDITIONAL accounts the same flow/rule should also match on — the
--    runtime matcher (lib/flows/engine.ts, lib/channels/shared/inbound.ts)
--    ORs the owner-column equality with membership in the join table.
-- 2. workspaces.boutique_sync_enabled — a workspace-wide (= per-owner,
--    workspaces.owner_user_id is UNIQUE) toggle that keeps agent_settings
--    and the product catalog mirrored across every account the owner
--    connected. See app/api/ecommerce-settings/route.ts and
--    app/api/products/**/route.ts for the propagation logic this backs.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.flow_target_accounts (
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (flow_id, channel_account_id)
);

CREATE INDEX IF NOT EXISTS idx_flow_target_accounts_account ON public.flow_target_accounts(channel_account_id);

ALTER TABLE public.flow_target_accounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'flow_target_accounts'
  ) THEN
    -- Both the flow AND the target account must belong to the caller — otherwise a
    -- user could attach their own flow's trigger to someone else's account.
    CREATE POLICY "Users manage target accounts of their own flows" ON public.flow_target_accounts FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.flows f JOIN public.channel_accounts ca ON ca.id = f.channel_account_id
                WHERE f.id = flow_target_accounts.flow_id AND ca.user_id = auth.uid())
        AND EXISTS (SELECT 1 FROM public.channel_accounts ca2
                    WHERE ca2.id = flow_target_accounts.channel_account_id AND ca2.user_id = auth.uid())
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.flows f JOIN public.channel_accounts ca ON ca.id = f.channel_account_id
                WHERE f.id = flow_target_accounts.flow_id AND ca.user_id = auth.uid())
        AND EXISTS (SELECT 1 FROM public.channel_accounts ca2
                    WHERE ca2.id = flow_target_accounts.channel_account_id AND ca2.user_id = auth.uid())
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.rule_target_accounts (
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (rule_id, channel_account_id)
);

CREATE INDEX IF NOT EXISTS idx_rule_target_accounts_account ON public.rule_target_accounts(channel_account_id);

ALTER TABLE public.rule_target_accounts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rule_target_accounts'
  ) THEN
    CREATE POLICY "Users manage target accounts of their own rules" ON public.rule_target_accounts FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.automation_rules r JOIN public.channel_accounts ca ON ca.id = r.channel_account_id
                WHERE r.id = rule_target_accounts.rule_id AND ca.user_id = auth.uid())
        AND EXISTS (SELECT 1 FROM public.channel_accounts ca2
                    WHERE ca2.id = rule_target_accounts.channel_account_id AND ca2.user_id = auth.uid())
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.automation_rules r JOIN public.channel_accounts ca ON ca.id = r.channel_account_id
                WHERE r.id = rule_target_accounts.rule_id AND ca.user_id = auth.uid())
        AND EXISTS (SELECT 1 FROM public.channel_accounts ca2
                    WHERE ca2.id = rule_target_accounts.channel_account_id AND ca2.user_id = auth.uid())
      );
  END IF;
END $$;

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS boutique_sync_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
