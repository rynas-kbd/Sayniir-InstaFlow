-- =============================================
-- Migration: pin search_path on handle_new_user()
-- Date: 2026-08-16
--
-- handle_new_user() is SECURITY DEFINER (runs with the privileges of the
-- function owner, not the caller) but had no SET search_path, which is
-- exactly the function_search_path_mutable pattern Supabase's linter flags.
-- The body already fully-qualifies public.profiles, so pinning search_path
-- to empty changes nothing behaviorally — it just removes the ability for
-- an attacker who can create objects earlier in the search path to shadow
-- an unqualified reference.
-- =============================================

BEGIN;

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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

COMMIT;
