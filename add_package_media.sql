-- Add image column to pricing_packages
ALTER TABLE public.pricing_packages ADD COLUMN IF NOT EXISTS image TEXT;

-- Ensure delete policy for products exists and is admin-only
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON public.products;
CREATE POLICY "Allow admins to delete products" 
   ON public.products FOR DELETE 
   TO authenticated 
   USING (public.is_admin());
