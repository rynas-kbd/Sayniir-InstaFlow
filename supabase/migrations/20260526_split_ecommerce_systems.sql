ALTER TABLE public.ecommerce_settings
ADD COLUMN IF NOT EXISTS is_qa_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_order_taking_active BOOLEAN DEFAULT false;

-- Remplissage initial : si l'ancien is_active était vrai, on active les deux par défaut
UPDATE public.ecommerce_settings
SET is_qa_active = is_active,
    is_order_taking_active = is_active;
