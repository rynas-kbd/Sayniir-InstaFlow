-- =============================================
-- Migration: team directory + conversation assignment
-- Date: 2026-08-02
-- Roadmap Phase 3, item 15 — scoped down: a lightweight team directory +
-- per-contact assignment label, NOT shared login access (that needs a
-- much larger RLS/auth restructuring not attempted here). Lets a
-- solo-owner account track "who on the team is handling this contact".
-- Idempotent, additive only.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS assigned_to TEXT;

CREATE INDEX IF NOT EXISTS idx_team_members_channel_account ON public.team_members(channel_account_id);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'team_members'
      AND policyname = 'Users manage own team members'
  ) THEN
    CREATE POLICY "Users manage own team members"
      ON public.team_members FOR ALL
      USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
      WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));
  END IF;
END $$;

COMMIT;
