-- ==============================================================================
-- IOE CREATIVE STUDIO - SEED OFFICIAL PRICING PACKAGES
-- Run this in your Supabase SQL Editor if not already seeded via Admin Dashboard
-- ==============================================================================

INSERT INTO public.pricing_packages (
    id,
    name,
    category,
    description,
    price,
    currency,
    billing_period,
    features,
    image,
    is_featured,
    is_active,
    display_order,
    created_at,
    updated_at
) VALUES 
(
    '7a111111-0001-4000-8000-000000000001',
    'BASIC',
    'Creative Design / Digital Services',
    'A professional starter package for individuals, small businesses, brands, and organizations that need quality digital design and a strong visual presence.',
    30000,
    'NGN',
    NULL,
    '[
        "Professional logo or brand graphic",
        "Up to 3 static promotional designs",
        "Social media-ready graphics",
        "Basic brand color and typography guidance",
        "High-resolution final files",
        "One revision round",
        "Delivery of final files digitally"
    ]'::jsonb,
    '/images/ioe_basic_pkg_1790170332898.jpg',
    false,
    true,
    1,
    now(),
    now()
),
(
    '7a222222-0002-4000-8000-000000000002',
    'BUSINESS',
    'Business Branding & Digital Presence',
    'A complete digital design package for growing businesses that need consistent branding and professional promotional content.',
    50000,
    'NGN',
    NULL,
    '[
        "Professional logo/brand identity design",
        "Up to 6 static promotional designs",
        "Social media graphics",
        "Business flyer/poster designs",
        "Basic brand style guide",
        "High-resolution final files",
        "Two revision rounds",
        "Web-ready and social-media-ready assets",
        "Digital delivery"
    ]'::jsonb,
    '/images/ioe_business_pkg_1790170346116.jpg',
    true,
    true,
    2,
    now(),
    now()
),
(
    '7a333333-0003-4000-8000-000000000003',
    'BRAND PRO',
    'Premium Branding & Digital Innovation',
    'A premium creative package for businesses, organizations, and brands that need a stronger visual identity and a more complete digital presence.',
    100000,
    'NGN',
    NULL,
    '[
        "Professional logo and visual identity",
        "Brand color palette and typography system",
        "Premium brand style guide",
        "Up to 10 static promotional designs",
        "Social media design assets",
        "Marketing flyer/poster designs",
        "Premium presentation graphics",
        "Basic motion/logo animation",
        "Web-ready brand assets",
        "High-resolution source/final files where applicable",
        "Three revision rounds",
        "Priority project handling",
        "Digital delivery"
    ]'::jsonb,
    '/images/ioe_brand_pro_pkg_1790170357058.jpg',
    false,
    true,
    3,
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    billing_period = EXCLUDED.billing_period,
    features = EXCLUDED.features,
    image = EXCLUDED.image,
    is_featured = EXCLUDED.is_featured,
    is_active = EXCLUDED.is_active,
    display_order = EXCLUDED.display_order,
    updated_at = now();

-- Ensure cache is refreshed
NOTIFY pgrst, 'reload schema';
