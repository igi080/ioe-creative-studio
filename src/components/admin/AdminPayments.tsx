import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle,
  RefreshCw, 
  Copy, 
  Check, 
  Calendar, 
  DollarSign, 
  Mail, 
  Phone, 
  ShieldCheck, 
  FileText, 
  ExternalLink,
  Code,
  Save,
  X,
  RotateCcw
} from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { Payment, PaymentStatus } from '../../types';

interface AdminPaymentsProps {
  setError: (msg: string | null) => void;
  showSuccess: (msg: string) => void;
}

const statusConfig: Record<PaymentStatus, { label: string; badgeClass: string; dotClass: string }> = {
  paid: {
    label: 'Paid',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500'
  },
  processing: {
    label: 'Processing',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500'
  },
  pending: {
    label: 'Pending',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500 animate-pulse'
  },
  failed: {
    label: 'Failed',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500'
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    dotClass: 'bg-slate-500'
  },
  refunded: {
    label: 'Refunded',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    dotClass: 'bg-purple-500'
  }
};

export function AdminPayments({ setError, showSuccess }: AdminPaymentsProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  
  // Table missing error state if Supabase table has not been migrated yet
  const [tableMissing, setTableMissing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Status updating within details modal
  const [editingStatus, setEditingStatus] = useState<PaymentStatus>('pending');
  const [editingNotes, setEditingNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [verifyingRef, setVerifyingRef] = useState<string | null>(null);

  const handleVerifyWithGateway = async (targetRef: string) => {
    if (!targetRef) return;
    setVerifyingRef(targetRef);
    setError(null);

    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: targetRef })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showSuccess(`Payment ${targetRef} verified: ${data.message || 'Status is now Paid'}`);
        await fetchPayments();
        if (selectedPayment && selectedPayment.transaction_reference === targetRef) {
          setSelectedPayment(prev => prev ? { ...prev, ...(data.payment || {}) } : null);
          if (data.payment?.status) {
            setEditingStatus(data.payment.status);
          }
        }
      } else {
        const errorMsg = data.error || data.message || 'Gateway verification did not report a successful payment.';
        setError(errorMsg);
        await fetchPayments();
        if (selectedPayment && selectedPayment.transaction_reference === targetRef && data.payment) {
          setSelectedPayment(prev => prev ? { ...prev, ...data.payment } : null);
          if (data.payment?.status) {
            setEditingStatus(data.payment.status);
          }
        }
      }
    } catch (err: any) {
      setError(`Failed to execute verification: ${err.message || err}`);
    } finally {
      setVerifyingRef(null);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setTableMissing(false);
    setError(null);

    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      setError('Supabase client is not available. Please verify credentials in environment.');
      return;
    }

    try {
      const { data, error: fetchErr } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) {
        // Check if table does not exist in schema cache
        if (fetchErr.code === 'PGRST205' || fetchErr.message?.includes('Could not find the table') || fetchErr.message?.includes('does not exist')) {
          setTableMissing(true);
          setPayments([]);
        } else {
          console.error('Error fetching payments:', fetchErr);
          setError(`Unable to load payments: ${fetchErr.message}`);
        }
      } else {
        setPayments(data || []);
      }
    } catch (err: any) {
      console.error('Fetch payments exception:', err);
      setError(`Failed to retrieve payment records: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(id);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const handleOpenDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setEditingStatus(payment.status);
    setEditingNotes(payment.description || '');
  };

  const handleUpdateStatus = async () => {
    if (!selectedPayment) return;
    setIsUpdating(true);
    setError(null);

    const supabase = getSupabase();
    if (!supabase) {
      setError('Supabase client unavailable');
      setIsUpdating(false);
      return;
    }

    try {
      const updates: Partial<Payment> = {
        status: editingStatus,
        description: editingNotes,
        updated_at: new Date().toISOString()
      };

      if (editingStatus === 'paid' && !selectedPayment.paid_at) {
        updates.paid_at = new Date().toISOString();
      }

      const { error: updateErr } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', selectedPayment.id);

      if (updateErr) {
        throw updateErr;
      }

      showSuccess(`Payment ${selectedPayment.transaction_reference} updated to ${editingStatus}`);
      
      // Update local state
      const updatedList = payments.map(p => 
        p.id === selectedPayment.id 
          ? { ...p, ...updates } 
          : p
      );
      setPayments(updatedList);
      setSelectedPayment(prev => prev ? { ...prev, ...updates } : null);
    } catch (err: any) {
      console.error('Failed to update payment status:', err);
      setError(`Status update failed: ${err.message || err}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const copyMigrationSql = () => {
    const sql = `-- Run this in your Supabase SQL Editor:
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

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to select payments" ON public.payments FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Allow admins to insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Allow admins to update payments" ON public.payments FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Allow admins to delete payments" ON public.payments FOR DELETE TO authenticated USING (public.is_admin());
CREATE POLICY "Allow client checkout to create pending payments" ON public.payments FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT INSERT ON public.payments TO anon;
NOTIFY pgrst, 'reload schema';`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = 
        p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.transaction_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.package_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesCurrency = currencyFilter === 'all' || p.currency === currencyFilter;

      return matchesSearch && matchesStatus && matchesCurrency;
    });
  }, [payments, searchTerm, statusFilter, currencyFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    payments.forEach(p => {
      if (p.status === 'paid') {
        paidCount++;
        totalRevenue += Number(p.amount || 0);
      } else if (p.status === 'pending' || p.status === 'processing') {
        pendingCount++;
      } else if (p.status === 'failed' || p.status === 'cancelled' || p.status === 'refunded') {
        failedCount++;
      }
    });

    return { totalRevenue, paidCount, pendingCount, failedCount, totalTransactions: payments.length };
  }, [payments]);

  // Format currency
  const formatAmount = (amount: number, currency: string = 'NGN') => {
    const symbol = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;
    return `${symbol}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Payments & Invoices
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                <ShieldCheck className="w-3.5 h-3.5" /> Stage 1 Ready
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Track customer payments, fixed-package orders, payment gateway references, and transaction audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchPayments}
              disabled={loading}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              title="Refresh payments list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Missing Table Alert Notice */}
        {tableMissing && (
          <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs sm:text-sm">
                  <p className="font-bold">Database Setup Required: `payments` Table</p>
                  <p className="text-amber-800 mt-1">
                    The schema file <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">payments_schema.sql</code> has been created in your project. Run it in your Supabase SQL Editor to initialize the table and RLS policies.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={copyMigrationSql}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'SQL Copied!' : 'Copy Schema SQL'}
              </button>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Revenue</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block">
              {formatAmount(metrics.totalRevenue, 'NGN')}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
              {metrics.paidCount} completed transaction{metrics.paidCount === 1 ? '' : 's'}
            </span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-4">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Completed</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-900 mt-1 block">
              {metrics.paidCount}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
              Verified & captured
            </span>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">Pending / Processing</span>
            <span className="text-xl sm:text-2xl font-black text-amber-900 mt-1 block">
              {metrics.pendingCount}
            </span>
            <span className="text-[11px] text-amber-600 font-medium mt-0.5 block">
              Awaiting verification
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Failed / Cancelled</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 mt-1 block">
              {metrics.failedCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              Unsuccessful or refunded
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer, reference, package..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-stone-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-stone-200 text-slate-700 text-xs rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="bg-slate-50 border border-stone-200 text-slate-700 text-xs rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Currencies</option>
            <option value="NGN">NGN (₦)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>

          {(searchTerm || statusFilter !== 'all' || currencyFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCurrencyFilter('all');
              }}
              type="button"
              className="text-xs text-teal-600 hover:text-teal-700 font-medium px-2 py-1 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Loading payment records...</p>
            <p className="text-xs text-slate-400 mt-1">Querying Supabase payments database</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {searchTerm || statusFilter !== 'all' || currencyFilter !== 'all'
                ? 'No matching payment records found'
                : 'No Payment Records Yet'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {searchTerm || statusFilter !== 'all' || currencyFilter !== 'all'
                ? 'Try adjusting your search query or filter settings.'
                : 'Transactions will automatically appear here once clients purchase fixed packages or complete payments.'}
            </p>
            {!tableMissing && (
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                Payments CMS Architecture Ready for Checkout
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-stone-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Service / Package</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Gateway</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((payment) => {
                  const statusInfo = statusConfig[payment.status] || statusConfig.pending;
                  const isCopied = copiedRef === payment.id;

                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{payment.customer_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{payment.customer_email}</span>
                        </div>
                        {payment.customer_phone && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 shrink-0" />
                            <span>{payment.customer_phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Service / Package */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {payment.service_name || 'Standard Service'}
                        </div>
                        {payment.package_name && (
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium border border-slate-200">
                            {payment.package_name}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {formatAmount(payment.amount, payment.currency)}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {payment.currency}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="capitalize text-slate-700 text-xs font-medium">
                          {payment.payment_method || 'Card'}
                        </span>
                      </td>

                      {/* Gateway */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 capitalize border border-slate-200">
                          {payment.gateway || 'Paystack'}
                        </span>
                      </td>

                      {/* Reference */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded select-all">
                            {payment.transaction_reference}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(payment.transaction_reference, payment.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition cursor-pointer"
                            title="Copy transaction reference"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                        {formatDate(payment.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {(payment.status === 'pending' || payment.status === 'processing' || !payment.gateway_transaction_id || payment.gateway_transaction_id === 'Pending Gateway Sync') && (
                            <button
                              type="button"
                              disabled={verifyingRef === payment.transaction_reference}
                              onClick={() => handleVerifyWithGateway(payment.transaction_reference)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                              title="Verify this transaction directly with Paystack"
                            >
                              <ShieldCheck className={`w-3.5 h-3.5 ${verifyingRef === payment.transaction_reference ? 'animate-spin' : ''}`} />
                              {verifyingRef === payment.transaction_reference ? 'Verifying...' : (payment.status === 'paid' ? 'Sync Gateway' : 'Verify')}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(payment)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold text-xs transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Details Drawer / Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-stone-200 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Payment Details
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs text-slate-500">
                      Ref: {selectedPayment.transaction_reference}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedPayment.transaction_reference, 'modal-ref')}
                      className="text-slate-400 hover:text-slate-600 transition"
                      title="Copy Reference"
                    >
                      {copiedRef === 'modal-ref' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Status Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Current Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig[selectedPayment.status]?.badgeClass || statusConfig.pending.badgeClass}`}>
                      <span className={`w-2 h-2 rounded-full ${statusConfig[selectedPayment.status]?.dotClass || statusConfig.pending.dotClass}`} />
                      {statusConfig[selectedPayment.status]?.label || selectedPayment.status}
                    </span>
                    {selectedPayment.paid_at && (
                      <span className="text-xs text-emerald-600 font-medium">
                        Paid on {formatDate(selectedPayment.paid_at)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium block">Total Amount</span>
                  <span className="text-2xl font-black text-slate-900">
                    {formatAmount(selectedPayment.amount, selectedPayment.currency)}
                  </span>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-500 text-xs block">Full Name</span>
                    <span className="font-semibold text-slate-900">{selectedPayment.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Email Address</span>
                    <a href={`mailto:${selectedPayment.customer_email}`} className="font-semibold text-teal-600 hover:underline">
                      {selectedPayment.customer_email}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Phone Number</span>
                    <span className="font-semibold text-slate-900">{selectedPayment.customer_phone || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs block">Created Timestamp</span>
                    <span className="font-semibold text-slate-900">{formatDate(selectedPayment.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Transaction Specs */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Transaction Specifications
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-slate-500 block">Service Name</span>
                    <span className="font-semibold text-slate-900">{selectedPayment.service_name || 'Standard Service'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Package Tier</span>
                    <span className="font-semibold text-slate-900">{selectedPayment.package_name || 'Standard / Custom'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Currency</span>
                    <span className="font-semibold text-slate-900">{selectedPayment.currency}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Payment Method</span>
                    <span className="font-semibold text-slate-900 capitalize">{selectedPayment.payment_method || 'Card'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Gateway</span>
                    <span className="font-semibold text-slate-900 capitalize">{selectedPayment.gateway || 'Paystack'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Gateway Transaction ID</span>
                    <span className="font-mono text-slate-700">{selectedPayment.gateway_transaction_id || 'Pending Gateway Sync'}</span>
                  </div>
                </div>
              </div>

              {/* Metadata Display (if present) */}
              {selectedPayment.metadata && Object.keys(selectedPayment.metadata).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Order Metadata
                  </h4>
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl text-xs overflow-x-auto font-mono">
                    {JSON.stringify(selectedPayment.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Admin Status & Notes Override */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Admin Status Management
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Update Payment Status:
                    </label>
                    <select
                      value={editingStatus}
                      onChange={(e) => setEditingStatus(e.target.value as PaymentStatus)}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    >
                      <option value="pending">Pending (Awaiting customer payment)</option>
                      <option value="processing">Processing (Gateway verification in progress)</option>
                      <option value="paid">Paid (Verified / Direct bank transfer confirmed)</option>
                      <option value="failed">Failed (Declined / Gateway error)</option>
                      <option value="cancelled">Cancelled (Voided by admin/client)</option>
                      <option value="refunded">Refunded (Returned to client)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Admin Notes / Internal Audit Log:
                    </label>
                    <textarea
                      rows={3}
                      value={editingNotes}
                      onChange={(e) => setEditingNotes(e.target.value)}
                      placeholder="Add administrative notes, proof of transfer receipt reference, or refund reason..."
                      className="w-full bg-white border border-stone-300 rounded-lg p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  Close
                </button>

                {(selectedPayment.status === 'pending' || selectedPayment.status === 'processing' || !selectedPayment.gateway_transaction_id || selectedPayment.gateway_transaction_id === 'Pending Gateway Sync') && (
                  <button
                    type="button"
                    disabled={verifyingRef === selectedPayment.transaction_reference}
                    onClick={() => handleVerifyWithGateway(selectedPayment.transaction_reference)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs border border-emerald-200 transition disabled:opacity-50 cursor-pointer"
                    title="Check status directly against Paystack API"
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 ${verifyingRef === selectedPayment.transaction_reference ? 'animate-spin' : ''}`} />
                    {verifyingRef === selectedPayment.transaction_reference ? 'Checking Gateway...' : (selectedPayment.status === 'paid' ? 'Sync with Paystack' : 'Verify with Paystack')}
                  </button>
                )}
              </div>

              <button
                type="button"
                disabled={isUpdating}
                onClick={handleUpdateStatus}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {isUpdating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
