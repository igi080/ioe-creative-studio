-- 1. Add missing color_gradient column to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS color_gradient TEXT;

-- 2. Force a schema cache reload so PostgREST immediately recognizes the new column
NOTIFY pgrst, 'reload schema';

-- 3. Ensure proper RLS policies for services
DROP POLICY IF EXISTS "Allow admins to insert services" ON public.services;
CREATE POLICY "Allow admins to insert services" 
    ON public.services FOR INSERT 
    TO authenticated 
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow admins to update services" ON public.services;
CREATE POLICY "Allow admins to update services" 
    ON public.services FOR UPDATE 
    TO authenticated 
    USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admins to delete services" ON public.services;
CREATE POLICY "Allow admins to delete services" 
    ON public.services FOR DELETE 
    TO authenticated 
    USING (public.is_admin());
