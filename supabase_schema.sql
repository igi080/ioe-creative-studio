-- Create the products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT NOT NULL,
  image TEXT,
  "isFeatured" BOOLEAN DEFAULT false,
  "isPublished" BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  "createdAt" BIGINT DEFAULT (extract(epoch from now()) * 1000)
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- 1. Public Read Access
CREATE POLICY "Allow public read access on published products" 
  ON public.products FOR SELECT 
  USING (true); -- Anyone can read products

-- 2. Authenticated Write Access
CREATE POLICY "Allow authenticated users to insert" 
  ON public.products FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update" 
  ON public.products FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to delete" 
  ON public.products FOR DELETE 
  TO authenticated 
  USING (true);
