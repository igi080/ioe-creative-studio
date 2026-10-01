-- ==============================================================================
-- IOE CREATIVE STUDIO - CMS PHASE 2: FAQS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Select Policies (Public read)
CREATE POLICY "Allow public read access on faqs" ON public.faqs FOR SELECT USING (is_active = true);
CREATE POLICY "Allow admins to read all faqs" ON public.faqs FOR SELECT TO authenticated USING (public.is_admin());

-- Admin Write Policies (using existing public.is_admin())
CREATE POLICY "Allow admins to insert faqs" ON public.faqs FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Allow admins to update faqs" ON public.faqs FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Allow admins to delete faqs" ON public.faqs FOR DELETE TO authenticated USING (public.is_admin());

-- Grants
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.faqs TO authenticated;

-- Seed existing FAQs
INSERT INTO public.faqs (question, answer, display_order) VALUES
('What services do you offer?', 'We offer a wide range of creative and technical services, including Creative Art Design, Static Graphics, Motion Graphics, Animation, Branding, and Full-Stack Web Development.', 1),
('How do we start a project?', 'Simply reach out via our contact page with your project details. We''ll schedule a consultation to discuss your vision, timeline, and budget before providing a detailed proposal.', 2),
('What is your typical turnaround time?', 'Turnaround times vary depending on the scope and complexity of the project. A brand identity package might take 2-3 weeks, while a full-stack web application could take 8-12 weeks. We''ll provide a clear timeline during our consultation.', 3),
('Do you require a deposit?', 'Yes, we typically require a 50% deposit to commence work, with the remaining balance due upon project completion and final approval.', 4)
ON CONFLICT DO NOTHING;
