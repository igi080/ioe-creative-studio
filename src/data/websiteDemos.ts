export interface WebsiteDemo {
  id: string;
  slug: string;
  title: string;
  category: string;
  categorySlug: string;
  badge: 'DEMO' | 'CONCEPT';
  shortDescription: string;
  fullDescription: string;
  targetAudience: string;
  deliveryTime: string;
  image: string;
  previewUrl?: string;
  features: string[];
  pagesIncluded: string[];
  techStack: string[];
  highlights: { title: string; desc: string }[];
  isAvailable: boolean;
}

export const DEMO_CATEGORIES = [
  { slug: 'all', label: 'All Demos' },
  { slug: 'business-corporate', label: 'Business / Corporate' },
  { slug: 'school', label: 'School' },
  { slug: 'ecommerce', label: 'E-commerce' },
  { slug: 'restaurant', label: 'Restaurant' },
  { slug: 'real-estate', label: 'Real Estate' },
  { slug: 'hotel', label: 'Hotel' },
  { slug: 'church', label: 'Church / Ministry' },
  { slug: 'hospital-clinic', label: 'Hospital / Clinic' },
  { slug: 'personal-portfolio', label: 'Personal Portfolio' },
  { slug: 'professional-services', label: 'Professional Services' },
] as const;

export const WEBSITE_DEMOS: WebsiteDemo[] = [
  {
    id: 'demo-business-corporate',
    slug: 'modern-corporate-business-website',
    title: 'Modern Corporate Business Website',
    category: 'Business / Corporate Website',
    categorySlug: 'business-corporate',
    badge: 'CONCEPT',
    shortDescription: 'A professional responsive website designed for companies, SMEs and corporate organizations.',
    fullDescription: 'Designed to elevate your corporate reputation and drive business inquiries. Features an executive hero, high-impact services architecture, case study showcases, interactive team directory, and direct WhatsApp contact channels for prompt lead conversion.',
    targetAudience: 'Corporations, B2B firms, consulting agencies, financial practices, and growing SMEs.',
    deliveryTime: '5 – 7 Business Days',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    features: [
      'Home',
      'About',
      'Services',
      'Projects',
      'Contact',
      'WhatsApp integration'
    ],
    pagesIncluded: [
      'Homepage with Executive Hero & Metrics',
      'About Us & Company Leadership',
      'Corporate Services Grid',
      'Portfolio & Case Studies Archive',
      'Interactive Contact with Office Map',
      'Instant WhatsApp Chat Floating Widget'
    ],
    techStack: ['React / Vite', 'Tailwind CSS', 'Responsive Mobile-First', 'Fast CDN Hosting', 'SEO Schema Ready'],
    highlights: [
      { title: 'Executive Brand Positioning', desc: 'Crafted with premium typography, deep corporate blues, and crisp whitespace.' },
      { title: 'Lead Capture & WhatsApp', desc: 'Instant WhatsApp direct routing ensures prospects reach your sales desk immediately.' },
      { title: 'Cross-Device Responsiveness', desc: 'Pixel-perfect rendering across iPhones, Android tablets, iPads, and high-resolution monitors.' }
    ],
    isAvailable: true
  },
  {
    id: 'demo-school',
    slug: 'modern-school-website',
    title: 'Modern School Website',
    category: 'School Website',
    categorySlug: 'school',
    badge: 'CONCEPT',
    shortDescription: 'A professional website concept for schools, colleges, training centres and educational organizations.',
    fullDescription: 'A friendly and authoritative digital portal for modern educational institutions. Includes dynamic academic program overviews, simplified admissions guidance, news bulletins, campus photo gallery, and an intuitive parent/student inquiry desk.',
    targetAudience: 'Primary & Secondary Schools, Colleges, International Academies, and Professional Training Institutes.',
    deliveryTime: '6 – 8 Business Days',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    features: [
      'About the school',
      'Programs',
      'Admissions',
      'News',
      'Gallery',
      'Contact'
    ],
    pagesIncluded: [
      'Homepage with Principal Welcome & Announcements',
      'About School, Vision & Mission',
      'Curriculum & Academic Programs',
      'Step-by-Step Admissions & Application Form',
      'School Events & Campus Life Gallery',
      'Contact & Campus Visit Booking Desk'
    ],
    techStack: ['Responsive Layout', 'Admissions Lead Form', 'Media Gallery Grid', 'Fast Asset Delivery', 'Parent Noticeboard Ready'],
    highlights: [
      { title: 'Simplified Admissions', desc: 'Step-by-step guidance and downloadable brochures streamline student enrollment.' },
      { title: 'Campus Life Gallery', desc: 'Vibrant photo galleries highlighting laboratories, sports, arts, and graduations.' },
      { title: 'Parent & Guardian Portal Teaser', desc: 'Ready for announcements, term calendars, and direct contact with school administration.' }
    ],
    isAvailable: true
  },
  {
    id: 'demo-ecommerce',
    slug: 'modern-online-store',
    title: 'Modern Online Store',
    category: 'E-commerce Website',
    categorySlug: 'ecommerce',
    badge: 'DEMO',
    shortDescription: 'A responsive online shopping website concept for businesses selling products online.',
    fullDescription: 'Engineered for seamless product discovery and effortless shopping. Features clean grid collections, multi-variant product selectors, slide-out shopping cart, frictionless multi-step checkout, and seamless payment gateway architecture (compatible with Paystack, cards, and mobile transfers).',
    targetAudience: 'Fashion boutiques, electronics retailers, beauty brands, supermarket stores, and digital goods sellers.',
    deliveryTime: '7 – 10 Business Days',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80',
    features: [
      'Product catalogue',
      'Product details',
      'Shopping cart',
      'Checkout',
      'Customer contact',
      'Payment integration concept'
    ],
    pagesIncluded: [
      'High-Conversion Storefront Hero & Featured Products',
      'Filterable Product Catalogue (Categories, Price, Sort)',
      'Detailed Product View with Image Zoom & Stock Status',
      'Persistent Shopping Cart Drawer',
      'Streamlined Checkout with Address & Shipping',
      'Payment Gateway Integration Concept (Paystack & Cards)'
    ],
    techStack: ['Cart & State Management', 'Payment Integration Ready', 'Inventory & Variant Controls', 'Order Notification Alerts'],
    highlights: [
      { title: 'Frictionless Checkout', desc: 'Optimized for mobile shoppers with 1-click cart management and secure payment gateways.' },
      { title: 'Showcase Grid & Filters', desc: 'Filter by category, price, and availability with instant live visual feedback.' },
      { title: 'Order & WhatsApp Alerts', desc: 'Optional automatic WhatsApp order confirmation directly to the merchant.' }
    ],
    isAvailable: true
  },
  {
    id: 'demo-restaurant',
    slug: 'restaurant-food-business-website',
    title: 'Restaurant & Food Business Website',
    category: 'Restaurant Website',
    categorySlug: 'restaurant',
    badge: 'CONCEPT',
    shortDescription: 'A modern website concept for restaurants, food businesses and catering services.',
    fullDescription: 'An appetite-inducing digital home for culinary establishments. Features rich categorized food menus with dietary badges, high-resolution photography, instant table reservation forms, interactive location & opening hours, and direct WhatsApp ordering.',
    targetAudience: 'Fine dining restaurants, casual cafes, cloud kitchens, bakeries, bars, and catering services.',
    deliveryTime: '4 – 6 Business Days',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    features: [
      'Menu',
      'Gallery',
      'About',
      'Reservations/contact',
      'Location',
      'WhatsApp ordering'
    ],
    pagesIncluded: [
      'Sensory Landing with Chef Recommendations',
      'Interactive Food & Drinks Menu with Price Tags',
      'Atmospheric Dining Room & Event Gallery',
      'Chef Story, Kitchen Philosophy & Heritage',
      'Table Reservation & Private Dining Request Desk',
      'Google Maps Location & WhatsApp Quick Ordering'
    ],
    techStack: ['Interactive Menu Filter', 'Table Booking Form', 'WhatsApp Direct Order API', 'Mobile-First Responsive'],
    highlights: [
      { title: 'Interactive Food Menu', desc: 'Categorized by Appetizers, Mains, Specials, and Drinks with dietary badges.' },
      { title: 'WhatsApp Quick Ordering', desc: 'Guests can assemble food requests and send order text directly to your kitchen.' },
      { title: 'Table Booking Confirmation', desc: 'Captures guest count, date, time slot, and special dining preferences.' }
    ],
    isAvailable: true
  },
  {
    id: 'demo-real-estate',
    slug: 'real-estate-property-website',
    title: 'Real Estate Property Website',
    category: 'Real Estate Website',
    categorySlug: 'real-estate',
    badge: 'CONCEPT',
    shortDescription: 'A professional property website concept for real estate companies, agents and property developers.',
    fullDescription: 'A prestigious showcase for prime residential, commercial, and luxury developments. Built with intuitive property search filters (buy, rent, bedrooms, location), high-definition architectural photo sliders, agent profiles, and direct property enquiry forms.',
    targetAudience: 'Real estate agencies, property development firms, realtors, property brokers, and asset managers.',
    deliveryTime: '7 – 9 Business Days',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    features: [
      'Property listings',
      'Property details',
      'Gallery',
      'Search/filter',
      'Agent contact',
      'Enquiry form'
    ],
    pagesIncluded: [
      'Featured Properties & Search Bar Hero',
      'Interactive Property Listings Directory',
      'Single Property Showcase with Floorplans & Spec Sheets',
      'High-Resolution Interior & Drone Gallery',
      'Realtor & Property Consultant Bios',
      'Dedicated Schedule-a-Tour / Property Inquiry Form'
    ],
    techStack: ['Dynamic Property Filter', 'Virtual Tour / Map Teaser', 'Lead Capture Form', 'Agent Direct Connect'],
    highlights: [
      { title: 'High-Impact Listing Cards', desc: 'Highlights price, location, bedrooms, bathrooms, and square footage at a glance.' },
      { title: 'Interactive Search Filter', desc: 'Allows buyers to filter properties by transaction type, location, and price bracket.' },
      { title: 'Schedule a Tour CTA', desc: 'Direct tour booking form that routes buyer leads straight to the listing agent.' }
    ],
    isAvailable: true
  },
  // Future Expansion Categories (Hotel, Church, Hospital, Personal Portfolio, Professional Services)
  {
    id: 'demo-hotel',
    slug: 'hotel-hospitality-website',
    title: 'Luxury Hotel & Resort Website',
    category: 'Hotel Website',
    categorySlug: 'hotel',
    badge: 'CONCEPT',
    shortDescription: 'An elegant hospitality website designed for boutique hotels, luxury resorts, and guest lodges.',
    fullDescription: 'Showcases luxury suites, room amenities, dining facilities, wellness spa experiences, and direct room booking reservation flows.',
    targetAudience: 'Hotels, resorts, luxury villas, lodges, and bed & breakfast retreats.',
    deliveryTime: '7 – 10 Business Days',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    features: [
      'Room & Suite Showcase',
      'Amenities & Spa Guide',
      'Dining & Lounges',
      'Booking Inquiry Flow',
      'Virtual Room Tour',
      'Location & Concierge'
    ],
    pagesIncluded: ['Home', 'Rooms & Suites', 'Dining', 'Experiences', 'Reservation Inquiry', 'Contact'],
    techStack: ['Room Availability UI', 'Direct Booking Desk', 'Responsive Mobile-First'],
    highlights: [
      { title: 'Suite Showcase', desc: 'Presents panoramic room photography and tier amenities.' },
      { title: 'Direct Booking Engine', desc: 'Eliminates commission fees with direct guest booking requests.' },
      { title: 'Concierge Direct Chat', desc: 'Instant assistance for airport pickups and VIP reservations.' }
    ],
    isAvailable: false
  },
  {
    id: 'demo-church',
    slug: 'church-ministry-website',
    title: 'Modern Church & Ministry Website',
    category: 'Church / Ministry Website',
    categorySlug: 'church',
    badge: 'CONCEPT',
    shortDescription: 'A welcoming digital sanctuary for churches, faith ministries, and non-profit religious organizations.',
    fullDescription: 'Connects congregations through livestream archives, sermon notes, event calendars, ministry departments, online giving, and prayer request submissions.',
    targetAudience: 'Churches, ministries, fellowships, and faith-based community groups.',
    deliveryTime: '5 – 7 Business Days',
    image: 'https://images.unsplash.com/photo-1548625361-195fe2292f76?auto=format&fit=crop&w=1200&q=80',
    features: [
      'Service Times & Welcome',
      'Sermon Video Archive',
      'Event & Calendar Desk',
      'Ministries & Groups',
      'Online Giving / Tithes',
      'Prayer Request Form'
    ],
    pagesIncluded: ['Home', 'About Our Faith', 'Sermons', 'Events', 'Online Giving', 'Prayer Request Desk'],
    techStack: ['Video Embedding', 'Secure Online Giving Concept', 'Event Noticeboard'],
    highlights: [
      { title: 'Sermon Media Player', desc: 'Organized by series, preacher, and scripture reference.' },
      { title: 'Online Giving Concept', desc: 'Enables tithing and donations via secure card or transfer.' },
      { title: 'Confidential Prayer Requests', desc: 'Private submission box directly to pastoral teams.' }
    ],
    isAvailable: false
  },
  {
    id: 'demo-hospital-clinic',
    slug: 'hospital-clinic-healthcare-website',
    title: 'Hospital & Healthcare Clinic Website',
    category: 'Hospital / Clinic Website',
    categorySlug: 'hospital-clinic',
    badge: 'CONCEPT',
    shortDescription: 'A trustworthy, patient-centered digital home for clinics, diagnostic centres, and medical practices.',
    fullDescription: 'Equipped with medical specialty departments, doctor profiles, patient appointment booking, emergency contact banner, and health insurance information.',
    targetAudience: 'Hospitals, medical centres, dental practices, optometry clinics, and diagnostic labs.',
    deliveryTime: '7 – 10 Business Days',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    features: [
      'Specialty Departments',
      'Doctor Directory',
      'Appointment Booking',
      'Emergency Hotline 24/7',
      'Insurance & HMO Partners',
      'Patient FAQ & Contact'
    ],
    pagesIncluded: ['Home', 'Departments', 'Doctors', 'Book Appointment', 'Patient Services', 'Emergency Contact'],
    techStack: ['Appointment Scheduling UI', 'Doctor Filter', 'Accessibility Compliant'],
    highlights: [
      { title: 'Online Consultation Booking', desc: 'Patients select specialty, date, and preferred doctor.' },
      { title: '24/7 Emergency Header', desc: 'High-visibility emergency contacts for rapid phone dispatch.' },
      { title: 'HMO & Insurance Guide', desc: 'Clear breakdown of accepted medical insurance schemes.' }
    ],
    isAvailable: false
  },
  {
    id: 'demo-personal-portfolio',
    slug: 'personal-creative-portfolio-website',
    title: 'Personal Creative Portfolio Website',
    category: 'Personal Portfolio Website',
    categorySlug: 'personal-portfolio',
    badge: 'CONCEPT',
    shortDescription: 'A distinctive personal showcase for senior creatives, executives, speakers, and independent consultants.',
    fullDescription: 'Crafted to highlight personal brand authority, curated case studies, press features, keynote speaking topics, and direct advisory booking.',
    targetAudience: 'Designers, creative directors, tech executives, authors, speakers, and independent consultants.',
    deliveryTime: '4 – 6 Business Days',
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    features: [
      'Hero Bio & Statement',
      'Selected Case Studies',
      'Speaking & Media Desk',
      'Skills & Methodology',
      'Testimonials & Press',
      'Direct Consultation Booking'
    ],
    pagesIncluded: ['Home', 'Work', 'About & Philosophy', 'Speaking', 'Articles', 'Get in Touch'],
    techStack: ['Editorial Typography', 'Smooth Interactive Motion', 'Fast Portfolio Grid'],
    highlights: [
      { title: 'Editorial Narrative', desc: 'Elevates your achievements with modern editorial typography.' },
      { title: 'Case Study Deep Dives', desc: 'Detailed problem-solution-impact storytelling layouts.' },
      { title: 'Advisory Consultation Form', desc: 'Streamlined inquiry form for speaking and consulting.' }
    ],
    isAvailable: false
  },
  {
    id: 'demo-professional-services',
    slug: 'professional-services-firm-website',
    title: 'Professional Services Firm Website',
    category: 'Professional Services Website',
    categorySlug: 'professional-services',
    badge: 'CONCEPT',
    shortDescription: 'An authoritative web presence for legal firms, accounting practices, and advisory consultancies.',
    fullDescription: 'Builds client trust with practice area overviews, partner credentials, client advisory insights, and confidential case evaluation requests.',
    targetAudience: 'Law firms, accounting practices, tax advisors, management consultancies, and engineering firms.',
    deliveryTime: '6 – 8 Business Days',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    features: [
      'Practice Areas',
      'Partners & Associates',
      'Client Case Results',
      'Insights & Publications',
      'Confidential Consultation Desk',
      'Office Locations'
    ],
    pagesIncluded: ['Home', 'Practice Areas', 'Our Team', 'Insights', 'Confidential Consultation', 'Contact'],
    techStack: ['Practice Directory', 'Confidential Inquiry Form', 'Document Download Links'],
    highlights: [
      { title: 'Practice Area Directory', desc: 'Detailed breakdowns of legal and advisory capabilities.' },
      { title: 'Partner Credential Profiles', desc: 'Highlights bar admissions, qualifications, and publications.' },
      { title: 'Confidential Inquiry Desk', desc: 'High-security inquiry form for sensitive client matters.' }
    ],
    isAvailable: false
  }
];
