-- ==============================================================================
-- IOE CREATIVE STUDIO - STAGE 2: PAYSTACK SERVER VERIFICATION RPC HELPER
-- File: payments_verification_rpc.sql
--
-- Description:
-- Provides secure stored functions for server-side verification and updating of
-- payment records by exact transaction reference without weakening table-level RLS.
-- ==============================================================================

-- 1. Helper function for server-side verification lookup by exact reference
CREATE OR REPLACE FUNCTION public.get_payment_for_verification(p_reference TEXT)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment public.payments;
BEGIN
    SELECT * INTO v_payment
    FROM public.payments
    WHERE transaction_reference = p_reference;

    RETURN v_payment;
END;
$$;

-- 2. Helper function to confirm payment as paid after server verification
CREATE OR REPLACE FUNCTION public.confirm_payment_paid(
    p_reference TEXT,
    p_gateway_id TEXT,
    p_paid_at TIMESTAMPTZ,
    p_channel TEXT
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment public.payments;
BEGIN
    UPDATE public.payments
    SET 
        status = 'paid',
        gateway_transaction_id = p_gateway_id,
        paid_at = COALESCE(p_paid_at, now()),
        payment_method = COALESCE(p_channel, payment_method, 'card'),
        updated_at = now()
    WHERE transaction_reference = p_reference
    RETURNING * INTO v_payment;

    RETURN v_payment;
END;
$$;

-- 3. Helper function to mark payment as failed or cancelled
CREATE OR REPLACE FUNCTION public.mark_payment_failed(
    p_reference TEXT,
    p_status TEXT,
    p_gateway_id TEXT
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment public.payments;
BEGIN
    UPDATE public.payments
    SET 
        status = p_status,
        gateway_transaction_id = COALESCE(p_gateway_id, gateway_transaction_id),
        updated_at = now()
    WHERE transaction_reference = p_reference
    RETURNING * INTO v_payment;

    RETURN v_payment;
END;
$$;

-- 4. Execute grants
GRANT EXECUTE ON FUNCTION public.get_payment_for_verification(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_payment_paid(TEXT, TEXT, TIMESTAMPTZ, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_payment_failed(TEXT, TEXT, TEXT) TO anon, authenticated;

-- 5. Force schema cache refresh
NOTIFY pgrst, 'reload schema';
