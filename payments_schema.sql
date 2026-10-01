-- ==============================================================================
-- IOE CREATIVE STUDIO - STAGE 1: PAYMENTS DATABASE SCHEMA & SECURITY POLICIES
-- File: payments_schema.sql
--
-- Description:
-- Establishes the database and Admin CMS foundation to manage IOE payments
-- prior to connecting payment gateways (such as Paystack).
--
-- Supported Statuses:
--   - pending: Payment order initialized, awaiting checkout completion
--   - processing: Transaction in progress/being verified
--   - paid: Payment successfully verified and captured
--   - failed: Transaction failed or rejected
--   - cancelled: Cancelled by user or administrative action
--   - refunded: Transaction refunded to customer
--
-- Security:
--   - Strict Row Level Security (RLS) enabled
--   - Customers CANNOT read or modify arbitrary payment records
--   - Authenticated IOE Administrators (via public.is_admin()) have full access
--   - Sensitive payment credentials (card numbers, CVV, PINs) are NEVER stored
-- ==============================================================================

-- 1. Create table public.payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    service_name TEXT,
    package_name TEXT,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) DEFAULT 'NGN' NOT NULL,
    payment_method TEXT DEFAULT 'card',
    gateway TEXT DEFAULT 'paystack',
    transaction_reference TEXT UNIQUE NOT NULL,
    gateway_transaction_id TEXT,
    status TEXT DEFAULT 'pending' NOT NULL 
        CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded')),
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    paid_at TIMESTAMPTZ
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_customer_email ON public.payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_gateway ON public.payments(gateway);

-- 3. Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_payments_updated_at ON public.payments;
CREATE TRIGGER trg_set_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_payments_updated_at();

-- 4. Automatic paid_at timestamp trigger when payment becomes 'paid'
CREATE OR REPLACE FUNCTION public.handle_payments_paid_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') AND NEW.paid_at IS NULL THEN
        NEW.paid_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_payments_paid_at ON public.payments;
CREATE TRIGGER trg_set_payments_paid_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_payments_paid_at();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- 6A. Admins: Full SELECT permissions for authorized IOE Administrators
DROP POLICY IF EXISTS "Allow admins to select payments" ON public.payments;
CREATE POLICY "Allow admins to select payments"
    ON public.payments
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 6B. Admins: Full INSERT permissions for authorized IOE Administrators
DROP POLICY IF EXISTS "Allow admins to insert payments" ON public.payments;
CREATE POLICY "Allow admins to insert payments"
    ON public.payments
    FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- 6C. Admins: Full UPDATE permissions for authorized IOE Administrators
DROP POLICY IF EXISTS "Allow admins to update payments" ON public.payments;
CREATE POLICY "Allow admins to update payments"
    ON public.payments
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6D. Admins: Full DELETE permissions for authorized IOE Administrators
DROP POLICY IF EXISTS "Allow admins to delete payments" ON public.payments;
CREATE POLICY "Allow admins to delete payments"
    ON public.payments
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 6E. Future client checkout order creation:
-- Allows client checkout to create an order record strictly with 'pending' status.
-- Customers CANNOT read (SELECT), modify (UPDATE), or delete arbitrary payment records.
DROP POLICY IF EXISTS "Allow client checkout to create pending payments" ON public.payments;
CREATE POLICY "Allow client checkout to create pending payments"
    ON public.payments
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (status = 'pending');

-- 7. Role Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT INSERT ON public.payments TO anon;

-- 8. Force schema cache reload
NOTIFY pgrst, 'reload schema';
