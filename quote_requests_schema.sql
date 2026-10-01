-- ==============================================================================
-- IOE CREATIVE STUDIO - QUOTE REQUESTS SCHEMA & POLICIES
-- ==============================================================================

-- 1. Create table quote_requests
CREATE TABLE IF NOT EXISTS public.quote_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    company TEXT,
    service TEXT NOT NULL,
    project_description TEXT NOT NULL,
    budget TEXT,
    desired_completion_date TEXT,
    additional_requirements TEXT,
    reference_file_url TEXT,
    reference_file_name TEXT,
    agreement_accepted BOOLEAN DEFAULT true NOT NULL,
    status TEXT DEFAULT 'new' NOT NULL,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Allow public (anon + authenticated) to submit quote requests
DROP POLICY IF EXISTS "Allow public insert on quote_requests" ON public.quote_requests;
CREATE POLICY "Allow public insert on quote_requests" 
    ON public.quote_requests 
    FOR INSERT 
    TO anon, authenticated 
    WITH CHECK (true);

-- 4. Policy: Allow authenticated admins to view all quote requests
DROP POLICY IF EXISTS "Allow admins to select quote_requests" ON public.quote_requests;
CREATE POLICY "Allow admins to select quote_requests" 
    ON public.quote_requests 
    FOR SELECT 
    TO authenticated 
    USING (public.is_admin());

-- 5. Policy: Allow authenticated admins to update quote requests (status, notes, etc.)
DROP POLICY IF EXISTS "Allow admins to update quote_requests" ON public.quote_requests;
CREATE POLICY "Allow admins to update quote_requests" 
    ON public.quote_requests 
    FOR UPDATE 
    TO authenticated 
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. Policy: Allow authenticated admins to delete quote requests
DROP POLICY IF EXISTS "Allow admins to delete quote_requests" ON public.quote_requests;
CREATE POLICY "Allow admins to delete quote_requests" 
    ON public.quote_requests 
    FOR DELETE 
    TO authenticated 
    USING (public.is_admin());

-- 7. Table Grants (PostgreSQL permissions)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.quote_requests TO authenticated;
GRANT INSERT ON TABLE public.quote_requests TO anon;

-- 8. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
