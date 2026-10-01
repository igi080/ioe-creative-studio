-- ==============================================================================
-- FIX FOR: permission denied for table home_sections
-- Target: public.home_sections ONLY
-- ==============================================================================

-- 1. Ensure table exists with exact expected schema and columns
CREATE TABLE IF NOT EXISTS public.home_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id TEXT NOT NULL UNIQUE,
    title TEXT,
    subtitle TEXT,
    content TEXT,
    button_text TEXT,
    button_url TEXT,
    image TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;

-- 3. Remove any previous conflicting policies on home_sections ONLY
DROP POLICY IF EXISTS "Public home sections are viewable by everyone." ON public.home_sections;
DROP POLICY IF EXISTS "Admins can insert home sections." ON public.home_sections;
DROP POLICY IF EXISTS "Admins can update home sections." ON public.home_sections;
DROP POLICY IF EXISTS "Admins can delete home sections." ON public.home_sections;
DROP POLICY IF EXISTS "Allow public read access on active home sections" ON public.home_sections;
DROP POLICY IF EXISTS "Allow admins to read all home sections" ON public.home_sections;
DROP POLICY IF EXISTS "Allow admins to insert home sections" ON public.home_sections;
DROP POLICY IF EXISTS "Allow admins to update home sections" ON public.home_sections;
DROP POLICY IF EXISTS "Allow admins to delete home sections" ON public.home_sections;

-- 4. Public SELECT Policy: Public visitors can ONLY read active Home sections
CREATE POLICY "Allow public read access on active home sections" 
ON public.home_sections 
FOR SELECT 
USING (is_active = true);

-- 5. Admin SELECT Policy: Authenticated admins can read ALL Home sections (active & inactive)
CREATE POLICY "Allow admins to read all home sections" 
ON public.home_sections 
FOR SELECT 
TO authenticated 
USING (public.is_admin());

-- 6. Admin INSERT Policy: Only verified admins can insert new Home sections
CREATE POLICY "Allow admins to insert home sections" 
ON public.home_sections 
FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

-- 7. Admin UPDATE Policy: Only verified admins can update Home sections
CREATE POLICY "Allow admins to update home sections" 
ON public.home_sections 
FOR UPDATE 
TO authenticated 
USING (public.is_admin());

-- 8. Admin DELETE Policy: Only verified admins can delete Home sections
CREATE POLICY "Allow admins to delete home sections" 
ON public.home_sections 
FOR DELETE 
TO authenticated 
USING (public.is_admin());

-- 9. CRITICAL TABLE PERMISSIONS (GRANTS):
-- Grants table privileges to PostgREST roles so Postgres permits queries
GRANT SELECT ON public.home_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.home_sections TO authenticated;

-- 10. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Optional: Seed default home sections if table is currently empty
INSERT INTO public.home_sections (section_id, title, subtitle, button_text, button_url, is_active, display_order)
VALUES 
  ('hero', 'PREMIUM DIGITAL <br className="hidden md:block" /> <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">EXCELLENCE</span>', 'A leading Nigerian Creative Studio combining stunning visual identity, motion graphics, animation and full-stack web development.', 'START A PROJECT', '/contact', true, 1),
  ('cta', 'Ready to Bring Your Ideas to Life?', 'Let''s discuss how our creative design and technical expertise can help your business thrive.', 'START A PROJECT', '/contact', true, 2)
ON CONFLICT (section_id) DO NOTHING;
