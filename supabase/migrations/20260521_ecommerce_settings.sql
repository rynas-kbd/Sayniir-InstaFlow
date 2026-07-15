CREATE TABLE IF NOT EXISTS public.ecommerce_settings (
  instagram_account_id UUID PRIMARY KEY REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false,
  instructions TEXT[] DEFAULT '{}',
  infos_to_collect TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.ecommerce_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ecommerce_settings" 
ON public.ecommerce_settings FOR SELECT 
USING (
  instagram_account_id IN (
    SELECT id FROM public.instagram_accounts WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own ecommerce_settings" 
ON public.ecommerce_settings FOR ALL 
USING (
  instagram_account_id IN (
    SELECT id FROM public.instagram_accounts WHERE user_id = auth.uid()
  )
);
