-- =============================================
-- Migration: public storage bucket for uploaded images
-- Date: 2026-08-14
--
-- Backs the new /api/uploads/image route (server-side only, via the admin/
-- service-role client). Public bucket because uploaded product images must
-- be reachable by Meta's servers when sent to customers via WhatsApp/
-- Instagram card messages, and shown in the merchant's product catalog.
--
-- No storage.objects RLS policy is added: every write goes through the
-- admin client after the route verifies channel_account ownership itself
-- (same pattern as every other API route in this repo) — the service role
-- bypasses RLS entirely, so there is no direct client-to-storage path to
-- guard against yet.
-- =============================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do nothing;
