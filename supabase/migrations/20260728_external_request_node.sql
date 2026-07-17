-- =============================================
-- Migration: allow 'external_request' as a flow_nodes.type
-- Date: 2026-07-28
-- Roadmap Phase 2, item 9 — webhook-out node (Zapier/Sheets/CRM integration).
-- Idempotent (drop/recreate the check constraint).
-- =============================================

BEGIN;

ALTER TABLE public.flow_nodes DROP CONSTRAINT IF EXISTS flow_nodes_type_check;
ALTER TABLE public.flow_nodes ADD CONSTRAINT flow_nodes_type_check
  CHECK (type IN ('trigger','send_message','condition','delay','set_tag','remove_tag','ai_reply','jump','capture_input','external_request'));

COMMIT;
