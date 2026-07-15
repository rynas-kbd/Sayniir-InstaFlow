-- =============================================
-- Multi-channel Automation SaaS — Database Schema
-- Source of truth for a FRESH install (Supabase SQL Editor).
-- For an existing production database, apply the migrations under
-- supabase/migrations/ in order instead of re-running this file.
-- =============================================

-- 1. User Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  admin_notes TEXT,
  -- Drives which AI-agent flow (Phase 4) activates for this business.
  business_type TEXT NOT NULL DEFAULT 'ecommerce'
    CHECK (business_type IN ('ecommerce', 'coaching', 'agency', 'generic')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Connected channel accounts (Instagram / WhatsApp / Messenger)
CREATE TABLE IF NOT EXISTS public.channel_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  platform TEXT NOT NULL DEFAULT 'instagram'
    CHECK (platform IN ('instagram', 'whatsapp', 'messenger')),

  -- Meta identifiers (Instagram / Messenger — a Facebook Page token)
  facebook_user_id TEXT,
  instagram_business_id TEXT,
  instagram_username TEXT,
  page_id TEXT,
  page_name TEXT,
  page_picture_url TEXT,

  -- WhatsApp Cloud API identifiers
  waba_id TEXT,
  phone_number_id TEXT,
  phone_number TEXT,

  -- Tokens — stored AES-GCM encrypted via lib/crypto.ts (encryptApiKey/decryptApiKey).
  -- Legacy plaintext rows are detected at read time via isEncrypted() during the
  -- transition and re-encrypted on next write.
  access_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'long_lived',
  token_expires_at TIMESTAMPTZ,

  is_active BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_token_refresh TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, platform, page_id),
  UNIQUE(user_id, platform, phone_number_id)
);

-- 3. Message Logs
CREATE TABLE IF NOT EXISTS public.message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,

  sender_id TEXT NOT NULL,
  sender_username TEXT,
  sender_full_name TEXT,
  sender_profile_pic TEXT,

  message_id TEXT UNIQUE NOT NULL,
  message_text TEXT,
  message_type TEXT DEFAULT 'text', -- text, image, story_reply, etc.

  auto_reply_sent BOOLEAN DEFAULT FALSE,
  reply_text TEXT,
  replied_at TIMESTAMPTZ,

  direction TEXT NOT NULL DEFAULT 'incoming', -- incoming / outgoing
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3b. Comment Logs (Instagram/Messenger only — no public-comment concept on WhatsApp)
CREATE TABLE IF NOT EXISTS public.comment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,

  commenter_id TEXT NOT NULL,
  commenter_username TEXT,

  comment_id TEXT UNIQUE NOT NULL,
  comment_text TEXT,
  media_id TEXT,

  auto_reply_sent BOOLEAN DEFAULT FALSE,
  reply_text TEXT,
  replied_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Automation Rules (keyword/comment rule engine — platform-generic)
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'any_message', -- any_message | keyword | story_reply | any_comment | comment_keyword
  trigger_keywords TEXT[],
  response_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,

  -- Comment automation (Instagram-only in practice; UI hides these for other platforms)
  target_post_ids TEXT[], -- If NULL or empty, applies to all posts.
  reply_method TEXT DEFAULT 'comment', -- 'comment', 'dm', or 'both'
  response_text_dm TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Products (e-commerce vertical)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  image_url TEXT,
  stock_quantity INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Order Sessions (e-commerce vertical, transient state)
CREATE TABLE IF NOT EXISTS public.order_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  selected_size TEXT,
  selected_color TEXT,
  quantity INT DEFAULT 1,
  shipping_address TEXT,
  wilaya TEXT,
  delivery_mode TEXT,                        -- 'domicile' | 'point_retrait'
  customer_name TEXT,
  customer_phone TEXT,
  extra_data JSONB DEFAULT '{}',
  detected_language TEXT,                    -- 'fr' | 'ar' | 'darija' | 'en'
  status TEXT NOT NULL DEFAULT 'selecting_product',  -- selecting_product | gathering_info | confirmed | cancelled
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_account_id, sender_id)
);

-- 7. Orders (e-commerce vertical, committed)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  order_session_id UUID REFERENCES public.order_sessions(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  wilaya TEXT,
  delivery_mode TEXT,
  shipping_address TEXT NOT NULL,
  product_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  size TEXT,
  color TEXT,
  quantity INT NOT NULL DEFAULT 1,
  total_amount DECIMAL(10, 2) NOT NULL,
  extra_data JSONB DEFAULT '{}',
  payment_status TEXT DEFAULT 'pending',
  shipping_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Subscriptions (SaaS billing/plan status per user)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_account_id UUID REFERENCES public.channel_accounts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active',   -- 'active' | 'inactive' | 'expired'
  expires_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  amount_paid NUMERIC(10, 2),
  payment_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 5b. Booking Sessions (coaching vertical, transient state — mirrors order_sessions)
CREATE TABLE IF NOT EXISTS public.booking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  external_user_id TEXT NOT NULL,
  desired_service TEXT,
  desired_datetime TEXT,
  client_name TEXT,
  client_phone TEXT,
  status TEXT NOT NULL DEFAULT 'gathering_info', -- gathering_info | proposed_slot | confirmed | cancelled
  extra_data JSONB DEFAULT '{}',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_account_id, external_user_id)
);

-- 5c. Appointments (coaching vertical, committed — mirrors orders)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  booking_session_id UUID REFERENCES public.booking_sessions(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  service_name TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INT DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | completed | cancelled | no_show
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5d. Leads (agency vertical)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_account_id UUID NOT NULL REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  external_user_id TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  qualification_status TEXT NOT NULL DEFAULT 'new', -- new|qualifying|qualified|disqualified|booked|lost
  budget_range TEXT,
  need_summary TEXT,
  score INT,
  extra_data JSONB DEFAULT '{}',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_account_id, external_user_id)
);

-- 1.5 Agent Settings (renamed from ecommerce_settings — one AI-agent config per channel account)
CREATE TABLE IF NOT EXISTS public.agent_settings (
  channel_account_id UUID PRIMARY KEY REFERENCES public.channel_accounts(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false,
  is_qa_active BOOLEAN DEFAULT false,
  is_order_taking_active BOOLEAN DEFAULT false,
  instructions TEXT[] DEFAULT '{}',
  infos_to_collect TEXT[] DEFAULT '{}',
  ai_provider TEXT DEFAULT 'gemini',
  ai_api_key TEXT DEFAULT NULL,
  ai_model TEXT DEFAULT 'gemini-1.5-flash',
  default_message_enabled BOOLEAN DEFAULT TRUE,
  default_message_text TEXT DEFAULT 'Merci pour votre message ! Nous vous répondrons bientôt. 🙏',
  default_message_frequency TEXT DEFAULT 'always',
  -- Per-vertical knobs (e.g. {"slot_duration_min":30} for coaching,
  -- {"qualification_questions":[...]} for agency). Read by lib/agent/prompts/*.
  vertical_config JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_channel_accounts_user ON public.channel_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_channel_account ON public.message_logs(channel_account_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_created ON public.message_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_logs_channel_account ON public.comment_logs(channel_account_id);
CREATE INDEX IF NOT EXISTS idx_comment_logs_created ON public.comment_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_rules_channel_account ON public.automation_rules(channel_account_id);
CREATE INDEX IF NOT EXISTS idx_order_sessions_channel_account_sender ON public.order_sessions(channel_account_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_orders_session ON public.orders(order_session_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_sessions_channel_account_sender ON public.booking_sessions(channel_account_id, external_user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_channel_account ON public.appointments(channel_account_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_leads_channel_account_sender ON public.leads(channel_account_id, external_user_id);

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Channel Accounts
CREATE POLICY "Users view own accounts"
  ON public.channel_accounts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own accounts"
  ON public.channel_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own accounts"
  ON public.channel_accounts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own accounts"
  ON public.channel_accounts FOR DELETE USING (auth.uid() = user_id);

-- Message Logs (read-only for users, write via service role)
CREATE POLICY "Users view own messages"
  ON public.message_logs FOR SELECT
  USING (
    channel_account_id IN (
      SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()
    )
  );

-- Comment Logs (read-only for users, write via service role)
CREATE POLICY "Users view own comments"
  ON public.comment_logs FOR SELECT
  USING (
    channel_account_id IN (
      SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()
    )
  );

-- Automation Rules
CREATE POLICY "Users manage own rules"
  ON public.automation_rules FOR ALL
  USING (
    channel_account_id IN (
      SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    channel_account_id IN (
      SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()
    )
  );

-- Products
CREATE POLICY "Users manage own products"
  ON public.products FOR ALL
  USING (
    channel_account_id IN (
      SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    channel_account_id IN (
      SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()
    )
  );

-- Order Sessions
CREATE POLICY "Users manage own order sessions"
  ON public.order_sessions FOR ALL
  USING (
    channel_account_id IN (
      SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    channel_account_id IN (
      SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()
    )
  );

-- Orders
CREATE POLICY "Users manage own orders"
  ON public.orders FOR ALL
  USING (
    channel_account_id IN (
      SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    channel_account_id IN (
      SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()
    )
  );

-- Subscriptions
CREATE POLICY "Users view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own subscription"
  ON public.subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Agent Settings
CREATE POLICY "Users can view their own agent_settings"
  ON public.agent_settings FOR SELECT
  USING (
    channel_account_id IN (
      SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own agent_settings"
  ON public.agent_settings FOR ALL
  USING (
    channel_account_id IN (
      SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()
    )
  );

-- Booking Sessions / Appointments / Leads (same pattern as products/order_sessions/orders)
CREATE POLICY "Users manage own booking sessions"
  ON public.booking_sessions FOR ALL
  USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
  WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own appointments"
  ON public.appointments FOR ALL
  USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
  WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own leads"
  ON public.leads FOR ALL
  USING (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()))
  WITH CHECK (channel_account_id IN (SELECT id FROM public.channel_accounts WHERE user_id = auth.uid()));

-- =============================================
-- Auto-create profile on user signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
