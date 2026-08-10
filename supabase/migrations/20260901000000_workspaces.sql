-- =============================================
-- Migration: workspaces (multi-canal sync system, Phase 0)
-- Date: 2026-09-01
--
-- Introduces the grouping unit above channel_accounts. Today one merchant
-- connects Instagram/WhatsApp/Messenger as three unrelated
-- channel_accounts rows with no shared identity; workspaces is the
-- additive layer that lets Phase 1+ (conversations table, unified inbox,
-- cross-channel identity, shared config) reason about "everything this
-- merchant owns" without changing what channel_account_id already means
-- to the webhook hot path (lib/channels/shared/inbound.ts — untouched).
--
-- Idempotent, additive only. Safe to run multiple times.
-- =============================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. workspaces
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (owner_user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_user_id);

-- ─────────────────────────────────────────────────────────────
-- 2. Backfill: one workspace per existing profile (not just ones with a
--    channel_account already — a user who hasn't connected anything yet
--    still needs a workspace to exist before the NOT NULL below).
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.workspaces (owner_user_id)
SELECT p.id FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.workspaces w WHERE w.owner_user_id = p.id);

-- ─────────────────────────────────────────────────────────────
-- 3. channel_accounts.workspace_id
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.channel_accounts
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;

UPDATE public.channel_accounts ca
SET workspace_id = w.id
FROM public.workspaces w
WHERE w.owner_user_id = ca.user_id AND ca.workspace_id IS NULL;

ALTER TABLE public.channel_accounts ALTER COLUMN workspace_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_channel_accounts_workspace ON public.channel_accounts(workspace_id);

-- ─────────────────────────────────────────────────────────────
-- 4. Auto-fill workspace_id on insert, so the three OAuth connect routes
--    (app/api/auth/callback, app/api/auth/messenger/callback,
--    app/api/accounts/whatsapp) keep working unmodified — they all insert
--    channel_accounts via the admin (service-role) client and have never
--    known about workspaces. Self-healing: creates the workspace too if
--    one somehow doesn't exist yet for that user.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_channel_account_workspace()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.workspace_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO NEW.workspace_id FROM public.workspaces WHERE owner_user_id = NEW.user_id;

  IF NEW.workspace_id IS NULL THEN
    INSERT INTO public.workspaces (owner_user_id) VALUES (NEW.user_id) RETURNING id INTO NEW.workspace_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS before_insert_channel_account_workspace ON public.channel_accounts;
CREATE TRIGGER before_insert_channel_account_workspace
  BEFORE INSERT ON public.channel_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_channel_account_workspace();

-- ─────────────────────────────────────────────────────────────
-- 5. Auto-create a workspace for every new signup, alongside the
--    existing profiles row (handle_new_user(), pinned search_path in
--    20260816_pin_handle_new_user_search_path.sql — same idiom continued
--    here rather than a second trigger on auth.users, to keep signup a
--    single trigger firing).
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO public.workspaces (owner_user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─────────────────────────────────────────────────────────────
-- 6. RLS — owner full access; an accepted team member on any account
--    inside the workspace can read it (needed once the app shows a
--    workspace name/switcher to invited members). No DELETE policy:
--    deleting a workspace cascades every channel_account inside it —
--    deliberately not exposed via RLS in this version, same caution as
--    channel_accounts connect/disconnect being owner-only in
--    20260831_team_rbac.sql.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.user_is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.channel_accounts ca
    JOIN public.team_members tm ON tm.channel_account_id = ca.id
    WHERE ca.workspace_id = p_workspace_id
      AND tm.user_id = auth.uid()
      AND tm.accepted_at IS NOT NULL
  );
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'workspaces' AND policyname = 'Owner manages own workspace'
  ) THEN
    CREATE POLICY "Owner manages own workspace"
      ON public.workspaces FOR ALL
      USING (owner_user_id = auth.uid())
      WITH CHECK (owner_user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'workspaces' AND policyname = 'Team members read their workspace'
  ) THEN
    CREATE POLICY "Team members read their workspace"
      ON public.workspaces FOR SELECT
      USING (public.user_is_workspace_member(id));
  END IF;
END $$;

COMMIT;

-- =============================================
-- Post-migration verification (run manually):
--
--   SELECT count(*) FROM public.profiles p
--     WHERE NOT EXISTS (SELECT 1 FROM public.workspaces w WHERE w.owner_user_id = p.id);
--   -- expect: 0
--
--   SELECT count(*) FROM public.channel_accounts WHERE workspace_id IS NULL;
--   -- expect: 0
-- =============================================
