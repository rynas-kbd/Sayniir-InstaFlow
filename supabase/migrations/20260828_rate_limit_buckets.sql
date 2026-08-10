-- Shared rate limiter backing store. Replaces lib/api/rate-limit.ts's
-- in-memory per-instance Map, which silently under-counts as soon as two
-- runtimes (Vercel + Supabase Edge Functions) or two serverless instances
-- share the same limit key. RLS is enabled with no policy — this table is
-- service-role only, mirroring inbound_events/conversation_locks.

create table if not exists public.rate_limit_buckets (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null
);

alter table public.rate_limit_buckets enable row level security;

-- Atomic fixed-window counter: upserts the bucket and returns whether this
-- call is within the limit, mirroring checkRateLimit()'s semantics
-- (lib/api/rate-limit.ts) so callers don't need to change their call shape,
-- only await it. SECURITY DEFINER because callers only need EXECUTE, not
-- direct table access.
create or replace function public.check_rate_limit(p_key text, p_limit integer, p_window_ms integer)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_reset_at timestamptz;
  v_count integer;
begin
  insert into public.rate_limit_buckets (key, count, reset_at)
  values (p_key, 1, v_now + make_interval(secs => p_window_ms / 1000.0))
  on conflict (key) do update
    set count = case
          when public.rate_limit_buckets.reset_at <= v_now then 1
          else public.rate_limit_buckets.count + 1
        end,
        reset_at = case
          when public.rate_limit_buckets.reset_at <= v_now then v_now + make_interval(secs => p_window_ms / 1000.0)
          else public.rate_limit_buckets.reset_at
        end
  returning public.rate_limit_buckets.count, public.rate_limit_buckets.reset_at into v_count, v_reset_at;

  return query select (v_count <= p_limit), greatest(p_limit - v_count, 0), v_reset_at;
end;
$$;

grant execute on function public.check_rate_limit(text, integer, integer) to authenticated, service_role;

-- Bounds table growth — mirrors the in-memory sweep this replaces. Hooked
-- into lib/jobs/auto-expire.ts (runs once daily today, will run on the same
-- schedule once that job moves to pg_cron).
create or replace function public.purge_expired_rate_limits()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limit_buckets where reset_at < now() - interval '1 hour';
$$;

grant execute on function public.purge_expired_rate_limits() to service_role;
