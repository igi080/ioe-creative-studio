-- ==============================================================================
-- FIX FOR: permission denied for table about_content
-- Target: public.about_content ONLY
-- 
-- Preserves the confirmed 9-column schema:
-- id, section_key, title, subtitle, content, image, extra_data, created_at, updated_at
-- (Does NOT add display_order, is_active, or section_id)
-- ==============================================================================

-- 1. Enable Row Level Security (RLS) on public.about_content
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;

-- 2. Drop any previous or conflicting policies on about_content ONLY
DROP POLICY IF EXISTS "Public about content is viewable by everyone." ON public.about_content;
DROP POLICY IF EXISTS "Admins can insert about content." ON public.about_content;
DROP POLICY IF EXISTS "Admins can update about content." ON public.about_content;
DROP POLICY IF EXISTS "Admins can delete about content." ON public.about_content;
DROP POLICY IF EXISTS "Allow public read access on about_content" ON public.about_content;
DROP POLICY IF EXISTS "Allow admins to read all about_content" ON public.about_content;
DROP POLICY IF EXISTS "Allow admins to insert about_content" ON public.about_content;
DROP POLICY IF EXISTS "Allow admins to update about_content" ON public.about_content;
DROP POLICY IF EXISTS "Allow admins to delete about_content" ON public.about_content;

-- 3. SELECT Policy: Public visitors and authenticated admins can read about content
CREATE POLICY "Allow public read access on about_content" 
ON public.about_content 
FOR SELECT 
USING (true);

-- 4. Admin INSERT Policy: Authenticated admins only (via project's is_admin() check)
CREATE POLICY "Allow admins to insert about_content" 
ON public.about_content 
FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

-- 5. Admin UPDATE Policy: Authenticated admins only (via project's is_admin() check)
CREATE POLICY "Allow admins to update about_content" 
ON public.about_content 
FOR UPDATE 
TO authenticated 
USING (public.is_admin());

-- 6. Admin DELETE Policy: Authenticated admins only (via project's is_admin() check)
CREATE POLICY "Allow admins to delete about_content" 
ON public.about_content 
FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- 7. CRITICAL TABLE PERMISSIONS (GRANTS):
-- Grants table privileges to PostgREST roles so Postgres permits queries
GRANT SELECT ON public.about_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.about_content TO authenticated;

-- 8. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
