import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Copy, Check, ShieldCheck, RefreshCw } from 'lucide-react';
import { Payment } from '../types';
import { trackPaymentSuccess } from '../lib/analytics';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Paystack appends 'reference' or 'trxref' to the callback URL (with sessionStorage fallback)
  const reference = searchParams.get('reference') || searchParams.get('trxref') || sessionStorage.getItem('ioe_pending_payment_reference') || '';
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [payment, setPayment] = useState<Partial<Payment> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      setErrorMessage('No payment reference was found in the verification URL.');
      return;
    }

    let isMounted = true;

    async function verifyTransaction() {
      try {
        const response = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference })
        });

        const data = await response.json();

        if (!isMounted) return;

        if (response.ok && data.success) {
          sessionStorage.removeItem('ioe_pending_payment_reference');
          setStatus('success');
          const confirmedPayment = data.payment || { transaction_reference: reference };
          setPayment(confirmedPayment);

          // CONVERSION TRACKING: Confirmed successful payment
          trackPaymentSuccess({
            transaction_reference: reference,
            amount: Number(confirmedPayment.amount || 0),
            currency: confirmedPayment.currency || 'NGN',
            package_name: confirmedPayment.package_name || 'Design Package',
            customer_email: confirmedPayment.customer_email
          });
        } else {
          sessionStorage.removeItem('ioe_pending_payment_reference');
          setStatus('failed');
          setErrorMessage(data.error || 'Payment verification failed with the payment provider.');
          if (data.payment) {
            setPayment(data.payment);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        setStatus('failed');
        setErrorMessage(err.message || 'Unable to communicate with the verification server. Please check your network.');
      }
    }

    verifyTransaction();

    return () => {
      isMounted = false;
    };
  }, [reference]);

  const handleCopyReference = () => {
    if (reference) {
      navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="pt-24 pb-20 lg:pt-32 lg:pb-32 bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* State 1: Verifying */}
        {status === 'verifying' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-sm border border-stone-200 p-8 md:p-12 text-center"
          >
            <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying Payment...</h2>
            <p className="text-slate-600 mb-6 text-sm">
              Please wait while we confirm your transaction securely with Paystack. Do not refresh or leave this page.
            </p>
            {reference && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-600 max-w-sm mx-auto">
                Ref: {reference}
              </div>
            )}
          </motion.div>
        )}

        {/* State 2: Payment Verified Successfully */}
        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden"
          >
            <div className="bg-emerald-500/10 p-8 text-center border-b border-emerald-100">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900">Payment Successful!</h1>
              <p className="text-emerald-800 text-sm mt-1 font-medium flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Verified & Confirmed via Paystack
              </p>
            </div>

            <div className="p-8 space-y-6">
              {/* Transaction Amount */}
              {payment?.amount && (
                <div className="text-center pb-4 border-b border-slate-100">
                  <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Amount Paid</span>
                  <p className="text-4xl font-extrabold text-slate-900 mt-1">
                    {payment.currency === 'USD' ? '$' : '₦'}{Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              {/* Order Specs */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3 text-sm">
                {payment?.package_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Service / Package:</span>
                    <span className="font-bold text-slate-800">{payment.package_name}</span>
                  </div>
                )}
                {payment?.service_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Service Category:</span>
                    <span className="font-medium text-slate-800">{payment.service_name}</span>
                  </div>
                )}
                {payment?.customer_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Customer Name:</span>
                    <span className="font-medium text-slate-800">{payment.customer_name}</span>
                  </div>
                )}
                {payment?.customer_email && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Customer Email:</span>
                    <span className="font-medium text-slate-800">{payment.customer_email}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                  <span className="text-slate-500">Transaction Reference:</span>
                  <button 
                    type="button"
                    onClick={handleCopyReference}
                    className="inline-flex items-center gap-1 font-mono text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded hover:bg-teal-100 transition-colors"
                    title="Click to copy reference"
                  >
                    {reference}
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {payment?.gateway_transaction_id && payment.gateway_transaction_id !== 'Pending Gateway Sync' && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                    <span className="text-slate-500">Gateway Transaction ID:</span>
                    <span className="font-mono text-xs text-slate-700">{payment.gateway_transaction_id}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 text-center leading-relaxed">
                A confirmation has been recorded in the IOE Studio system. Our creative team will reach out to schedule your project kickoff.
              </p>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/"
                  className="flex-1 py-3.5 px-6 rounded-xl font-bold text-center text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Return to Home
                </Link>
                <Link
                  to="/services"
                  className="py-3.5 px-6 rounded-xl font-semibold text-center text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Explore Services
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* State 3: Payment Verification Failed */}
        {status === 'failed' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-rose-100 overflow-hidden"
          >
            <div className="bg-rose-500/10 p-8 text-center border-b border-rose-100">
              <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <XCircle className="w-12 h-12 text-rose-600" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900">Payment Unsuccessful</h1>
              <p className="text-rose-700 text-sm mt-1">
                The payment could not be confirmed or was cancelled.
              </p>
            </div>

            <div className="p-8 space-y-6">
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-sm text-rose-900 leading-relaxed">
                <p className="font-semibold mb-1">Reason for failure:</p>
                <p>{errorMessage || 'The payment was declined, cancelled, or did not complete.'}</p>
              </div>

              {reference && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-600 flex justify-between items-center">
                  <span>Ref: {reference}</span>
                  <button 
                    type="button" 
                    onClick={handleCopyReference} 
                    className="p-1 text-slate-500 hover:text-slate-800"
                    title="Copy reference"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-500 text-center">
                If your card was charged, your bank will typically release reserved funds automatically. For assistance, contact support with the reference code above.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/payment')}
                  className="flex-1 py-3.5 px-6 rounded-xl font-bold text-center text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Try Again
                </button>
                <Link
                  to="/pricing"
                  className="py-3.5 px-6 rounded-xl font-semibold text-center text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  View Packages
                </Link>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
