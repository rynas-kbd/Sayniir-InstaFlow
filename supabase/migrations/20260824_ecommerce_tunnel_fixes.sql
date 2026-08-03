-- Phase 3/4/5 of the conversational-tunnel audit fix (see
-- /home/rynas/.claude/plans/fait-un-audit-complet-lazy-willow.md):
--   - awaiting_field / last_prompt_key support the deterministic
--     slot-parsing engine (lib/agent/ecommerce/parse.ts) — the state
--     machine now records which single field it just asked for, instead
--     of re-deriving intent from scratch via an LLM call on every turn.
--   - orders(order_session_id) gets a UNIQUE index: today it's a plain
--     index, so two near-simultaneous "confirmed" turns on the same
--     session (see the race described in the audit) can each insert an
--     order row for it.

ALTER TABLE public.order_sessions
  ADD COLUMN IF NOT EXISTS awaiting_field TEXT,
  ADD COLUMN IF NOT EXISTS last_prompt_key TEXT;

DROP INDEX IF EXISTS public.idx_orders_session;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_session_unique
  ON public.orders(order_session_id)
  WHERE order_session_id IS NOT NULL;
