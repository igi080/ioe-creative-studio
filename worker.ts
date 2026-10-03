import crypto from "crypto";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";

// Helper to safely read environment variables from Cloudflare Workers env or process.env
export function getEnv(env: any, key: string): string {
  if (env && typeof env[key] === "string" && env[key]) {
    return env[key].trim();
  }
  if (typeof process !== "undefined" && process.env && typeof process.env[key] === "string" && process.env[key]) {
    return process.env[key]!.trim();
  }
  return "";
}

// JSON Response helper with full CORS support
export function jsonResponse(data: any, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-paystack-signature",
      ...extraHeaders,
    },
  });
}

// Supabase Clients factory
function getSupabase(env: any) {
  const url = getEnv(env, "VITE_SUPABASE_URL") || getEnv(env, "SUPABASE_URL");
  const anonKey = getEnv(env, "VITE_SUPABASE_PUBLISHABLE_KEY") || getEnv(env, "SUPABASE_ANON_KEY");
  const serviceKey = getEnv(env, "SUPABASE_SERVICE_ROLE_KEY") || getEnv(env, "SUPABASE_SERVICE_KEY");

  const client = url && anonKey ? createClient(url, anonKey) : null;
  const adminClient = url && serviceKey ? createClient(url, serviceKey) : client;

  return { supabase: client, supabaseAdmin: adminClient, supabaseUrl: url, supabaseAnonKey: anonKey };
}

// Cloudflare R2 / S3 Client factory
function getR2Client(env: any) {
  const accountId = getEnv(env, "R2_ACCOUNT_ID");
  const accessKeyId = getEnv(env, "R2_ACCESS_KEY_ID");
  const secretAccessKey = getEnv(env, "R2_SECRET_ACCESS_KEY");
  const bucketName = getEnv(env, "R2_BUCKET_NAME") || "ioe-creative-studio-media";
  const publicUrl = getEnv(env, "R2_PUBLIC_URL") || "https://pub-24582a54e2714c96a2baaaf19911cd68.r2.dev";

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return { s3Client: s3, bucketName, publicUrl };
}

// Admin Verification Middleware for Worker
async function verifyAdmin(request: Request, env: any): Promise<{ authorized: boolean; errorResponse?: Response }> {
  try {
    const authHeader = request.headers.get("Authorization") || request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        authorized: false,
        errorResponse: jsonResponse({ error: "Missing or invalid authorization header" }, 401),
      };
    }
    const token = authHeader.split(" ")[1];
    const { supabaseUrl, supabaseAnonKey } = getSupabase(env);
    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        authorized: false,
        errorResponse: jsonResponse({ error: "Server database configuration missing" }, 500),
      };
    }

    const scopedSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await scopedSupabase.auth.getUser(token);
    if (authError || !user) {
      return {
        authorized: false,
        errorResponse: jsonResponse({ error: "Unauthorized token" }, 401),
      };
    }

    const { data: isAdmin, error: adminError } = await scopedSupabase.rpc("is_admin");
    if (adminError || !isAdmin) {
      return {
        authorized: false,
        errorResponse: jsonResponse({ error: "Forbidden: Not an admin" }, 403),
      };
    }

    return { authorized: true };
  } catch (error: any) {
    console.error("Admin verification error:", error);
    return {
      authorized: false,
      errorResponse: jsonResponse({ error: "Internal server error during verification" }, 500),
    };
  }
}

// Database helper: Mark payment as paid
async function markPaymentPaid(env: any, reference: string, gatewayId: string, paidAt: string, channel: string) {
  const { supabase, supabaseAdmin } = getSupabase(env);
  if (!supabase) return null;

  const serviceKey = getEnv(env, "SUPABASE_SERVICE_ROLE_KEY") || getEnv(env, "SUPABASE_SERVICE_KEY");

  // Attempt 1: Via supabaseAdmin if service role key is set
  if (supabaseAdmin && serviceKey) {
    const { data, error } = await supabaseAdmin
      .from("payments")
      .update({
        status: "paid",
        gateway_transaction_id: gatewayId,
        paid_at: paidAt,
        payment_method: channel,
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_reference", reference)
      .select("*")
      .maybeSingle();

    if (!error && data) return data;
  }

  // Attempt 2: Via confirm_payment_paid RPC function
  try {
    const { data, error } = await supabase.rpc("confirm_payment_paid", {
      p_reference: reference,
      p_gateway_id: gatewayId,
      p_paid_at: paidAt,
      p_channel: channel,
    });
    if (!error && data && data.id) return data;
  } catch (err) {
    console.warn("RPC confirm_payment_paid invocation error:", err);
  }

  return null;
}

// Database helper: Mark payment status
async function markPaymentStatus(env: any, reference: string, status: string, gatewayId: string) {
  const { supabase, supabaseAdmin } = getSupabase(env);
  if (!supabase) return;

  const validStatuses = ["pending", "processing", "paid", "failed", "cancelled", "refunded"];
  const safeStatus = validStatuses.includes(status) ? status : "failed";
  const serviceKey = getEnv(env, "SUPABASE_SERVICE_ROLE_KEY") || getEnv(env, "SUPABASE_SERVICE_KEY");

  if (supabaseAdmin && serviceKey) {
    await supabaseAdmin
      .from("payments")
      .update({
        status: safeStatus,
        gateway_transaction_id: gatewayId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_reference", reference);
    return;
  }

  try {
    await supabase.rpc("mark_payment_failed", {
      p_reference: reference,
      p_status: safeStatus,
      p_gateway_id: gatewayId || null,
    });
  } catch (err) {
    console.warn("RPC mark_payment_failed error:", err);
  }
}

// Main Cloudflare Worker fetch dispatcher
export async function handleRequest(request: Request, env: any, ctx?: any): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;

  // 1. CORS Preflight
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-paystack-signature",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // 2. GET /api/health
  if (method === "GET" && pathname === "/api/health") {
    const paystackSecret = getEnv(env, "PAYSTACK_SECRET_KEY");
    const r2 = getR2Client(env);
    return jsonResponse({
      status: "ok",
      message: "Cloudflare Worker running",
      runtime: "cloudflare-workers",
      r2_configured: !!r2,
      paystack_configured: !!paystackSecret,
      paystack_mode: paystackSecret.startsWith("sk_test_")
        ? "test"
        : paystackSecret.startsWith("sk_live_")
        ? "live"
        : "unconfigured",
    });
  }

  // 3. GET /api/payments/config
  if (method === "GET" && pathname === "/api/payments/config") {
    const paystackSecret = getEnv(env, "PAYSTACK_SECRET_KEY");
    return jsonResponse({
      configured: !!paystackSecret,
      test_mode: paystackSecret.startsWith("sk_test_"),
      currency: "NGN",
      gateway: "paystack",
    });
  }

  // 4. POST /api/payments/initialize
  if (method === "POST" && pathname === "/api/payments/initialize") {
    try {
      const body = await request.json() as any;
      const {
        customer_name,
        customer_email,
        customer_phone,
        service_name,
        package_name,
        package_id,
        amount,
        currency = "NGN",
        description,
      } = body;

      // Validate customer name
      if (!customer_name || typeof customer_name !== "string" || customer_name.trim().length < 2) {
        return jsonResponse({ success: false, error: "A valid customer name is required (at least 2 characters)." }, 400);
      }

      // Validate customer email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!customer_email || typeof customer_email !== "string" || !emailRegex.test(customer_email.trim())) {
        return jsonResponse({ success: false, error: "A valid email address is required." }, 400);
      }

      let authoritativeAmount: number = Number(amount);
      let authoritativeCurrency: string = typeof currency === "string" && currency.trim() ? currency.trim().toUpperCase() : "NGN";
      let resolvedServiceName: string = typeof service_name === "string" ? service_name.trim() : "";
      let resolvedPackageName: string = typeof package_name === "string" ? package_name.trim() : "";

      const { supabase, supabaseAdmin } = getSupabase(env);

      // Obtain authoritative package price from database where possible
      if (supabase) {
        try {
          let pkgQuery = supabase.from("pricing_packages").select("*");
          if (package_id && typeof package_id === "string" && package_id.trim()) {
            pkgQuery = pkgQuery.eq("id", package_id.trim());
          } else if (resolvedPackageName) {
            pkgQuery = pkgQuery.ilike("name", resolvedPackageName);
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
                const cleanedCurrency = String(dbPkg.currency).replace(/[^a-zA-Z]/g, "").trim().toUpperCase();
                if (cleanedCurrency.length === 3) {
                  authoritativeCurrency = cleanedCurrency;
                }
              }
            } else {
              return jsonResponse({
                success: false,
                error: `The package "${dbPkg.name}" requires a custom quotation. Please request a quote before initiating payment.`,
              }, 400);
            }
          }
        } catch (err) {
          console.warn("Could not query pricing_packages for authoritative price, using validated input:", err);
        }
      }

      // Validate amount
      if (!authoritativeAmount || isNaN(authoritativeAmount) || authoritativeAmount <= 0) {
        return jsonResponse({ success: false, error: "A valid positive payment amount is required." }, 400);
      }

      // Generate unique transaction reference
      const timestamp = Date.now();
      const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
      const transactionReference = `IOE-PAY-${timestamp}-${randomHex}`;

      // Record payment in database with 'pending' status
      if (supabase) {
        const paymentRecord = {
          customer_name: customer_name.trim(),
          customer_email: customer_email.trim().toLowerCase(),
          customer_phone: customer_phone && typeof customer_phone === "string" ? customer_phone.trim() : null,
          service_name: resolvedServiceName || null,
          package_name: resolvedPackageName || null,
          amount: authoritativeAmount,
          currency: authoritativeCurrency,
          payment_method: "card",
          gateway: "paystack",
          transaction_reference: transactionReference,
          status: "pending",
          description: description || `Payment for ${resolvedPackageName || resolvedServiceName || "IOE Creative Service"}`,
          metadata: {
            package_id: package_id || null,
            package_name: resolvedPackageName || null,
            service_name: resolvedServiceName || null,
            customer_name: customer_name.trim(),
            customer_email: customer_email.trim().toLowerCase(),
          },
        };

        const targetDb = supabaseAdmin || supabase;
        const { error: insertError } = await targetDb.from("payments").insert([paymentRecord]);
        if (insertError) {
          console.error("Error inserting pending payment into Supabase:", insertError);
          return jsonResponse({
            success: false,
            error: "Failed to record initial payment order. Please ensure database permissions are configured.",
          }, 500);
        }
      }

      // Verify Paystack Secret Key
      const paystackSecret = getEnv(env, "PAYSTACK_SECRET_KEY");
      if (!paystackSecret) {
        return jsonResponse({
          success: false,
          code: "PAYSTACK_NOT_CONFIGURED",
          error: "Paystack payment gateway is not configured on the server. Please set PAYSTACK_SECRET_KEY.",
          reference: transactionReference,
        }, 503);
      }

      // Amount in subunits (kobo)
      const amountInSubunits = Math.round(authoritativeAmount * 100);

      // Resolve callback URL
      const origin = request.headers.get("origin") || url.origin;
      const callbackUrl = `${origin}/payment/callback`;

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
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: customer_name.trim(),
            },
            {
              display_name: "Service / Package",
              variable_name: "service_package",
              value: `${resolvedServiceName} ${resolvedPackageName}`.trim() || "Creative Studio Service",
            },
            {
              display_name: "Transaction Ref",
              variable_name: "transaction_reference",
              value: transactionReference,
            },
          ],
        },
      };

      const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paystackPayload),
      });

      const paystackData = await paystackRes.json() as any;

      if (!paystackRes.ok || !paystackData.status || !paystackData.data?.authorization_url) {
        console.error("Paystack initialization response error:", paystackData);
        return jsonResponse({
          success: false,
          error: paystackData.message || "Failed to initialize payment session with Paystack.",
        }, 400);
      }

      return jsonResponse({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: transactionReference,
      });
    } catch (error: any) {
      console.error("Unexpected error in /api/payments/initialize:", error);
      return jsonResponse({
        success: false,
        error: "An unexpected error occurred while preparing your payment.",
      }, 500);
    }
  }

  // 5. POST /api/payments/verify
  if (method === "POST" && pathname === "/api/payments/verify") {
    try {
      const body = await request.json() as any;
      const { reference } = body;

      if (!reference || typeof reference !== "string" || !reference.trim()) {
        return jsonResponse({ success: false, error: "Transaction reference is required for verification." }, 400);
      }

      const cleanReference = reference.trim();
      const { supabase, supabaseAdmin } = getSupabase(env);
      const serviceKey = getEnv(env, "SUPABASE_SERVICE_ROLE_KEY") || getEnv(env, "SUPABASE_SERVICE_KEY");

      let localPayment: any = null;

      if (supabase) {
        if (supabaseAdmin && serviceKey) {
          const { data, error } = await supabaseAdmin
            .from("payments")
            .select("*")
            .eq("transaction_reference", cleanReference)
            .maybeSingle();

          if (!error && data) {
            localPayment = data;
          }
        }

        if (!localPayment) {
          try {
            const { data, error } = await supabase
              .rpc("get_payment_for_verification", { p_reference: cleanReference });
            if (!error && data && data.id) {
              localPayment = data;
            }
          } catch (rpcErr) {
            // RPC fallback
          }
        }
      }

      // Idempotency: If already marked as paid AND has gateway_transaction_id saved, return immediately
      if (
        localPayment &&
        localPayment.status === "paid" &&
        localPayment.gateway_transaction_id &&
        localPayment.gateway_transaction_id !== "Pending Gateway Sync"
      ) {
        return jsonResponse({
          success: true,
          already_verified: true,
          message: "Payment has already been confirmed and synchronized with gateway.",
          payment: localPayment,
        });
      }

      // Paystack Secret Key check
      const paystackSecret = getEnv(env, "PAYSTACK_SECRET_KEY");
      if (!paystackSecret) {
        return jsonResponse({
          success: false,
          code: "PAYSTACK_NOT_CONFIGURED",
          error: "Paystack secret key is not configured on the server. Unable to verify transaction.",
        }, 503);
      }

      // Verify directly with Paystack API from server
      const paystackVerifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(cleanReference)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            "Content-Type": "application/json",
          },
        }
      );

      const paystackData = await paystackVerifyRes.json() as any;

      if (!paystackVerifyRes.ok || !paystackData.status || !paystackData.data) {
        console.error("Paystack verification response failed:", paystackData);
        return jsonResponse({
          success: false,
          error: paystackData.message || "Payment verification failed with the payment provider.",
        }, 400);
      }

      const trx = paystackData.data;
      const gatewayId = String(trx.id || "");
      const channel = trx.channel || localPayment?.payment_method || "card";
      const paidAt = trx.paid_at || localPayment?.paid_at || new Date().toISOString();

      // Case: Payment was already marked 'paid' locally (e.g. historical payment or manual confirmation)
      // Synchronize gateway_transaction_id without altering historical status or amount
      if (localPayment && localPayment.status === "paid") {
        const updatedPayment = await markPaymentPaid(env, cleanReference, gatewayId, paidAt, channel);
        return jsonResponse({
          success: true,
          already_verified: true,
          message: "Payment verified and Gateway Transaction ID synchronized successfully.",
          payment: updatedPayment || {
            ...localPayment,
            gateway_transaction_id: gatewayId,
            payment_method: channel,
            status: "paid",
          },
        });
      }

      // Case: Genuine successful payment from gateway
      if (trx.status === "success") {
        // Amount verification
        if (localPayment && localPayment.amount) {
          const expectedKobo = Math.round(Number(localPayment.amount) * 100);
          if (trx.amount < expectedKobo) {
            console.error(`Amount mismatch for ${cleanReference}: expected ${expectedKobo}, got ${trx.amount}`);
            await markPaymentStatus(env, cleanReference, "failed", gatewayId);
            return jsonResponse({
              success: false,
              error: "The amount paid does not match the invoice amount.",
            }, 400);
          }
        }

        // Currency verification
        if (localPayment && localPayment.currency && trx.currency) {
          if (localPayment.currency.toUpperCase() !== trx.currency.toUpperCase()) {
            console.error(`Currency mismatch for ${cleanReference}: expected ${localPayment.currency}, got ${trx.currency}`);
            await markPaymentStatus(env, cleanReference, "failed", gatewayId);
            return jsonResponse({
              success: false,
              error: "Payment currency does not match invoice currency.",
            }, 400);
          }
        }

        // Update local record to 'paid' with actual gateway_transaction_id
        const updatedPayment = await markPaymentPaid(env, cleanReference, gatewayId, paidAt, channel);

        return jsonResponse({
          success: true,
          message: "Payment verified and confirmed successfully.",
          payment: updatedPayment || {
            transaction_reference: cleanReference,
            status: "paid",
            amount: trx.amount / 100,
            currency: trx.currency || "NGN",
            paid_at: paidAt,
            gateway_transaction_id: gatewayId,
            payment_method: channel,
            customer_name: localPayment?.customer_name || trx.customer?.first_name || "Customer",
            customer_email: localPayment?.customer_email || trx.customer?.email,
            package_name: localPayment?.package_name,
            service_name: localPayment?.service_name,
          },
        });
      }

      // Case: In-progress transactions (e.g. 'ongoing', 'pending', 'processing')
      if (trx.status === "ongoing" || trx.status === "pending" || trx.status === "processing") {
        await markPaymentStatus(env, cleanReference, "processing", gatewayId);
        return jsonResponse({
          success: false,
          status: "processing",
          gateway_status: trx.status,
          gateway_transaction_id: gatewayId,
          message: `Payment is currently in progress (${trx.gateway_response || trx.status}). Please complete your transaction.`,
          payment: {
            ...(localPayment || {}),
            transaction_reference: cleanReference,
            status: "processing",
            gateway_transaction_id: gatewayId,
            payment_method: channel,
          },
        }, 200);
      }

      // Case: Failed or abandoned transactions
      const mappedStatus = trx.status === "abandoned" ? "cancelled" : "failed";
      await markPaymentStatus(env, cleanReference, mappedStatus, gatewayId);
      return jsonResponse({
        success: false,
        status: mappedStatus,
        gateway_status: trx.status,
        gateway_transaction_id: gatewayId,
        error: `Payment was not completed. Gateway status: ${trx.gateway_response || trx.status || "Transaction incomplete"}`,
      }, 400);
    } catch (error: any) {
      console.error("Unexpected error in /api/payments/verify:", error);
      return jsonResponse({
        success: false,
        error: "An unexpected server error occurred during payment verification.",
      }, 500);
    }
  }

  // 6. POST /api/payments/webhook
  if (method === "POST" && pathname === "/api/payments/webhook") {
    try {
      const paystackSecret = getEnv(env, "PAYSTACK_SECRET_KEY");
      if (!paystackSecret) {
        console.error("PAYSTACK_SECRET_KEY is not configured on the server for webhook verification");
        return jsonResponse({ error: "Paystack secret key is not configured" }, 500);
      }

      const signature = request.headers.get("x-paystack-signature");
      if (!signature) {
        console.warn("Paystack webhook received with missing x-paystack-signature header");
        return jsonResponse({ error: "Missing x-paystack-signature header" }, 401);
      }

      const rawBody = await request.text();
      const expectedSignature = crypto
        .createHmac("sha512", paystackSecret)
        .update(rawBody)
        .digest("hex");

      let signatureValid = false;
      try {
        const sigBuf = Buffer.from(signature, "hex");
        const expBuf = Buffer.from(expectedSignature, "hex");
        signatureValid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
      } catch {
        signatureValid = signature === expectedSignature;
      }

      if (!signatureValid) {
        console.warn("Paystack webhook received with invalid signature");
        return jsonResponse({ error: "Invalid webhook signature" }, 401);
      }

      let event: any = null;
      try {
        event = JSON.parse(rawBody);
      } catch {
        return jsonResponse({ error: "Invalid webhook payload" }, 400);
      }

      if (event && event.event === "charge.success") {
        const reference = event.data?.reference;
        if (!reference || typeof reference !== "string") {
          return jsonResponse({ error: "Missing transaction reference in event payload" }, 400);
        }

        const cleanReference = reference.trim();
        const { supabase, supabaseAdmin } = getSupabase(env);
        const serviceKey = getEnv(env, "SUPABASE_SERVICE_ROLE_KEY") || getEnv(env, "SUPABASE_SERVICE_KEY");

        let localPayment: any = null;
        if (supabase) {
          if (supabaseAdmin && serviceKey) {
            const { data, error } = await supabaseAdmin
              .from("payments")
              .select("*")
              .eq("transaction_reference", cleanReference)
              .maybeSingle();

            if (!error && data) {
              localPayment = data;
            }
          }

          if (!localPayment) {
            try {
              const { data, error } = await supabase
                .rpc("get_payment_for_verification", { p_reference: cleanReference });
              if (!error && data && data.id) {
                localPayment = data;
              }
            } catch (rpcErr) {
              // RPC fallback
            }
          }
        }

        // Idempotency: If already marked as paid AND has gateway_transaction_id, return immediately
        if (
          localPayment &&
          localPayment.status === "paid" &&
          localPayment.gateway_transaction_id &&
          localPayment.gateway_transaction_id !== "Pending Gateway Sync"
        ) {
          return jsonResponse({
            status: "success",
            idempotent: true,
            message: "Payment already processed and gateway transaction ID synchronized.",
          });
        }

        // Verify transaction server-side with Paystack API
        const paystackVerifyRes = await fetch(
          `https://api.paystack.co/transaction/verify/${encodeURIComponent(cleanReference)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${paystackSecret}`,
              "Content-Type": "application/json",
            },
          }
        );

        const paystackData = await paystackVerifyRes.json() as any;

        if (!paystackVerifyRes.ok || !paystackData.status || !paystackData.data) {
          console.error("Paystack webhook verification failed with Paystack API:", paystackData);
          return jsonResponse({
            status: "error",
            message: paystackData.message || "Payment verification failed with provider.",
          }, 400);
        }

        const trx = paystackData.data;
        const gatewayId = String(trx.id || "");
        const channel = trx.channel || localPayment?.payment_method || "card";
        const paidAt = trx.paid_at || localPayment?.paid_at || new Date().toISOString();

        if (trx.status !== "success") {
          const mappedStatus =
            trx.status === "ongoing" || trx.status === "processing"
              ? "processing"
              : trx.status === "abandoned"
              ? "cancelled"
              : "failed";
          await markPaymentStatus(env, cleanReference, mappedStatus, gatewayId);
          return jsonResponse({
            status: "handled",
            message: `Transaction verified with status: ${trx.status}`,
          });
        }

        // Amount integrity check
        if (localPayment && localPayment.amount) {
          const expectedKobo = Math.round(Number(localPayment.amount) * 100);
          if (trx.amount < expectedKobo) {
            console.error(`Amount mismatch in webhook for ${cleanReference}: expected ${expectedKobo}, got ${trx.amount}`);
            await markPaymentStatus(env, cleanReference, "failed", gatewayId);
            return jsonResponse({ status: "error", message: "Amount mismatch" }, 400);
          }
        }

        // Currency integrity check
        if (localPayment && localPayment.currency && trx.currency) {
          if (localPayment.currency.toUpperCase() !== trx.currency.toUpperCase()) {
            console.error(`Currency mismatch in webhook for ${cleanReference}: expected ${localPayment.currency}, got ${trx.currency}`);
            await markPaymentStatus(env, cleanReference, "failed", gatewayId);
            return jsonResponse({ status: "error", message: "Currency mismatch" }, 400);
          }
        }

        // Update existing database record in public.payments to 'paid' with actual gateway_transaction_id
        const updatedPayment = await markPaymentPaid(env, cleanReference, gatewayId, paidAt, channel);

        // If no local record existed yet, create one
        if (!updatedPayment && !localPayment && supabase) {
          const targetDb = supabaseAdmin || supabase;
          const newRecord = {
            customer_name: trx.customer?.first_name || trx.metadata?.customer_name || "Customer",
            customer_email: (trx.customer?.email || trx.metadata?.customer_email || "customer@example.com").toLowerCase(),
            customer_phone: trx.customer?.phone || trx.metadata?.customer_phone || null,
            service_name: trx.metadata?.service_name || null,
            package_name: trx.metadata?.package_name || null,
            amount: trx.amount ? trx.amount / 100 : 0,
            currency: trx.currency || "NGN",
            payment_method: channel,
            gateway: "paystack",
            transaction_reference: cleanReference,
            gateway_transaction_id: gatewayId,
            status: "paid",
            paid_at: paidAt,
            description: `Paystack payment for ${trx.metadata?.package_name || trx.metadata?.service_name || "IOE Creative Service"}`,
            metadata: trx.metadata || {},
          };
          await targetDb.from("payments").insert([newRecord]);
        }

        return jsonResponse({
          status: "success",
          message: "Payment confirmed and updated successfully via webhook.",
        });
      }

      // Acknowledge receipt for all other events
      return jsonResponse({
        status: "ignored",
        message: `Event '${event?.event}' acknowledged.`,
      });
    } catch (error: any) {
      console.error("Unexpected error in /api/payments/webhook:", error);
      return jsonResponse({ error: "Internal server error processing webhook" }, 500);
    }
  }

  // 7. POST /api/upload-url (Requires Admin)
  if (method === "POST" && pathname === "/api/upload-url") {
    const authCheck = await verifyAdmin(request, env);
    if (!authCheck.authorized) {
      return authCheck.errorResponse!;
    }

    const r2 = getR2Client(env);
    if (!r2) {
      return jsonResponse({ error: "R2 storage is not configured on the server" }, 503);
    }

    try {
      const body = await request.json() as any;
      const { filename, contentType } = body;

      if (!filename || !contentType) {
        return jsonResponse({ error: "Filename and contentType are required" }, 400);
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "video/mp4", "video/webm"];
      if (!allowedTypes.includes(contentType)) {
        return jsonResponse({ error: "Invalid file type. Allowed: JPG, PNG, WebP, SVG, MP4, WebM." }, 400);
      }

      const command = new PutObjectCommand({
        Bucket: r2.bucketName,
        Key: filename,
        ContentType: contentType,
      });

      const urlSigned = await getSignedUrl(r2.s3Client, command, { expiresIn: 300 });

      return jsonResponse({
        uploadUrl: urlSigned,
        key: filename,
        publicUrl: `${r2.publicUrl.replace(/\/$/, "")}/${filename}`,
      });
    } catch (error: any) {
      console.error("Error generating presigned URL:", error);
      return jsonResponse({ error: "Failed to generate upload URL: " + (error.message || "Unknown error") }, 500);
    }
  }

  // 8. POST /api/delete-media (Requires Admin)
  if (method === "POST" && pathname === "/api/delete-media") {
    const authCheck = await verifyAdmin(request, env);
    if (!authCheck.authorized) {
      return authCheck.errorResponse!;
    }

    const r2 = getR2Client(env);
    if (!r2) {
      return jsonResponse({ error: "R2 storage is not configured on the server" }, 503);
    }

    try {
      const body = await request.json() as any;
      const { key } = body;

      if (!key) {
        return jsonResponse({ error: "Object key is required" }, 400);
      }

      const command = new DeleteObjectCommand({
        Bucket: r2.bucketName,
        Key: key,
      });

      await r2.s3Client.send(command);
      return jsonResponse({ success: true });
    } catch (error: any) {
      console.error("Error deleting media from R2:", error);
      return jsonResponse({ error: "Failed to delete media: " + (error.message || "Unknown error") }, 500);
    }
  }

  // 9. Static Asset Serving in Cloudflare Workers (Edge SPA routing)
  // If request is not an API route and env.ASSETS is bound (Cloudflare Workers Static Assets)
  if (env && env.ASSETS && typeof env.ASSETS.fetch === "function") {
    try {
      const response = await env.ASSETS.fetch(request);
      // If asset is not found directly and this is an HTML navigation request, serve SPA index.html
      if (response.status === 404 && method === "GET") {
        const urlObj = new URL(request.url);
        urlObj.pathname = "/index.html";
        return await env.ASSETS.fetch(new Request(urlObj.toString(), {
          headers: request.headers,
          method: "GET",
        }));
      }
      return response;
    } catch (assetError) {
      console.error("Cloudflare Worker assets fetch error:", assetError);
      try {
        const urlObj = new URL(request.url);
        urlObj.pathname = "/index.html";
        return await env.ASSETS.fetch(new Request(urlObj.toString(), { method: "GET" }));
      } catch (fallbackError) {
        return new Response("Static asset serving error", { status: 500 });
      }
    }
  }

  // 10. Fallback 404 for unknown endpoints
  return new Response("Not Found", { status: 404 });
}

// Default export conforming to Cloudflare Workers module syntax
export default {
  fetch(request: Request, env: any, ctx?: any): Promise<Response> {
    return handleRequest(request, env, ctx);
  },
};
