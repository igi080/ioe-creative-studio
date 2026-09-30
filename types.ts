export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
  image: string;
  isFeatured: boolean;
  isPublished: boolean;
  order: number;
  createdAt: number;
}

export interface PricingPackage {
  id: string;
  name: string;
  category: string;
  description: string;
  image?: string | null;
  price: number | null;
  currency: string;
  billing_period: string;
  features: string[];
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  color_gradient?: string;
  features: string[];
  display_order: number;
  is_active: boolean;
  image?: string;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  client_name: string;
  client_role?: string;
  testimonial?: string;
  content: string;
  rating: number;
  display_order: number;
  is_active: boolean;
  client_image?: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  description: string;
  project_url: string;
  image?: string;
  video_url?: string;
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface HomeSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  content: string;
  button_text: string;
  button_url: string;
  image?: string;
  extra_data?: any;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AboutContent {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  content: string;
  image?: string;
  extra_data?: any;
  created_at: string;
  updated_at: string;
}

export interface ContactSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  storage_path: string;
  alt_text?: string;
  created_at: string;
}

export type QuoteStatus = 'new' | 'reviewing' | 'quoted' | 'approved' | 'in_progress' | 'completed' | 'cancelled';

export interface QuoteRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  company?: string;
  service: string;
  project_description: string;
  budget?: string;
  desired_completion_date?: string;
  additional_requirements?: string;
  reference_file_url?: string;
  reference_file_name?: string;
  agreement_accepted: boolean;
  status: QuoteStatus;
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface LegalHighlight {
  icon?: string;
  title: string;
  description: string;
}

export interface LegalPolicy {
  id: string;
  slug: string;
  title: string;
  badge_text?: string;
  subtitle?: string;
  content: string;
  key_highlights: LegalHighlight[];
  last_updated: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface Payment {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  service_name?: string | null;
  package_name?: string | null;
  amount: number;
  currency: string;
  payment_method?: string | null;
  gateway?: string | null;
  transaction_reference: string;
  gateway_transaction_id?: string | null;
  status: PaymentStatus;
  description?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at?: string;
  paid_at?: string | null;
}

