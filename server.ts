import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.set('trust proxy', true);
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));
const PORT = 3000;

// Initialize Supabase Clients (Server-side)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

// Server client: Uses service role if available for unrestricted server operations, otherwise anon key
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey) 
  : supabase;

// Initialize R2 Client
const r2AccountId = process.env.R2_ACCOUNT_ID;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME;

const s3Client = r2AccountId && r2AccessKeyId && r2SecretAccessKey ? new S3Client({
  region: "auto",
  endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
}) : null;

// Middleware to verify Admin JWT
const verifyAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }
    const token = authHeader.split(' ')[1];
    if (!supabaseUrl || !supabaseAnonKey) {
      res.status(500).json({ error: 'Server database configuration missing' });
      return;
    }

    const scopedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await scopedSupabase.auth.getUser(token);
    if (authError || !user) {
      res.status(401).json({ error: 'Unauthorized token' });
      return;
    }

    // Verify Admin Status
    const { data: isAdmin, error: adminError } = await scopedSupabase.rpc('is_admin');
    
    if (adminError || !isAdmin) {
      res.status(403).json({ error: 'Forbidden: Not an admin' });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ error: 'Internal server error during verification' });
  }
};

// Health Check API route
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Express server running", 
    r2_configured: !!s3Client,
    paystack_configured: !!process.env.PAYSTACK_SECRET_KEY,
    paystack_mode: (process.env.PAYSTACK_SECRET_KEY || '').startsWith('sk_test_') ? 'test' : ((process.env.PAYSTACK_SECRET_KEY || '').startsWith('sk_live_') ? 'live' : 'unconfigured')
  });
});

// Paystack Gateway Config (Safe client-facing metadata, NEVER returns secrets)
app.get("/api/payments/config", (req, res) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY ? process.env.PAYSTACK_SECRET_KEY.trim() : '';
  res.json({
    configured: !!secretKey,
    test_mode: secretKey.startsWith('sk_test_'),
    currency: 'NGN',
    gateway: 'paystack'
  });
});

// 1. Initialize Payment Endpoint
app.post("/api/payments/initialize", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { 
      customer_name, 
      customer_email, 
      customer_phone, 
      service_name, 
      package_name, 
      package_id,
      amount, 
      currency = 'NGN',
      description 
    } = req.body;

    // 1. Validate customer name
    if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length < 2) {
      res.status(400).json({ success: false, error: 'A valid customer name is required (at least 2 characters).' });
      return;
    }

    // 2. Validate customer email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customer_email || typeof customer_email !== 'string' || !emailRegex.test(customer_email.trim())) {
      res.status(400).json({ success: false, error: 'A valid email address is required.' });
      return;
    }

    let authoritativeAmount: number = Number(amount);
    let authoritativeCurrency: string = typeof currency === 'string' && currency.trim() ? currency.trim().toUpperCase() : 'NGN';
    let resolvedServiceName: string = typeof service_name === 'string' ? service_name.trim() : '';
    let resolvedPackageName: string = typeof package_name === 'string' ? package_name.trim() : '';

    // 3. Obtain authoritative package price from database where possible
    if (supabase) {
      try {
        let pkgQuery = supabase.from('pricing_packages').select('*');
        if (package_id && typeof package_id === 'string' && package_id.trim()) {
          pkgQuery = pkgQuery.eq('id', package_id.trim());
        } else if (resolvedPackageName) {
          pkgQuery = pkgQuery.ilike('name', resolvedPackageName);
        }

        const { data: dbPackages, error: pkgError } = await pkgQuery.limit(1);

        if (!pkgError && dbPackages && dbPackages.length > 0) {
          const dbPkg = dbPackages[0];
          resolvedPackageName = dbPkg.name || resolvedPackageName;
          if (dbPkg.category && !resolvedServiceName) {
            resolvedServiceName = dbPkg.category;
          }

          if (dbPkg.price !== null && dbPkg.price !== undefined && Number(dbPkg.price) > 0) {
            authoritativeAmount = Number(dbPkg.price);
            if (dbPkg.currency) {
              const cleanedCurrency = String(dbPkg.currency).replace(/[^a-zA-Z]/g, '').trim().toUpperCase();
              if (cleanedCurrency.length === 3) {
                authoritativeCurrency = cleanedCurrency;
              }
            }
          } else {
            // Packages without a pre-set fixed price require quotation first
            res.status(400).json({ 
              success: false, 
              error: `The package "${dbPkg.name}" requires a custom quotation. Please request a quote before initiating payment.` 
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Could not query pricing_packages for authoritative price, using validated input:', err);
      }
    }

    // 4. Validate amount (Must be a positive number, minimum 100 for NGN transactions)
    if (!authoritativeAmount || isNaN(authoritativeAmount) || authoritativeAmount <= 0) {
      res.status(400).json({ success: false, error: 'A valid positive payment amount is required.' });
      return;
    }

    // 5. Generate server-side unique transaction reference
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const transactionReference = `IOE-PAY-${timestamp}-${randomHex}`;

    // 6. Record payment in public.payments with 'pending' status
    if (supabase) {
      const paymentRecord = {
        customer_name: customer_name.trim(),
        customer_email: customer_email.trim().toLowerCase(),
        customer_phone: customer_phone && typeof customer_phone === 'string' ? customer_phone.trim() : null,
        service_name: resolvedServiceName || null,
        package_name: resolvedPackageName || null,
        amount: authoritativeAmount,
        currency: authoritativeCurrency,
        payment_method: 'card',
        gateway: 'paystack',
        transaction_reference: transactionReference,
        status: 'pending',
        description: description || `Payment for ${resolvedPackageName || resolvedServiceName || 'IOE Creative Service'}`,
        metadata: {
          package_id: package_id || null,
          package_name: resolvedPackageName || null,
          service_name: resolvedServiceName || null,
          customer_name: customer_name.trim(),
          customer_email: customer_email.trim().toLowerCase()
        }
      };

      // Perform insert using server client (without .select() to respect strict anon insert permissions)
      const targetDb = supabaseAdmin || supabase;
      const { error: insertError } = await targetDb.from('payments').insert([paymentRecord]);
      if (insertError) {
        console.error('Error inserting pending payment into Supabase:', insertError);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to record initial payment order. Please ensure database permissions are configured.' 
        });
        return;
      }
    }

    // 7. Verify Paystack Secret Key is configured on the server
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY ? process.env.PAYSTACK_SECRET_KEY.trim() : '';
    if (!paystackSecret) {
      console.error('PAYSTACK_SECRET_KEY is not configured in server environment');
      res.status(503).json({
        success: false,
        code: 'PAYSTACK_NOT_CONFIGURED',
        error: 'Paystack payment gateway is not configured on the server. Please set PAYSTACK_SECRET_KEY in server environment.',
        reference: transactionReference
      });
      return;
    }

    // 8. Call Paystack API to initialize checkout session
    // Amount must be in subunits (kobo for NGN, cents for USD)
    const amountInSubunits = Math.round(authoritativeAmount * 100);
    
    // Resolve origin with https guarantee for cloud/production domains
    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol = typeof forwardedProto === 'string' 
      ? forwardedProto.split(',')[0].trim() 
      : (req.secure ? 'https' : req.protocol);
    const host = req.get('host') || '';
    let origin = req.headers.origin;
    if (!origin && host) {
      origin = `${protocol}://${host}`;
    }
    if (origin && origin.startsWith('http://') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      origin = origin.replace('http://', 'https://');
    }
    const callbackUrl = `${origin || 'https://ais-dev-hqypc5i7hmgdjlxp3tzmxt-174724498018.europe-west2.run.app'}/payment/callback`;

    const paystackPayload = {
      email: customer_email.trim().toLowerCase(),
      amount: amountInSubunits,
      currency: authoritativeCurrency,
      reference: transactionReference,
      callback_url: callbackUrl,
      metadata: {
        customer_name: customer_name.trim(),
        customer_phone: customer_phone || null,
        service_name: resolvedServiceName || null,
        package_name: resolvedPackageName || null,
        custom_fields: [
          {
            display_name: 'Customer Name',
            variable_name: 'customer_name',
            value: customer_name.trim()
          },
          {
            display_name: 'Service / Package',
            variable_name: 'service_package',
            value: `${resolvedServiceName} ${resolvedPackageName}`.trim() || 'Creative Studio Service'
          },
          {
            display_name: 'Transaction Ref',
            variable_name: 'transaction_reference',
            value: transactionReference
          }
        ]
      }
    };

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paystackPayload)
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status || !paystackData.data?.authorization_url) {
      console.error('Paystack initialization response error:', paystackData);
      res.status(400).json({
        success: false,
        error: paystackData.message || 'Failed to initialize payment session with Paystack.'
      });
      return;
    }

    // 9. Return only non-sensitive checkout information to browser
    res.json({
      success: true,
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: transactionReference
    });
  } catch (error) {
    console.error('Unexpected error in /api/payments/initialize:', error);
    res.status(500).json({ 
      success: false, 
      error: 'An unexpected error occurred while preparing your payment.' 
    });
  }
});

// 2. Server-Side Payment Verification Endpoint
app.post("/api/payments/verify", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { reference } = req.body;

    if (!reference || typeof reference !== 'string' || !reference.trim()) {
      res.status(400).json({ success: false, error: 'Transaction reference is required for verification.' });
      return;
    }

    const cleanReference = reference.trim();

    // 1. Retrieve local payment record to check idempotency and record existence
    let localPayment: any = null;

    if (supabase) {
      // First attempt: Check via supabaseAdmin (bypasses RLS if service key is set)
      if (supabaseAdmin && supabaseServiceRoleKey) {
        const { data, error } = await supabaseAdmin
          .from('payments')
          .select('*')
          .eq('transaction_reference', cleanReference)
          .maybeSingle();

        if (!error && data) {
          localPayment = data;
        }
      }

      // Second attempt: Call get_payment_for_verification RPC
      if (!localPayment) {
        try {
          const { data, error } = await supabase
            .rpc('get_payment_for_verification', { p_reference: cleanReference });
          if (!error && data && data.id) {
            localPayment = data;
          }
        } catch (rpcErr) {
          // RPC may not be installed yet
        }
      }
    }

    // Idempotency: If already marked as paid AND has gateway_transaction_id saved, return immediately
    if (localPayment && localPayment.status === 'paid' && localPayment.gateway_transaction_id && localPayment.gateway_transaction_id !== 'Pending Gateway Sync') {
      res.json({
        success: true,
        already_verified: true,
        message: 'Payment has already been confirmed and synchronized with gateway.',
        payment: localPayment
      });
      return;
    }

    // 2. Paystack Secret Key check
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY ? process.env.PAYSTACK_SECRET_KEY.trim() : '';
    if (!paystackSecret) {
      res.status(503).json({
        success: false,
        code: 'PAYSTACK_NOT_CONFIGURED',
        error: 'Paystack secret key is not configured on the server. Unable to verify transaction.'
      });
      return;
    }

    // 3. Verify directly with Paystack API from server
    const paystackVerifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(cleanReference)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paystackData = await paystackVerifyRes.json();

    if (!paystackVerifyRes.ok || !paystackData.status || !paystackData.data) {
      console.error('Paystack verification response failed:', paystackData);
      res.status(400).json({
        success: false,
        error: paystackData.message || 'Payment verification failed with the payment provider.'
      });
      return;
    }

    const trx = paystackData.data;
    const gatewayId = String(trx.id || '');
    const channel = trx.channel || localPayment?.payment_method || 'card';
    const paidAt = trx.paid_at || localPayment?.paid_at || new Date().toISOString();

    // 4. Handle Case: Payment was already marked 'paid' locally (e.g. historical payment or manual confirmation)
    // Synchronize the gateway_transaction_id without altering historical status or amount
    if (localPayment && localPayment.status === 'paid') {
      const updatedPayment = await markPaymentPaidOnServer(cleanReference, gatewayId, paidAt, channel);
      res.json({
        success: true,
        already_verified: true,
        message: 'Payment verified and Gateway Transaction ID synchronized successfully.',
        payment: updatedPayment || {
          ...localPayment,
          gateway_transaction_id: gatewayId,
          payment_method: channel,
          status: 'paid'
        }
      });
      return;
    }

    // 5. Handle genuine successful payment from gateway
    if (trx.status === 'success') {
      // Amount verification: Must meet or exceed authoritative amount (in kobo)
      if (localPayment && localPayment.amount) {
        const expectedKobo = Math.round(Number(localPayment.amount) * 100);
        if (trx.amount < expectedKobo) {
          console.error(`Amount mismatch for ${cleanReference}: expected ${expectedKobo}, got ${trx.amount}`);
          await markPaymentFailedOnServer(cleanReference, 'failed', gatewayId);
          res.status(400).json({
            success: false,
            error: 'The amount paid does not match the invoice amount.'
          });
          return;
        }
      }

      // Currency verification
      if (localPayment && localPayment.currency && trx.currency) {
        if (localPayment.currency.toUpperCase() !== trx.currency.toUpperCase()) {
          console.error(`Currency mismatch for ${cleanReference}: expected ${localPayment.currency}, got ${trx.currency}`);
          await markPaymentFailedOnServer(cleanReference, 'failed', gatewayId);
          res.status(400).json({
            success: false,
            error: 'Payment currency does not match invoice currency.'
          });
          return;
        }
      }

      // 6. Update local payment record to 'paid' with actual gateway_transaction_id
      const updatedPayment = await markPaymentPaidOnServer(cleanReference, gatewayId, paidAt, channel);

      res.json({
        success: true,
        message: 'Payment verified and confirmed successfully.',
        payment: updatedPayment || {
          transaction_reference: cleanReference,
          status: 'paid',
          amount: trx.amount / 100,
          currency: trx.currency || 'NGN',
          paid_at: paidAt,
          gateway_transaction_id: gatewayId,
          payment_method: channel,
          customer_name: localPayment?.customer_name || trx.customer?.first_name || 'Customer',
          customer_email: localPayment?.customer_email || trx.customer?.email,
          package_name: localPayment?.package_name,
          service_name: localPayment?.service_name
        }
      });
      return;
    }

    // 7. Handle in-progress transactions (e.g. 'ongoing', 'pending', 'processing')
    if (trx.status === 'ongoing' || trx.status === 'pending' || trx.status === 'processing') {
      await markPaymentFailedOnServer(cleanReference, 'processing', gatewayId);
      res.status(200).json({
        success: false,
        status: 'processing',
        gateway_status: trx.status,
        gateway_transaction_id: gatewayId,
        message: `Payment is currently in progress (${trx.gateway_response || trx.status}). Please complete your transaction.`,
        payment: {
          ...(localPayment || {}),
          transaction_reference: cleanReference,
          status: 'processing',
          gateway_transaction_id: gatewayId,
          payment_method: channel
        }
      });
      return;
    }

    // 8. Handle failed or abandoned transactions
    const mappedStatus = trx.status === 'abandoned' ? 'cancelled' : 'failed';
    await markPaymentFailedOnServer(cleanReference, mappedStatus, gatewayId);
    res.status(400).json({
      success: false,
      status: mappedStatus,
      gateway_status: trx.status,
      gateway_transaction_id: gatewayId,
      error: `Payment was not completed. Gateway status: ${trx.gateway_response || trx.status || 'Transaction incomplete'}`
    });
  } catch (error) {
    console.error('Unexpected error in /api/payments/verify:', error);
    res.status(500).json({ 
      success: false, 
      error: 'An unexpected server error occurred during payment verification.' 
    });
  }
});

// 3. Paystack Webhook Endpoint
app.post("/api/payments/webhook", async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY ? process.env.PAYSTACK_SECRET_KEY.trim() : '';
    if (!paystackSecret) {
      console.error('PAYSTACK_SECRET_KEY is not configured on the server for webhook verification');
      res.status(500).json({ error: 'Paystack secret key is not configured' });
      return;
    }

    const signature = req.headers['x-paystack-signature'];
    if (!signature || typeof signature !== 'string') {
      console.warn('Paystack webhook received with missing x-paystack-signature header');
      res.status(401).json({ error: 'Missing x-paystack-signature header' });
      return;
    }

    // Verify HMAC-SHA512 signature using raw body buffer
    const rawBodyBuffer = (req as any).rawBody;
    const rawBody = rawBodyBuffer ? rawBodyBuffer.toString('utf8') : JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha512', paystackSecret)
      .update(rawBody)
      .digest('hex');

    let signatureValid = false;
    try {
      const sigBuf = Buffer.from(signature, 'hex');
      const expBuf = Buffer.from(expectedSignature, 'hex');
      signatureValid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      signatureValid = signature === expectedSignature;
    }

    if (!signatureValid) {
      console.warn('Paystack webhook received with invalid signature');
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }

    const event = req.body;
    if (!event || typeof event !== 'object') {
      res.status(400).json({ error: 'Invalid webhook payload' });
      return;
    }

    // Handle 'charge.success' event
    if (event.event === 'charge.success') {
      const reference = event.data?.reference;
      if (!reference || typeof reference !== 'string') {
        res.status(400).json({ error: 'Missing transaction reference in event payload' });
        return;
      }

      const cleanReference = reference.trim();

      // Idempotency: Retrieve local payment record to check if already marked 'paid'
      let localPayment: any = null;
      if (supabase) {
        if (supabaseAdmin && supabaseServiceRoleKey) {
          const { data, error } = await supabaseAdmin
            .from('payments')
            .select('*')
            .eq('transaction_reference', cleanReference)
            .maybeSingle();

          if (!error && data) {
            localPayment = data;
          }
        }

        if (!localPayment) {
          try {
            const { data, error } = await supabase
              .rpc('get_payment_for_verification', { p_reference: cleanReference });
            if (!error && data && data.id) {
              localPayment = data;
            }
          } catch (rpcErr) {
            // RPC fallback
          }
        }
      }

      // If already marked as paid AND has gateway_transaction_id, return 200 OK immediately (idempotent)
      if (localPayment && localPayment.status === 'paid' && localPayment.gateway_transaction_id && localPayment.gateway_transaction_id !== 'Pending Gateway Sync') {
        res.status(200).json({
          status: 'success',
          idempotent: true,
          message: 'Payment already processed and gateway transaction ID synchronized.'
        });
        return;
      }

      // Verify transaction server-side with Paystack API before treating it as confirmed
      const paystackVerifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(cleanReference)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${paystackSecret}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const paystackData = await paystackVerifyRes.json();

      if (!paystackVerifyRes.ok || !paystackData.status || !paystackData.data) {
        console.error('Paystack webhook verification failed with Paystack API:', paystackData);
        res.status(400).json({
          status: 'error',
          message: paystackData.message || 'Payment verification failed with provider.'
        });
        return;
      }

      const trx = paystackData.data;
      const gatewayId = String(trx.id || '');
      const channel = trx.channel || localPayment?.payment_method || 'card';
      const paidAt = trx.paid_at || localPayment?.paid_at || new Date().toISOString();

      if (trx.status !== 'success') {
        const mappedStatus = (trx.status === 'ongoing' || trx.status === 'processing') ? 'processing' : (trx.status === 'abandoned' ? 'cancelled' : 'failed');
        await markPaymentFailedOnServer(cleanReference, mappedStatus, gatewayId);
        res.status(200).json({
          status: 'handled',
          message: `Transaction verified with status: ${trx.status}`
        });
        return;
      }

      // Amount integrity check if local record has amount
      if (localPayment && localPayment.amount) {
        const expectedKobo = Math.round(Number(localPayment.amount) * 100);
        if (trx.amount < expectedKobo) {
          console.error(`Amount mismatch in webhook for ${cleanReference}: expected ${expectedKobo}, got ${trx.amount}`);
          await markPaymentFailedOnServer(cleanReference, 'failed', gatewayId);
          res.status(400).json({ status: 'error', message: 'Amount mismatch' });
          return;
        }
      }

      // Currency integrity check if local record has currency
      if (localPayment && localPayment.currency && trx.currency) {
        if (localPayment.currency.toUpperCase() !== trx.currency.toUpperCase()) {
          console.error(`Currency mismatch in webhook for ${cleanReference}: expected ${localPayment.currency}, got ${trx.currency}`);
          await markPaymentFailedOnServer(cleanReference, 'failed', gatewayId);
          res.status(400).json({ status: 'error', message: 'Currency mismatch' });
          return;
        }
      }

      // Update existing database record in public.payments to 'paid' with actual gateway_transaction_id
      const updatedPayment = await markPaymentPaidOnServer(cleanReference, gatewayId, paidAt, channel);

      // If no local record existed yet, create one
      if (!updatedPayment && !localPayment && supabase) {
        const targetDb = supabaseAdmin || supabase;
        const newRecord = {
          customer_name: trx.customer?.first_name || trx.metadata?.customer_name || 'Customer',
          customer_email: (trx.customer?.email || trx.metadata?.customer_email || 'customer@example.com').toLowerCase(),
          customer_phone: trx.customer?.phone || trx.metadata?.customer_phone || null,
          service_name: trx.metadata?.service_name || null,
          package_name: trx.metadata?.package_name || null,
          amount: trx.amount ? trx.amount / 100 : 0,
          currency: trx.currency || 'NGN',
          payment_method: channel,
          gateway: 'paystack',
          transaction_reference: cleanReference,
          gateway_transaction_id: gatewayId,
          status: 'paid',
          paid_at: paidAt,
          description: `Paystack payment for ${trx.metadata?.package_name || trx.metadata?.service_name || 'IOE Creative Service'}`,
          metadata: trx.metadata || {}
        };
        await targetDb.from('payments').insert([newRecord]);
      }

      res.status(200).json({
        status: 'success',
        message: 'Payment confirmed and updated successfully via webhook.'
      });
      return;
    }

    // Acknowledge receipt for all other events (e.g. transfer, refund)
    res.status(200).json({
      status: 'ignored',
      message: `Event '${event?.event}' acknowledged.`
    });
  } catch (error: any) {
    console.error('Unexpected error in /api/payments/webhook:', error);
    res.status(500).json({ error: 'Internal server error processing webhook' });
  }
});

// Helper: Mark payment as paid in database
async function markPaymentPaidOnServer(reference: string, gatewayId: string, paidAt: string, channel: string) {
  if (!supabase) return null;

  // Attempt 1: Via supabaseAdmin if service role key is available
  if (supabaseAdmin && supabaseServiceRoleKey) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'paid',
        gateway_transaction_id: gatewayId,
        paid_at: paidAt,
        payment_method: channel,
        updated_at: new Date().toISOString()
      })
      .eq('transaction_reference', reference)
      .select('*')
      .maybeSingle();

    if (!error && data) return data;
  }

  // Attempt 2: Via confirm_payment_paid RPC function
  try {
    const { data, error } = await supabase.rpc('confirm_payment_paid', {
      p_reference: reference,
      p_gateway_id: gatewayId,
      p_paid_at: paidAt,
      p_channel: channel
    });
    if (!error && data && data.id) return data;
    if (error) {
      console.warn('RPC confirm_payment_paid failed or not installed:', error.message);
    }
  } catch (err) {
    console.warn('RPC confirm_payment_paid invocation error:', err);
  }

  return null;
}

// Helper: Mark payment as failed/cancelled/processing in database
async function markPaymentFailedOnServer(reference: string, status: string, gatewayId: string) {
  if (!supabase) return;

  const validStatuses = ['pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'];
  const safeStatus = validStatuses.includes(status) ? status : 'failed';

  if (supabaseAdmin && supabaseServiceRoleKey) {
    await supabaseAdmin
      .from('payments')
      .update({
        status: safeStatus,
        gateway_transaction_id: gatewayId || null,
        updated_at: new Date().toISOString()
      })
      .eq('transaction_reference', reference);
    return;
  }

  try {
    await supabase.rpc('mark_payment_failed', {
      p_reference: reference,
      p_status: safeStatus,
      p_gateway_id: gatewayId || null
    });
  } catch (err) {
    console.warn('RPC mark_payment_failed error:', err);
  }
}

// Generate Presigned URL for Upload
app.post("/api/upload-url", verifyAdmin, async (req: express.Request, res: express.Response): Promise<void> => {
  if (!s3Client || !r2BucketName) {
    res.status(503).json({ error: 'R2 storage is not configured on the server' });
    return;
  }

  try {
    const { filename, contentType } = req.body;
    
    if (!filename || !contentType) {
      res.status(400).json({ error: 'Filename and contentType are required' });
      return;
    }

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(contentType)) {
      res.status(400).json({ error: 'Invalid file type. Allowed: JPG, PNG, WebP, SVG, MP4, WebM.' });
      return;
    }

    const command = new PutObjectCommand({
      Bucket: r2BucketName,
      Key: filename,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes
    
    res.json({ 
      uploadUrl: url, 
      key: filename,
      publicUrl: (process.env.R2_PUBLIC_URL || 'https://pub-24582a54e2714c96a2baaaf19911cd68.r2.dev').replace(/\/$/, '') + `/${filename}` 
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL: ' + (error.message || 'Unknown server error') });
  }
});

// Delete Media from R2
app.post("/api/delete-media", verifyAdmin, async (req: express.Request, res: express.Response): Promise<void> => {
  if (!s3Client || !r2BucketName) {
    res.status(503).json({ error: 'R2 storage is not configured on the server' });
    return;
  }

  try {
    const { key } = req.body;
    
    if (!key) {
      res.status(400).json({ error: 'Object key is required' });
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: r2BucketName,
      Key: key,
    });

    await s3Client.send(command);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting media from R2:', error);
    res.status(500).json({ error: 'Failed to delete media: ' + (error.message || 'Unknown server error') });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve static files from dist
    console.log("Starting in production mode serving static files...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA Fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
