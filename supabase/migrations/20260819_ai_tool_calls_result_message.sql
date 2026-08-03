-- =============================================
-- Migration: ai_tool_calls.result_message_id
-- Date: 2026-08-19
-- Depends on: 20260806_ai_copilot.sql
--
-- Fixes a conversation-corrupting bug: when a write_live tool paused a turn
-- for confirmation, no tool_result was ever written for that block (or for
-- any tool_use block after it in the same assistant message). The next
-- provider call then replayed an assistant message with unresolved
-- tool_use blocks, which Anthropic/OpenAI-compatible APIs both reject with
-- a 400 — permanently bricking the conversation on cancel, panel close, or
-- TTL expiry (see lib/ai/loop.ts).
--
-- Fix: the pausing turn now always writes ONE complete tool_result message
-- immediately, with a placeholder for the pending block ("en attente de
-- confirmation") and for any later blocks in the same message ("non
-- exécuté"). result_message_id points at that message so /api/ai/confirm
-- and the new /api/ai/cancel route can patch the placeholder in place with
-- the real outcome instead of inserting a second, possibly conflicting
-- tool_result for the same tool_use id.
-- =============================================

BEGIN;

ALTER TABLE public.ai_tool_calls
  ADD COLUMN IF NOT EXISTS result_message_id UUID REFERENCES public.ai_messages(id) ON DELETE SET NULL;

COMMIT;
