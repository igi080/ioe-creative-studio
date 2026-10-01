-- ==============================================================================
-- IOE CREATIVE STUDIO - PRICING & PACKAGES SCHEMA
-- ==============================================================================

-- 1. Create the pricing_packages table
CREATE TABLE IF NOT EXISTS public.pricing_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price NUMERIC,
    currency TEXT DEFAULT 'NGN',
    billing_period TEXT,
    features JSONB DEFAULT '[]',
    image TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE public.pricing_packages ENABLE ROW LEVEL SECURITY;

-- 3. Public Read Policy (Only active packages)
CREATE POLICY "Allow public read access on active packages"
   ON public.pricing_packages FOR SELECT
   USING (is_active = true);

-- 4. Admin Write Policies (using existing is_admin function)
CREATE POLICY "Allow admins to read all packages"
   ON public.pricing_packages FOR SELECT
   TO authenticated
   USING (public.is_admin());

CREATE POLICY "Allow admins to insert packages"
   ON public.pricing_packages FOR INSERT
   TO authenticated
   WITH CHECK (public.is_admin());

CREATE POLICY "Allow admins to update packages"
   ON public.pricing_packages FOR UPDATE
   TO authenticated
   USING (public.is_admin());

CREATE POLICY "Allow admins to delete packages"
   ON public.pricing_packages FOR DELETE
   TO authenticated
   USING (public.is_admin());

-- 5. Grants
GRANT SELECT ON public.pricing_packages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pricing_packages TO authenticated;

