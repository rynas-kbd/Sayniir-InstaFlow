-- =============================================
-- Migration: interactive onboarding — state, routing questionnaire, security fix
-- Date: 2026-08-17
--
-- Adds the columns/table the new /welcome questionnaire and dashboard
-- activation checklist read and write. Idempotent, additive only.
--
-- Also closes a real gap this feature makes more exposed: profiles' UPDATE
-- policy (supabase/schema.sql) has no WITH CHECK, so Postgres reuses the
-- USING expression (auth.uid() = id) as the check — a user can already
-- UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid() and it
-- passes RLS. Onboarding adds the first client-facing write path to
-- profiles (POST /api/onboarding/profile), which is an application-layer
-- allowlist, not a substitute for the database-level fix. ALTER POLICY
-- below adds a WITH CHECK that pins role to its current value so a client
-- write can never change it, regardless of which route performs the write.
-- =============================================

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_skipped_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS activated_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS team_size               TEXT
    CHECK (team_size IN ('solo', '2-5', '6-20', '20+')),
  ADD COLUMN IF NOT EXISTS primary_goal            TEXT
    CHECK (primary_goal IN ('reply_faster', 'automate_faq', 'convert_comments', 'qualify_leads'));

CREATE TABLE IF NOT EXISTS public.onboarding_steps (
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  step_id      TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, step_id)
);

ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'onboarding_steps'
      AND policyname = 'Users manage own onboarding steps'
  ) THEN
    CREATE POLICY "Users manage own onboarding steps"
      ON public.onboarding_steps FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- role is neither user- nor onboarding-editable via any client path — pin it
-- to its existing value so a forged client PATCH/UPDATE can never move it,
-- independent of which application route performs the write.
ALTER POLICY "Users update own profile" ON public.profiles
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()));

COMMIT;
