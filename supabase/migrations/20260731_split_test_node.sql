-- =============================================
-- Migration: allow 'split_test' as a flow_nodes.type
-- Date: 2026-07-31
-- Roadmap Phase 3, item 17 — A/B branch node.
-- Idempotent (drop/recreate the check constraint).
-- =============================================

BEGIN;

ALTER TABLE public.flow_nodes DROP CONSTRAINT IF EXISTS flow_nodes_type_check;
ALTER TABLE public.flow_nodes ADD CONSTRAINT flow_nodes_type_check
  CHECK (type IN ('trigger','send_message','condition','delay','set_tag','remove_tag','ai_reply','jump','capture_input','external_request','split_test'));

COMMIT;
