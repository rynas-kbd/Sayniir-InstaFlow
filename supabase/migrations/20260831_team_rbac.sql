-- =============================================
-- Migration: Team member accounts + coarse RBAC (Palier E core)
-- Date: 2026-08-31
--
-- team_members (20260802_team_assignment.sql) was a name/email directory
-- only — no login, no role. This adds real accounts: user_id links to a
-- real auth.users row once an invited member accepts, role is a UI hint
-- only (see below), invited_at/accepted_at track invite state.
--
-- Access model (deliberately coarse for v1 — see the plan): an accepted
-- team member gets the SAME data access as the account owner on every
-- table listed below, via one ADDITIVE policy per table. This never
-- touches the existing owner-only policies — Postgres combines multiple
-- permissive policies for the same command with OR, so owner access is
-- unaffected regardless of what happens here. role only gates which nav
-- items the app SHOWS (lib/accounts/active-account.ts callers) — it is
-- NOT a database-level restriction in this version. channel_accounts
-- (connect/disconnect) and subscriptions (billing) are deliberately NOT
-- in this list — those stay owner-only even for an 'admin' team member.
-- =============================================

BEGIN;

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
  ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);

-- Lets the invite route upsert on (channel_account_id, email) — re-inviting
-- the same address updates the existing row (e.g. a role change) instead
-- of creating a duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_members_account_email ON public.team_members(channel_account_id, email);

-- SECURITY DEFINER is required: without it, a team member couldn't even
-- read their OWN row in team_members to check membership, since the
-- table's existing RLS policy only lets the owner read it.
CREATE OR REPLACE FUNCTION public.user_is_accepted_team_member(p_channel_account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE channel_account_id = p_channel_account_id
      AND user_id = auth.uid()
      AND accepted_at IS NOT NULL
  );
$$;

-- channel_accounts itself stays owner-only for writes (connect/disconnect
-- is a danger-zone action, deliberately excluded from the loop below) — but
-- an accepted team member still needs to SEE it (platform, display name,
-- picture) to select it in the account switcher (lib/accounts/active-account.ts).
-- Read-only, separate from the additive FOR ALL policies applied elsewhere.
DROP POLICY IF EXISTS team_member_read_access ON public.channel_accounts;
CREATE POLICY team_member_read_access ON public.channel_accounts FOR SELECT
  USING (public.user_is_accepted_team_member(id));

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'contacts', 'contact_tags', 'segments', 'campaigns', 'campaign_sends',
    'flows', 'flow_nodes', 'flow_edges', 'flow_runs', 'growth_links',
    'products', 'discount_codes', 'orders', 'order_sessions',
    'leads', 'booking_sessions', 'appointments', 'automation_rules',
    'team_members', 'ai_insights', 'agent_settings', 'message_logs', 'comment_logs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS team_member_access ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY team_member_access ON public.%I FOR ALL USING (public.user_is_accepted_team_member(channel_account_id)) WITH CHECK (public.user_is_accepted_team_member(channel_account_id))',
      tbl
    );
  END LOOP;
END $$;

COMMIT;
