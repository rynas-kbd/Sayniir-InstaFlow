-- Migration: Ensure flows_enabled column exists on agent_settings
-- Date: 2026-07-21
-- This is a safety migration in case 20260717_flows.sql was partially applied.

ALTER TABLE public.agent_settings
  ADD COLUMN IF NOT EXISTS flows_enabled BOOLEAN NOT NULL DEFAULT FALSE;
