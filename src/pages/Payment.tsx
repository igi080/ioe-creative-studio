import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { CreditCard, Building2, Lock, ShieldCheck, Loader2, AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { PricingPackage } from '../types';
import { trackPaymentStarted } from '../lib/analytics';

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [verifyingPending, setVerifyingPending] = useState<string | null>(null);

  // If redirected with transaction reference directly to /payment, route to /payment/callback
  const directReference = searchParams.get('reference') || searchParams.get('trxref');
  useEffect(() => {
    if (directReference) {
      sessionStorage.removeItem('ioe_pending_payment_reference');
      navigate(`/payment/callback?reference=${encodeURIComponent(directReference)}`, { replace: true });
      return;
    }

    // Check if customer just returned from Paystack checkout (e.g. closed modal or redirected without query)
    const storedRef = sessionStorage.getItem('ioe_pending_payment_reference');
    if (storedRef) {
      setVerifyingPending(storedRef);
      fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: storedRef })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && (data.payment?.status === 'paid' || data.already_verified)) {
            sessionStorage.removeItem('ioe_pending_payment_reference');
            navigate(`/payment/callback?reference=${encodeURIComponent(storedRef)}`, { replace: true });
          } else {
            setVerifyingPending(null);
            if (data.status === 'failed' || data.status === 'abandoned') {
              sessionStorage.removeItem('ioe_pending_payment_reference');
              setErrorMessage(`Payment session was closed or not completed (${data.status}). You can try again below.`);
            }
          }
        })
        .catch(err => {
          console.warn('Auto-verify error on return:', err);
          setVerifyingPending(null);
        });
    }
  }, [directReference, navigate]);

  const packageParam = searchParams.get('package') || '';

  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [serviceReference, setServiceReference] = useState<string>('');
  
  const [loadingPackages, setLoadingPackages] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gatewayConfig, setGatewayConfig] = useState<{ configured: boolean; test_mode: boolean } | null>(null);

  // Fetch Gateway Status (safe config check)
  useEffect(() => {
    fetch('/api/payments/config')
      .then(res => res.json())
      .then(data => setGatewayConfig(data))
      .catch(() => setGatewayConfig({ configured: false, test_mode: false }));
  }, []);

  // Fetch Packages
  useEffect(() => {
    async function loadPackages() {
      try {
        const supabase = getSupabase();
        if (supabase) {
          const { data, error } = await supabase
            .from('pricing_packages')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

          if (!error && data && data.length > 0) {
            setPackages(data);

            // Match query param with package ID or Name
            if (packageParam) {
              const matched = data.find(p => p.id === packageParam || p.name.toLowerCase() === packageParam.toLowerCase());
              if (matched) {
                setSelectedPackageId(matched.id);
                setServiceReference(matched.name);
              } else {
                setSelectedPackageId(data[0].id);
              }
            } else {
              setSelectedPackageId(data[0].id);
            }
            setLoadingPackages(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error loading packages for payment:', err);
      }

      // Fallback packages if DB not ready
      const defaultPackages: PricingPackage[] = [
        {
          id: '7a111111-0001-4000-8000-000000000001',
          name: 'BASIC',
          category: 'Creative Design / Digital Services',
          description: 'A professional starter package for individuals, small businesses, brands, and organizations that need quality digital design and a strong visual presence.',
          price: 30000,
          currency: 'NGN',
          billing_period: '',
          features: [
            'Professional logo or brand graphic',
            'Up to 3 static promotional designs',
            'Social media-ready graphics',
            'Basic brand color and typography guidance',
            'High-resolution final files',
            'One revision round',
            'Delivery of final files digitally'
          ],
          is_featured: false,
          is_active: true,
          display_order: 1,
          image: '/images/ioe_basic_pkg_1790170332898.jpg',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '7a222222-0002-4000-8000-000000000002',
          name: 'BUSINESS',
          category: 'Business Branding & Digital Presence',
          description: 'A complete digital design package for growing businesses that need consistent branding and professional promotional content.',
          price: 50000,
          currency: 'NGN',
          billing_period: '',
          features: [
            'Professional logo/brand identity design',
            'Up to 6 static promotional designs',
            'Social media graphics',
            'Business flyer/poster designs',
            'Basic brand style guide',
            'High-resolution final files',
            'Two revision rounds',
            'Web-ready and social-media-ready assets',
            'Digital delivery'
          ],
          is_featured: true,
          is_active: true,
          display_order: 2,
          image: '/images/ioe_business_pkg_1790170346116.jpg',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '7a333333-0003-4000-8000-000000000003',
          name: 'BRAND PRO',
          category: 'Premium Branding & Digital Innovation',
          description: 'A premium creative package for businesses, organizations, and brands that need a stronger visual identity and a more complete digital presence.',
          price: 100000,
          currency: 'NGN',
          billing_period: '',
          features: [
            'Professional logo and visual identity',
            'Brand color palette and typography system',
            'Premium brand style guide',
            'Up to 10 static promotional designs',
            'Social media design assets',
            'Marketing flyer/poster designs',
            'Premium presentation graphics',
            'Basic motion/logo animation',
            'Web-ready brand assets',
            'High-resolution source/final files where applicable',
            'Three revision rounds',
            'Priority project handling',
            'Digital delivery'
          ],
          is_featured: false,
          is_active: true,
          display_order: 3,
          image: '/images/ioe_brand_pro_pkg_1790170357058.jpg',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setPackages(defaultPackages);
      if (packageParam) {
        const matched = defaultPackages.find(p => p.id === packageParam || p.name.toLowerCase() === packageParam.toLowerCase());
        if (matched) {
          setSelectedPackageId(matched.id);
          setServiceReference(matched.name);
        } else {
          setSelectedPackageId(defaultPackages[0].id);
        }
      } else {
        setSelectedPackageId(defaultPackages[0].id);
      }
      setLoadingPackages(false);
    }

    loadPackages();
  }, [packageParam]);

  // Selected Package details
  const currentPackage = packages.find(p => p.id === selectedPackageId);

  // Handle Submission
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail.trim() || !emailRegex.test(customerEmail.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!currentPackage || !currentPackage.price || Number(currentPackage.price) <= 0) {
      setErrorMessage('Please select a valid package with an approved price.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim().toLowerCase(),
          customer_phone: customerPhone.trim() || null,
          package_id: currentPackage.id,
          package_name: currentPackage.name,
          service_name: currentPackage.category || 'Creative Studio Service',
          amount: currentPackage.price,
          currency: currentPackage.currency || 'NGN',
          description: `Payment for ${currentPackage.name}`
        })
      });

      const data = await response.json();

      if (response.ok && data.success && data.authorization_url) {
        // Track payment session initiation
        trackPaymentStarted({
          package_name: currentPackage.name,
          amount: Number(currentPackage.price),
          currency: currentPackage.currency || 'NGN',
          reference: data.reference
        });

        // Save pending transaction reference in sessionStorage so returning to /payment auto-verifies
        if (data.reference) {
          sessionStorage.setItem('ioe_pending_payment_reference', data.reference);
        }
        // Redirect directly to Paystack's secure checkout page
        window.location.href = data.authorization_url;
      } else {
        setSubmitting(false);
        if (data.code === 'PAYSTACK_NOT_CONFIGURED') {
          setErrorMessage('Paystack payment gateway is not yet configured with PAYSTACK_SECRET_KEY on the server. Please check with the studio administrator.');
        } else {
          setErrorMessage(data.error || 'Failed to initialize payment with Paystack. Please try again.');
        }
      }
    } catch (err: any) {
      setSubmitting(false);
      setErrorMessage(err.message || 'Unable to connect to the payment server. Please check your connection.');
    }
  };

  return (
    <div className="pt-24 pb-20 lg:pt-32 lg:pb-32 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-6">
          <Link 
            to="/pricing" 
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Packages
          </Link>
        </div>

        <div className="text-center mb-10">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3"
          >
            Secure Checkout
          </motion.h1>
          <p className="text-gray-600 max-w-lg mx-auto text-sm md:text-base">
            Complete your service payment securely. Payments are processed with bank-grade encryption via Paystack.
          </p>

          {gatewayConfig?.test_mode && (
            <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
              <span>●</span> Paystack Test Mode Active
            </div>
          )}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden"
        >
          <div className="p-8 md:p-10">
            
            {/* Auto-Verification Banner on Return */}
            {verifyingPending && (
              <div className="mb-8 p-6 bg-teal-50 border border-teal-200 rounded-2xl flex items-center gap-4">
                <Loader2 className="w-8 h-8 text-teal-600 animate-spin shrink-0" />
                <div>
                  <p className="font-bold text-teal-900 text-sm">Verifying your recent payment with Paystack...</p>
                  <p className="text-teal-700 text-xs mt-0.5 font-mono">Ref: {verifyingPending}</p>
                </div>
              </div>
            )}

            {/* Amount Due Card */}
            <div className="mb-8 p-6 bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl border border-teal-100/80 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">Amount Due</p>
                {loadingPackages ? (
                  <div className="h-8 w-32 bg-teal-200/50 animate-pulse rounded mt-2"></div>
                ) : currentPackage ? (
                  <p className="text-3xl font-extrabold text-gray-900 mt-1">
                    {currentPackage.currency === 'USD' ? '$' : '₦'}
                    {Number(currentPackage.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                ) : (
                  <p className="text-xl font-bold text-gray-800 mt-1">Select a Package</p>
                )}
                {currentPackage?.name && (
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Package: <span className="text-slate-900 font-bold">{currentPackage.name}</span>
                    {currentPackage.billing_period ? ` (${currentPackage.billing_period})` : ''}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-teal-100 flex items-center justify-center shadow-sm">
                <Lock className="w-5 h-5 text-teal-600" />
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Unable to proceed</p>
                  <p className="text-xs mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-6">
              
              {/* Package Selection */}
              <div>
                <label htmlFor="packageSelect" className="block text-sm font-semibold text-gray-700 mb-2">
                  Selected Package / Service
                </label>
                {loadingPackages ? (
                  <div className="w-full h-11 bg-slate-100 animate-pulse rounded-xl"></div>
                ) : (
                  <select
                    id="packageSelect"
                    value={selectedPackageId}
                    onChange={(e) => {
                      setSelectedPackageId(e.target.value);
                      const sel = packages.find(p => p.id === e.target.value);
                      if (sel) setServiceReference(sel.name);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-shadow"
                    disabled={submitting}
                  >
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} — {pkg.currency === 'USD' ? '$' : '₦'}{Number(pkg.price || 0).toLocaleString()} {pkg.billing_period ? `(${pkg.billing_period})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Customer Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    id="customerName" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-shadow" 
                    placeholder="Full name" 
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-shadow" 
                    placeholder="your@email.com" 
                  />
                </div>
              </div>
              
              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input 
                  type="tel" 
                  id="phone" 
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  disabled={submitting}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-600 focus:border-transparent outline-none transition-shadow" 
                  placeholder="+234..." 
                />
              </div>

              {/* Payment Method Selector */}
              <div className="pt-6 border-t border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-4">Payment Method</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="relative flex cursor-pointer rounded-2xl border-2 border-teal-600 bg-teal-50/20 p-4 shadow-sm focus:outline-none">
                    <input type="radio" name="payment-method" value="paystack" className="sr-only" defaultChecked />
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 flex items-center">
                          <CreditCard className="w-5 h-5 mr-2 text-teal-600" />
                          Paystack Checkout
                        </span>
                        <span className="mt-1 text-xs text-gray-500">Debit Card, Bank Transfer, USSD</span>
                      </span>
                    </span>
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  </label>

                  <label className="relative flex cursor-not-allowed rounded-2xl border border-gray-200 p-4 shadow-sm focus:outline-none bg-gray-50 opacity-60">
                    <input type="radio" name="payment-method" value="direct_transfer" className="sr-only" disabled />
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-700 flex items-center">
                          <Building2 className="w-5 h-5 mr-2 text-gray-400" />
                          Manual Invoice
                        </span>
                        <span className="mt-1 text-xs text-gray-400">Available upon request</span>
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || loadingPackages}
                className="w-full mt-8 flex items-center justify-center py-4 px-8 border border-transparent rounded-2xl shadow-md text-base font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Connecting to Paystack...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Pay {currentPackage ? `${currentPackage.currency === 'USD' ? '$' : '₦'}${Number(currentPackage.price || 0).toLocaleString()}` : ''} Now
                  </>
                )}
              </button>

              <div className="text-center space-y-1">
                <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-teal-600" /> 256-bit encrypted checkout. Card details are processed directly on Paystack.
                </p>
                <p className="text-[11px] text-gray-400">
                  By clicking Pay Now, you agree to the IOE Creative Studio Terms of Service and Client Agreement.
                </p>
              </div>
            </form>

          </div>
        </motion.div>

      </div>
    </div>
  );
}
