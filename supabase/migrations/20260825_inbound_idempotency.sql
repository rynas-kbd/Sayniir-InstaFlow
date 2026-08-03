-- Phase 1 of the conversational-tunnel audit fix (see
-- /home/rynas/.claude/plans/fait-un-audit-complet-lazy-willow.md): removes
-- the root cause of the "every bot reply sent 2-3 times" symptom.
--
-- Today dispatchInboundMessage() runs fully synchronously inside the
-- webhook POST handler (1-2 LLM calls + ~10 DB round-trips) before Meta
-- gets its 200 OK. Slow/rate-limited LLM calls (the free-tier model in
-- particular) make that routinely exceed Meta's webhook timeout, which
-- triggers a redelivery of the SAME message — and nothing guards against
-- processing it twice, so the customer gets the whole turn answered again.
--
-- Fix: ACK Meta immediately (see lib/channels/shared/inbound.ts), do the
-- real work after the response is sent, and use these two tables to (a)
-- dedup by Meta's `mid` and (b) serialize turns for the same sender so two
-- redeliveries/near-simultaneous messages can't race on order_sessions.

CREATE TABLE IF NOT EXISTS public.inbound_events (
  message_id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inbound_events_status_created ON public.inbound_events(status, created_at);

ALTER TABLE public.inbound_events ENABLE ROW LEVEL SECURITY;
-- Service-role only — this table is written/read exclusively by the
-- webhook route and the admin recovery cron via the admin client, never
-- exposed to end users, so no user-facing policy is defined (matches the
-- pattern for other internal tables with no client-facing RLS policy).

-- Per-conversation claim, used instead of a Postgres advisory lock: calls
-- from the app go through PostgREST/RPC, where each call can land on a
-- different pooled connection, so a session-level advisory lock (which
-- must be released from the SAME connection) can't be relied on here. A
-- plain row claim via a single atomic UPSERT works regardless of pooling.
CREATE TABLE IF NOT EXISTS public.conversation_locks (
  channel_account_id UUID NOT NULL,
  sender_id TEXT NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL,
  locked_by TEXT NOT NULL,
  PRIMARY KEY (channel_account_id, sender_id)
);

ALTER TABLE public.conversation_locks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.try_lock_conversation(
  p_channel_account_id UUID,
  p_sender_id TEXT,
  p_locked_by TEXT,
  p_stale_after_seconds INT DEFAULT 30
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_acquired BOOLEAN := FALSE;
BEGIN
  INSERT INTO public.conversation_locks (channel_account_id, sender_id, locked_at, locked_by)
  VALUES (p_channel_account_id, p_sender_id, NOW(), p_locked_by)
  ON CONFLICT (channel_account_id, sender_id) DO UPDATE
    SET locked_at = NOW(), locked_by = p_locked_by
    WHERE public.conversation_locks.locked_at < NOW() - (p_stale_after_seconds || ' seconds')::INTERVAL
  RETURNING TRUE INTO v_acquired;

  RETURN COALESCE(v_acquired, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.unlock_conversation(
  p_channel_account_id UUID,
  p_sender_id TEXT
) RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.conversation_locks
  WHERE channel_account_id = p_channel_account_id AND sender_id = p_sender_id;
$$;
