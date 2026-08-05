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
--
-- This exact race already happened in production before this fix shipped:
-- pushing the unique index failed on a real duplicate pair sharing one
-- order_session_id. Rather than delete either order (they may both be
-- real, fulfilled orders — that's a merchant decision, not ours to make
-- here), the block below DETACHES every duplicate beyond the earliest one
-- from its session: order_session_id is set to NULL (so the partial unique
-- index below can be created) and the original value is preserved in the
-- new duplicate_session_ref column so nothing is lost and the pair stays
-- traceable for manual reconciliation.

ALTER TABLE public.order_sessions
  ADD COLUMN IF NOT EXISTS awaiting_field TEXT,
  ADD COLUMN IF NOT EXISTS last_prompt_key TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS duplicate_session_ref UUID;

WITH ranked AS (
  SELECT id, order_session_id, ROW_NUMBER() OVER (PARTITION BY order_session_id ORDER BY created_at ASC) AS rn
  FROM public.orders
  WHERE order_session_id IS NOT NULL
)
UPDATE public.orders o
SET duplicate_session_ref = o.order_session_id,
    order_session_id = NULL
FROM ranked r
WHERE o.id = r.id AND r.rn > 1;

DROP INDEX IF EXISTS public.idx_orders_session;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_session_unique
  ON public.orders(order_session_id)
  WHERE order_session_id IS NOT NULL;
