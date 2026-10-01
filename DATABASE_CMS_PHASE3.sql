-- Portfolio Table
CREATE TABLE IF NOT EXISTS public.portfolio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    project_url TEXT,
    image TEXT,
    video_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Home Sections Table
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

-- About Content Table
CREATE TABLE IF NOT EXISTS public.about_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id TEXT NOT NULL UNIQUE,
    title TEXT,
    subtitle TEXT,
    content TEXT,
    image TEXT,
    extra_data JSONB,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Contact Settings Table
CREATE TABLE IF NOT EXISTS public.contact_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Media Table
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    alt_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Portfolio Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.portfolio FOR SELECT USING (true);
CREATE POLICY "Admins can insert portfolio." ON public.portfolio FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update portfolio." ON public.portfolio FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete portfolio." ON public.portfolio FOR DELETE USING (public.is_admin());

-- Home Sections Policies
CREATE POLICY "Public home sections are viewable by everyone." ON public.home_sections FOR SELECT USING (true);
CREATE POLICY "Admins can insert home sections." ON public.home_sections FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update home sections." ON public.home_sections FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete home sections." ON public.home_sections FOR DELETE USING (public.is_admin());

-- About Content Policies
CREATE POLICY "Public about content is viewable by everyone." ON public.about_content FOR SELECT USING (true);
CREATE POLICY "Admins can insert about content." ON public.about_content FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update about content." ON public.about_content FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete about content." ON public.about_content FOR DELETE USING (public.is_admin());

-- Contact Settings Policies
CREATE POLICY "Public contact settings are viewable by everyone." ON public.contact_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert contact settings." ON public.contact_settings FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update contact settings." ON public.contact_settings FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete contact settings." ON public.contact_settings FOR DELETE USING (public.is_admin());

-- Media Policies
CREATE POLICY "Media is viewable by everyone." ON public.media FOR SELECT USING (true);
CREATE POLICY "Admins can insert media." ON public.media FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update media." ON public.media FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete media." ON public.media FOR DELETE USING (public.is_admin());

