-- =============================================
-- Migration: Adapt schema to ecommerce.ts & messaging.ts changes
-- Date: 2026-05-30
-- =============================================

-- ─── 1. order_sessions : colonnes manquantes ────────────────────────────────
-- wilaya, delivery_mode, extra_data, detected_language
-- Le code insère ces champs dès la création de la session et les met à jour au fil du tunnel.

ALTER TABLE public.order_sessions
  ADD COLUMN IF NOT EXISTS wilaya            TEXT,
  ADD COLUMN IF NOT EXISTS delivery_mode     TEXT,          -- 'domicile' | 'point_retrait'
  ADD COLUMN IF NOT EXISTS extra_data        JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS detected_language TEXT;          -- 'fr' | 'ar' | 'darija' | 'en'

-- La contrainte UNIQUE(instagram_account_id, sender_id) existante empêche d'avoir
-- plusieurs sessions pour le même (compte, expéditeur). Le code filtre via
-- .neq('status','confirmed').neq('status','cancelled') pour récupérer la session active.
-- C'est compatible : une seule session en cours à la fois, les terminées sont archivées.

-- ─── 2. orders : colonnes manquantes ────────────────────────────────────────
-- wilaya, delivery_mode, extra_data
-- Le code insère ces champs lors de la création de la commande (create_order).

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS wilaya        TEXT,
  ADD COLUMN IF NOT EXISTS delivery_mode TEXT,
  ADD COLUMN IF NOT EXISTS extra_data    JSONB DEFAULT '{}';

-- ─── 3. subscriptions : table référencée par messaging.ts ───────────────────
-- handleAutoReply et handleVoiceAutoReply vérifient subscription.status + expires_at
-- pour valider que le compte a un abonnement actif avant de répondre.

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'active',   -- 'active' | 'inactive' | 'expired'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users manage own subscription"
  ON public.subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 4. Index utiles ────────────────────────────────────────────────────────

-- order_sessions : recherche par (account, sender, status) — requête la plus fréquente
CREATE INDEX IF NOT EXISTS idx_order_sessions_account_sender
  ON public.order_sessions(instagram_account_id, sender_id);

-- orders : recherche par session pour la jointure create_order
CREATE INDEX IF NOT EXISTS idx_orders_session
  ON public.orders(order_session_id);

-- subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user
  ON public.subscriptions(user_id);
