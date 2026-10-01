-- ==============================================================================
-- IOE CREATIVE STUDIO - CMS PHASE 1: FOUNDATION TABLES & SEED DATA
-- ==============================================================================

-- 1. site_settings
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. services
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    color_gradient TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Select Policies (Public read)
CREATE POLICY "Allow public read access on site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read access on services" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "Allow admins to read all services" ON public.services FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Allow public read access on testimonials" ON public.testimonials FOR SELECT USING (is_active = true);
CREATE POLICY "Allow admins to read all testimonials" ON public.testimonials FOR SELECT TO authenticated USING (public.is_admin());

-- Admin Write Policies (using existing public.is_admin())
-- site_settings
CREATE POLICY "Allow admins to insert site_settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Allow admins to update site_settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Allow admins to delete site_settings" ON public.site_settings FOR DELETE TO authenticated USING (public.is_admin());

-- services
CREATE POLICY "Allow admins to insert services" ON public.services FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Allow admins to update services" ON public.services FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Allow admins to delete services" ON public.services FOR DELETE TO authenticated USING (public.is_admin());

-- testimonials
CREATE POLICY "Allow admins to insert testimonials" ON public.testimonials FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Allow admins to update testimonials" ON public.testimonials FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Allow admins to delete testimonials" ON public.testimonials FOR DELETE TO authenticated USING (public.is_admin());

-- Grants
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;

GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;

GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;

-- ==============================================================================
-- CMS PHASE 1: SEED EXISTING HARD-CODED DATA
-- ==============================================================================

-- Seed site_settings
INSERT INTO public.site_settings (setting_key, setting_value, category) VALUES
('home_hero_title_html', 'PREMIUM DIGITAL <br className="hidden md:block" /> <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">EXCELLENCE</span>', 'home'),
('home_hero_subtitle', 'A leading Nigerian Creative Studio combining stunning visual identity, motion graphics, animation and full-stack web development.', 'home'),
('about_name', 'Igiharuwe Olayinka Emmanuel', 'about'),
('about_bio_intro', 'Welcome to IOE Creative Studio. We are a professional digital agency focused on delivering high-quality visual communication and robust technical architecture. We combine Creative Art Design, Static/Motion Graphics, and Web Development to build cohesive and powerful digital experiences.', 'about'),
('about_bio_outro', 'As the creative and technical lead, I bridge the gap between premium aesthetics and reliable functionality. Whether you need compelling visual content to engage your audience, or a custom full-stack web application to drive your business forward, we provide trustworthy, end-to-end solutions.', 'about'),
('contact_email', 'Igiharuwe7@gmail.com', 'contact')
ON CONFLICT (setting_key) DO NOTHING;

-- Seed services
INSERT INTO public.services (title, description, icon_name, color_gradient, features, display_order) VALUES
('Creative Art Design', 'High-end visual content tailored to elevate your brand identity across all digital platforms.', 'Palette', 'from-blue-500 to-cyan-400', '["Custom Illustrations", "Digital Art", "Marketing Assets", "Social Media Graphics"]'::jsonb, 1),
('Static Graphics Design', 'Professional layouts and compositions for print and digital marketing materials.', 'PenTool', 'from-indigo-500 to-blue-500', '["Flyers & Posters", "Business Cards", "Banners", "Corporate Profiles"]'::jsonb, 2),
('Motion Graphics Design', 'Engaging animated typography, logos, and graphics that capture attention instantly.', 'Video', 'from-violet-500 to-fuchsia-500', '["Promo Videos", "Logo Reveals", "Social Media Reels", "Explainer Videos"]'::jsonb, 3),
('Animation', 'Dynamic storytelling through 2D and 3D character and product animation sequences.', 'Aperture', 'from-fuchsia-500 to-pink-500', '["2D/3D Animation", "Character Design", "Product Visualization", "Visual Effects"]'::jsonb, 4),
('Branding & Logo Design', 'Comprehensive brand architecture, ensuring a memorable and consistent corporate identity.', 'Layers', 'from-pink-500 to-rose-400', '["Logo Design", "Brand Guidelines", "Typography Selection", "Color Palettes"]'::jsonb, 5),
('Web Development', 'Responsive, fast, and accessible front-end websites tailored for high conversion rates.', 'Layout', 'from-emerald-500 to-teal-400', '["Landing Pages", "Corporate Websites", "UI/UX Implementation", "SEO Optimization"]'::jsonb, 6),
('Full-Stack Web Development', 'Robust, secure, and scalable custom web applications with complex backend logic.', 'Code', 'from-teal-400 to-cyan-400', '["Custom SaaS", "E-Commerce", "Database Architecture", "API Integrations"]'::jsonb, 7),
('AI-Assisted Creative Services', 'Cutting-edge AI integrations for rapid prototyping, content generation, and smart features.', 'Cpu', 'from-amber-500 to-orange-400', '["AI Prototyping", "Content Generation", "Smart Web Features", "Workflow Automation"]'::jsonb, 8)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- ADMIN USERS TABLE REPAIR / FIX FOR ADD & DELETE FAILURES
-- 
-- The failure of "Pricing Add/Save" and "Portfolio Delete" is caused by 
-- the authenticated user not being present in the `admin_users` table, 
-- causing the `public.is_admin()` check to fail for INSERT and DELETE policies.
-- (UPDATE policies were historically insecure, allowing EDIT to work).
-- 
-- This snippet automatically inserts the very first signed-up user into 
-- the admin_users table to repair their admin access privileges.
-- ==============================================================================
INSERT INTO public.admin_users (user_id, role, is_active)
SELECT id, 'admin', true FROM auth.users LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET is_active = EXCLUDED.is_active;
