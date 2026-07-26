-- =============================================
-- Migration: ai_conversations, ai_messages, ai_tool_calls — Phase 2 (copilot)
-- Date: 2026-08-06
-- Depends on: 20260717_flows.sql (channel_accounts)
-- See docs/AI_NATIVE_DESIGN.md §6.2, §8.3, §8.10
--
-- ai_conversations is per-user (not shared account-wide) — two teammates
-- on the same channel_account get separate copilot threads.
--
-- ai_tool_calls is the cross-request confirmation gate for write_live
-- tools (§6.2): validated input is persisted here server-side, the
-- client only ever sees/returns the opaque id.
-- =============================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','tool')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_tool_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  -- Anthropic's tool_use block id — distinct from this row's own id (the opaque identifier
  -- the client gets back), needed to address the right tool_result block when resuming.
  tool_use_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  input JSONB NOT NULL,
  risk TEXT NOT NULL CHECK (risk IN ('read','write_reversible','write_live')),
  status TEXT NOT NULL DEFAULT 'pending_confirmation'
    CHECK (status IN ('pending_confirmation','executed','denied','expired','cancelled')),
  result JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON public.ai_messages(conversation_id, created_at);
-- Partial index: the confirm route polls exactly this shape.
CREATE INDEX IF NOT EXISTS idx_ai_tool_calls_pending ON public.ai_tool_calls(id) WHERE status = 'pending_confirmation';

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tool_calls ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_conversations'
      AND policyname = 'Users manage own ai conversations'
  ) THEN
    CREATE POLICY "Users manage own ai conversations"
      ON public.ai_conversations FOR ALL
      USING (
        user_id = auth.uid()
        AND channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid())
      )
      WITH CHECK (
        user_id = auth.uid()
        AND channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid())
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_messages'
      AND policyname = 'Users manage own ai messages'
  ) THEN
    CREATE POLICY "Users manage own ai messages"
      ON public.ai_messages FOR ALL
      USING (conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()))
      WITH CHECK (conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_tool_calls'
      AND policyname = 'Users manage own ai tool calls'
  ) THEN
    CREATE POLICY "Users manage own ai tool calls"
      ON public.ai_tool_calls FOR ALL
      USING (conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()))
      WITH CHECK (conversation_id IN (SELECT id FROM public.ai_conversations WHERE user_id = auth.uid()));
  END IF;
END $$;

COMMIT;
