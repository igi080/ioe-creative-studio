/**
 * IOE Creative Studio - Conversion Tracking & Analytics Utility
 * 
 * Supports:
 * - Meta Pixel (Facebook / Instagram Ads) via VITE_META_PIXEL_ID
 * - Google Analytics 4 (Google Tag / Ads) via VITE_GA_MEASUREMENT_ID
 * - First-party UTM Campaign & Referrer Attribution
 * - Idempotent deduplication to prevent duplicate conversion records
 * - Graceful degradation (never breaks UX or checkout if IDs are omitted)
 */

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export type AnalyticsEventName =
  | 'page_view'
  | 'quote_started'
  | 'generate_lead'
  | 'whatsapp_click'
  | 'phone_click'
  | 'email_click'
  | 'service_view'
  | 'pricing_view'
  | 'cta_click'
  | 'agreement_view'
  | 'payment_started'
  | 'purchase';

export interface AnalyticsEventParams {
  content_name?: string;
  content_category?: string;
  service?: string;
  package?: string;
  value?: number;
  currency?: string;
  page?: string;
  location?: string;
  transaction_id?: string;
  eventId?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  [key: string]: any;
}

export interface UtmAttribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_page?: string;
  referrer?: string;
  captured_at?: string;
}

// In-memory set of executed conversion IDs for deduplication
const firedEventIds = new Set<string>();

const UTM_STORAGE_KEY = 'ioe_utm_attribution';
const DEDUP_STORAGE_KEY = 'ioe_analytics_dedup_events';

let isInitialized = false;

/**
 * Safe local/session storage getter and setter
 */
function getStorageItem(key: string, useSession = true): string | null {
  try {
    const storage = useSession ? window.sessionStorage : window.localStorage;
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string, useSession = true): void {
  try {
    const storage = useSession ? window.sessionStorage : window.localStorage;
    storage.setItem(key, value);
  } catch {
    // Ignore storage quota or iframe sandbox errors
  }
}

/**
 * Capture and persist UTM parameters and referrer from the current URL
 */
export function captureUtmParameters(): UtmAttribution {
  if (typeof window === 'undefined') return {};

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');
    const utmContent = searchParams.get('utm_content');
    const utmTerm = searchParams.get('utm_term');

    // Load existing stored attribution if present
    const existingRaw = getStorageItem(UTM_STORAGE_KEY, true) || getStorageItem(UTM_STORAGE_KEY, false);
    let attribution: UtmAttribution = {};

    if (existingRaw) {
      try {
        attribution = JSON.parse(existingRaw);
      } catch {
        attribution = {};
      }
    }

    // If new UTM parameters are present in URL, update attribution
    if (utmSource || utmMedium || utmCampaign || utmContent || utmTerm) {
      attribution = {
        ...attribution,
        ...(utmSource ? { utm_source: utmSource } : {}),
        ...(utmMedium ? { utm_medium: utmMedium } : {}),
        ...(utmCampaign ? { utm_campaign: utmCampaign } : {}),
        ...(utmContent ? { utm_content: utmContent } : {}),
        ...(utmTerm ? { utm_term: utmTerm } : {}),
        landing_page: window.location.pathname,
        referrer: document.referrer || attribution.referrer || 'direct',
        captured_at: new Date().toISOString()
      };

      const serialized = JSON.stringify(attribution);
      setStorageItem(UTM_STORAGE_KEY, serialized, true);
      setStorageItem(UTM_STORAGE_KEY, serialized, false);
    } else if (!attribution.landing_page) {
      // First visit without UTM tags: record initial landing page & referrer
      attribution = {
        ...attribution,
        landing_page: window.location.pathname,
        referrer: document.referrer || 'direct',
        captured_at: new Date().toISOString()
      };
      const serialized = JSON.stringify(attribution);
      setStorageItem(UTM_STORAGE_KEY, serialized, true);
    }

    return attribution;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[IOE Analytics] Failed to capture UTM parameters:', err);
    }
    return {};
  }
}

/**
 * Retrieve current captured UTM attribution for quotes and inquiries
 */
export function getUtmAttribution(): UtmAttribution {
  if (typeof window === 'undefined') return {};
  try {
    const raw = getStorageItem(UTM_STORAGE_KEY, true) || getStorageItem(UTM_STORAGE_KEY, false);
    if (!raw) return captureUtmParameters();
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Format UTM attribution into a readable string for quote requests
 */
export function formatAttributionForSubmission(attribution?: UtmAttribution): string {
  const attr = attribution || getUtmAttribution();
  const parts: string[] = [];

  if (attr.utm_source) parts.push(`Source: ${attr.utm_source}`);
  if (attr.utm_medium) parts.push(`Medium: ${attr.utm_medium}`);
  if (attr.utm_campaign) parts.push(`Campaign: ${attr.utm_campaign}`);
  if (attr.utm_content) parts.push(`Content: ${attr.utm_content}`);
  if (attr.utm_term) parts.push(`Term: ${attr.utm_term}`);
  if (attr.landing_page) parts.push(`Landing Page: ${attr.landing_page}`);
  if (attr.referrer && attr.referrer !== 'direct') parts.push(`Referrer: ${attr.referrer}`);

  if (parts.length === 0) return '';
  return `[Campaign Attribution]\n${parts.join('\n')}`;
}

/**
 * Parse attribution from an existing string
 */
export function parseAttributionFromText(text?: string | null): UtmAttribution | null {
  if (!text || !text.includes('[Campaign Attribution]')) return null;

  try {
    const section = text.split('[Campaign Attribution]')[1];
    if (!section) return null;

    const lines = section.split('\n');
    const result: UtmAttribution = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) continue;

      const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
      const val = trimmed.slice(colonIdx + 1).trim();

      if (key === 'source') result.utm_source = val;
      else if (key === 'medium') result.utm_medium = val;
      else if (key === 'campaign') result.utm_campaign = val;
      else if (key === 'content') result.utm_content = val;
      else if (key === 'term') result.utm_term = val;
      else if (key === 'landing page') result.landing_page = val;
      else if (key === 'referrer') result.referrer = val;
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

/**
 * Deduplication helper
 */
function hasEventFired(key: string): boolean {
  if (firedEventIds.has(key)) return true;
  try {
    const raw = getStorageItem(DEDUP_STORAGE_KEY, true);
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      if (ids.includes(key)) {
        firedEventIds.add(key);
        return true;
      }
    }
  } catch {
    // Ignore storage issues
  }
  return false;
}

function markEventFired(key: string): void {
  firedEventIds.add(key);
  try {
    const raw = getStorageItem(DEDUP_STORAGE_KEY, true);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(key)) {
      ids.push(key);
      setStorageItem(DEDUP_STORAGE_KEY, JSON.stringify(ids.slice(-50)), true);
    }
  } catch {
    // Ignore storage issues
  }
}

/**
 * Initialize Meta Pixel script dynamically if VITE_META_PIXEL_ID is present
 */
function initMetaPixel(pixelId: string): void {
  if (typeof window === 'undefined' || window.fbq) return;

  try {
    /* eslint-disable */
    const f: any = (window as any).fbq = function () {
      f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments);
    };
    if (!(window as any)._fbq) (window as any)._fbq = f;
    f.push = f;
    f.loaded = true;
    f.version = '2.0';
    f.queue = [];

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);
    /* eslint-enable */

    window.fbq?.('init', pixelId);
    if (import.meta.env.DEV) {
      console.log(`[IOE Analytics] Meta Pixel initialized with ID: ${pixelId}`);
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[IOE Analytics] Meta Pixel initialization failed:', err);
    }
  }
}

/**
 * Initialize Google Analytics 4 dynamically if VITE_GA_MEASUREMENT_ID is present
 */
function initGoogleAnalytics(measurementId: string): void {
  if (typeof window === 'undefined' || window.gtag) return;

  try {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript?.parentNode?.insertBefore(script, firstScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer?.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false // We handle page views via router
    });

    if (import.meta.env.DEV) {
      console.log(`[IOE Analytics] Google Analytics 4 initialized with ID: ${measurementId}`);
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[IOE Analytics] GA4 initialization failed:', err);
    }
  }
}

/**
 * Primary Analytics Initialization
 * Called once during application start.
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  try {
    // 1. Capture UTM attribution
    captureUtmParameters();

    // 2. Meta Pixel
    const metaPixelId = (import.meta.env.VITE_META_PIXEL_ID || '').trim();
    if (metaPixelId) {
      initMetaPixel(metaPixelId);
    }

    // 3. Google Analytics 4
    const gaMeasurementId = (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
    if (gaMeasurementId) {
      initGoogleAnalytics(gaMeasurementId);
    }

    if (import.meta.env.DEV) {
      console.log('[IOE Analytics] Initialized. Active destinations:', {
        metaPixel: !!metaPixelId,
        googleAnalytics: !!gaMeasurementId
      });
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[IOE Analytics] Init error:', err);
    }
  }
}

/**
 * Core event tracking engine
 */
export function trackEvent(eventName: AnalyticsEventName, parameters: AnalyticsEventParams = {}): void {
  if (typeof window === 'undefined') return;

  try {
    // Merge attribution into event parameters for richer downstream reporting
    const attribution = getUtmAttribution();
    const enrichedParams: AnalyticsEventParams = {
      ...parameters,
      ...(attribution.utm_source ? { utm_source: attribution.utm_source } : {}),
      ...(attribution.utm_medium ? { utm_medium: attribution.utm_medium } : {}),
      ...(attribution.utm_campaign ? { utm_campaign: attribution.utm_campaign } : {}),
      page: parameters.page || window.location.pathname
    };

    // 1. Debug logging in development mode only
    if (import.meta.env.DEV) {
      console.log(`%c[IOE Analytics] ${eventName}`, 'color: #0d9488; font-weight: bold;', enrichedParams);
    }

    // 2. Dispatch to Meta Pixel (fbq)
    if (typeof window.fbq === 'function') {
      try {
        switch (eventName) {
          case 'page_view':
            window.fbq('track', 'PageView');
            break;

          case 'quote_started':
            window.fbq('trackCustom', 'QuoteStarted', {
              service: enrichedParams.service || 'General Inquiry',
              page: enrichedParams.page
            });
            break;

          case 'generate_lead':
            window.fbq('track', 'Lead', {
              content_name: enrichedParams.service || 'Quote Request',
              content_category: enrichedParams.content_category || 'Creative Studio',
              value: enrichedParams.value || 0,
              currency: enrichedParams.currency || 'NGN'
            });
            break;

          case 'whatsapp_click':
            window.fbq('track', 'Contact', {
              channel: 'whatsapp',
              page: enrichedParams.page,
              location: enrichedParams.location || 'floating_button'
            });
            break;

          case 'phone_click':
            window.fbq('track', 'Contact', {
              channel: 'phone',
              page: enrichedParams.page,
              location: enrichedParams.location
            });
            break;

          case 'email_click':
            window.fbq('track', 'Contact', {
              channel: 'email',
              page: enrichedParams.page,
              location: enrichedParams.location
            });
            break;

          case 'service_view':
          case 'pricing_view':
          case 'agreement_view':
            window.fbq('track', 'ViewContent', {
              content_name: enrichedParams.content_name || eventName,
              content_category: enrichedParams.content_category || 'Services'
            });
            break;

          case 'payment_started':
            window.fbq('track', 'InitiateCheckout', {
              content_name: enrichedParams.package || enrichedParams.content_name || 'Design Package',
              value: enrichedParams.value || 0,
              currency: enrichedParams.currency || 'NGN'
            });
            break;

          case 'purchase':
            window.fbq('track', 'Purchase', {
              content_name: enrichedParams.package || enrichedParams.content_name || 'Design Package',
              value: enrichedParams.value || 0,
              currency: enrichedParams.currency || 'NGN'
            });
            break;

          case 'cta_click':
          default:
            window.fbq('trackCustom', eventName, enrichedParams);
            break;
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[IOE Analytics] Meta Pixel dispatch error:', err);
      }
    }

    // 3. Dispatch to Google Analytics 4 (gtag)
    if (typeof window.gtag === 'function') {
      try {
        switch (eventName) {
          case 'page_view':
            window.gtag('event', 'page_view', {
              page_path: enrichedParams.page,
              page_title: document.title
            });
            break;

          case 'quote_started':
            window.gtag('event', 'quote_started', {
              service: enrichedParams.service,
              page_path: enrichedParams.page
            });
            break;

          case 'generate_lead':
            window.gtag('event', 'generate_lead', {
              currency: enrichedParams.currency || 'NGN',
              value: enrichedParams.value || 0,
              service: enrichedParams.service,
              package: enrichedParams.package,
              source: enrichedParams.source || enrichedParams.utm_source
            });
            break;

          case 'whatsapp_click':
            window.gtag('event', 'whatsapp_click', {
              page_location: enrichedParams.page,
              button_location: enrichedParams.location || 'button'
            });
            break;

          case 'phone_click':
            window.gtag('event', 'phone_click', {
              page_location: enrichedParams.page,
              button_location: enrichedParams.location
            });
            break;

          case 'email_click':
            window.gtag('event', 'email_click', {
              page_location: enrichedParams.page,
              button_location: enrichedParams.location
            });
            break;

          case 'service_view':
            window.gtag('event', 'service_view', {
              service_name: enrichedParams.content_name || enrichedParams.service
            });
            break;

          case 'pricing_view':
            window.gtag('event', 'pricing_view', {
              package_name: enrichedParams.content_name || enrichedParams.package
            });
            break;

          case 'payment_started':
            window.gtag('event', 'begin_checkout', {
              currency: enrichedParams.currency || 'NGN',
              value: enrichedParams.value || 0,
              items: [{ item_name: enrichedParams.package || 'Studio Package' }]
            });
            break;

          case 'purchase':
            window.gtag('event', 'purchase', {
              transaction_id: enrichedParams.transaction_id,
              value: enrichedParams.value || 0,
              currency: enrichedParams.currency || 'NGN',
              items: [{ item_name: enrichedParams.package || 'Studio Package' }]
            });
            break;

          default:
            window.gtag('event', eventName, enrichedParams);
            break;
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[IOE Analytics] GA4 dispatch error:', err);
      }
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn('[IOE Analytics] Error handling event:', eventName, err);
    }
  }
}

/* ==============================================================================
   CONVENIENCE EVENT WRAPPERS
   ============================================================================== */

/**
 * Track Request Quote form opened or initiated
 * Deduplicated per session so it only fires once per visit to the quote request form.
 */
export function trackQuoteStarted(params?: AnalyticsEventParams): void {
  const dedupKey = 'quote_started_session';
  if (hasEventFired(dedupKey)) return;
  markEventFired(dedupKey);

  trackEvent('quote_started', {
    page: '/request-quote',
    ...params
  });
}

/**
 * Track successful Request Quote submission
 * Deduplicated with optional quote ID or timestamp so re-renders cannot re-fire.
 */
export function trackQuoteSubmitted(params?: AnalyticsEventParams): void {
  const id = params?.eventId || params?.quote_id || `quote_${Date.now()}`;
  const dedupKey = `quote_submitted_${id}`;
  if (hasEventFired(dedupKey)) return;
  markEventFired(dedupKey);

  trackEvent('generate_lead', {
    currency: 'NGN',
    ...params
  });
}

/**
 * Track WhatsApp button clicked
 */
export function trackWhatsAppClick(params?: { location?: string; page?: string; service?: string }): void {
  trackEvent('whatsapp_click', {
    location: params?.location || 'cta_button',
    page: params?.page || window.location.pathname,
    service: params?.service
  });
}

/**
 * Track Phone number link clicked
 */
export function trackPhoneClick(params?: { location?: string; page?: string }): void {
  trackEvent('phone_click', {
    location: params?.location || 'contact_info',
    page: params?.page || window.location.pathname
  });
}

/**
 * Track Email link clicked
 */
export function trackEmailClick(params?: { location?: string; page?: string }): void {
  trackEvent('email_click', {
    location: params?.location || 'contact_info',
    page: params?.page || window.location.pathname
  });
}

/**
 * Track Service page or service item viewed
 */
export function trackServiceView(serviceName?: string): void {
  trackEvent('service_view', {
    content_name: serviceName || 'Services Overview',
    content_category: 'Creative Services'
  });
}

/**
 * Track Pricing page or pricing package viewed
 */
export function trackPricingView(packageName?: string): void {
  trackEvent('pricing_view', {
    content_name: packageName || 'Pricing Packages',
    content_category: 'Pricing'
  });
}

/**
 * Track Client Agreement viewed or downloaded
 */
export function trackAgreementInteraction(action: 'view' | 'download' | 'print'): void {
  trackEvent('cta_click', {
    action: `agreement_${action}`,
    content_name: 'Client / Service Agreement',
    content_category: 'Legal'
  });
}

/**
 * Track Checkout / Payment session initiated
 */
export function trackPaymentStarted(params: {
  package_name: string;
  amount: number;
  currency?: string;
  reference?: string;
}): void {
  trackEvent('payment_started', {
    package: params.package_name,
    content_name: params.package_name,
    value: params.amount,
    currency: params.currency || 'NGN',
    transaction_id: params.reference
  });
}

/**
 * Track confirmed successful payment
 * Deduplicated strictly by transaction_reference so page refreshes never re-fire purchase.
 */
export function trackPaymentSuccess(params: {
  transaction_reference: string;
  amount: number;
  currency?: string;
  package_name?: string;
  customer_email?: string;
}): void {
  const dedupKey = `purchase_${params.transaction_reference}`;
  if (hasEventFired(dedupKey)) {
    if (import.meta.env.DEV) {
      console.log(`[IOE Analytics] Purchase event already recorded for ${params.transaction_reference}, skipping duplicate.`);
    }
    return;
  }
  markEventFired(dedupKey);

  trackEvent('purchase', {
    transaction_id: params.transaction_reference,
    value: params.amount,
    currency: params.currency || 'NGN',
    package: params.package_name || 'Design Package',
    content_name: params.package_name || 'Design Package'
  });
}

/**
 * Track generic CTA clicks (e.g. "Request Quote" buttons from Home or Service cards)
 */
export function trackCtaClick(ctaName: string, location?: string): void {
  trackEvent('cta_click', {
    content_name: ctaName,
    location: location || 'unknown'
  });
}
