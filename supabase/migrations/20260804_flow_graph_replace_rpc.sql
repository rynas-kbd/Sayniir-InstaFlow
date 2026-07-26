-- =============================================
-- Migration: atomic flow graph replace RPC
-- Date: 2026-08-04
-- Depends on: 20260717_flows.sql
--
-- Fixes a real bug: PUT /api/flows/[id]/graph did
-- delete edges -> delete nodes -> insert nodes -> insert edges as 4
-- independent, non-transactional PostgREST calls. A failure between
-- the deletes and the inserts (network blip, constraint violation,
-- serverless timeout) permanently empties the flow.
--
-- SECURITY INVOKER (default) is intentional: the function runs with
-- the caller's role, so the existing "Users manage own flow nodes/
-- edges/flows" RLS policies still apply to every statement inside it.
-- No ownership re-check needed here — Postgres already enforces it.
-- =============================================

BEGIN;

CREATE OR REPLACE FUNCTION public.replace_flow_graph(
  p_flow_id UUID,
  p_channel_account_id UUID,
  p_nodes JSONB,
  p_edges JSONB,
  p_graph_snapshot JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  DELETE FROM public.flow_edges WHERE flow_id = p_flow_id;
  DELETE FROM public.flow_nodes WHERE flow_id = p_flow_id;

  INSERT INTO public.flow_nodes (flow_id, channel_account_id, node_key, type, config, position)
  SELECT
    p_flow_id,
    p_channel_account_id,
    n->>'node_key',
    n->>'type',
    COALESCE(n->'config', '{}'::jsonb),
    COALESCE(n->'position', '{}'::jsonb)
  FROM jsonb_array_elements(p_nodes) AS n;

  INSERT INTO public.flow_edges (flow_id, channel_account_id, source_node_key, target_node_key, source_handle)
  SELECT
    p_flow_id,
    p_channel_account_id,
    e->>'source_node_key',
    e->>'target_node_key',
    COALESCE(e->>'source_handle', 'default')
  FROM jsonb_array_elements(p_edges) AS e;

  UPDATE public.flows
  SET graph_snapshot = p_graph_snapshot, updated_at = NOW()
  WHERE id = p_flow_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.replace_flow_graph(UUID, UUID, JSONB, JSONB, JSONB) TO authenticated;

COMMIT;
