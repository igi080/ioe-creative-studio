import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Mail, 
  Phone, 
  MessageSquare, 
  Building, 
  ExternalLink, 
  Calendar, 
  DollarSign, 
  Edit3, 
  X, 
  Save, 
  RefreshCw,
  Copy,
  Check,
  Globe
} from 'lucide-react';
import { getSupabase } from '../../lib/supabase';
import { QuoteRequest, QuoteStatus } from '../../types';
import { parseAttributionFromText } from '../../lib/analytics';

interface AdminQuoteRequestsProps {
  setError: (msg: string | null) => void;
  showSuccess: (msg: string) => void;
}

const statusOptions: { value: QuoteStatus; label: string; badgeClass: string }[] = [
  { value: 'new', label: 'New', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'reviewing', label: 'Reviewing', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'quoted', label: 'Quoted', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { value: 'approved', label: 'Approved', badgeClass: 'bg-teal-100 text-teal-800 border-teal-300' },
  { value: 'in_progress', label: 'In Progress', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'completed', label: 'Completed', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'cancelled', label: 'Cancelled', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' }
];

export function AdminQuoteRequests({ setError, showSuccess }: AdminQuoteRequestsProps) {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Detailed Supabase SELECT error state for debugging
  const [selectError, setSelectError] = useState<{
    code?: string;
    message?: string;
    details?: string | null;
    hint?: string | null;
  } | null>(null);

  // Authenticated session diagnostics
  const [authDebug, setAuthDebug] = useState<{
    hasSession: boolean;
    userEmail?: string;
    userId?: string;
    role?: string;
    isAdminRpc?: boolean | null;
    rpcError?: string | null;
  } | null>(null);

  // Selected Quote for Details Modal
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  
  // Deletion Modal
  const [quoteToDelete, setQuoteToDelete] = useState<QuoteRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status & Note update state within Details Modal
  const [editingStatus, setEditingStatus] = useState<QuoteStatus>('new');
  const [editingNotes, setEditingNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Table row per-quote status selection and saving state
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, QuoteStatus>>({});
  const [savingStatusIds, setSavingStatusIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    setSelectError(null);
    setError(null);

    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      const msg = 'Supabase client not initialized. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.';
      setSelectError({ code: 'CLIENT_UNAVAILABLE', message: msg, details: null, hint: null });
      setError(msg);
      return;
    }

    try {
      // 1. Check authenticated session
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      const session = sessionData?.session;
      const user = session?.user;

      // 2. Check public.is_admin() RPC
      let rpcAdminResult: boolean | null = null;
      let rpcAdminErr: string | null = null;
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('is_admin');
        if (rpcErr) {
          rpcAdminErr = rpcErr.message;
        } else {
          rpcAdminResult = rpcData;
        }
      } catch (e: any) {
        rpcAdminErr = e.message;
      }

      setAuthDebug({
        hasSession: !!session,
        userEmail: user?.email,
        userId: user?.id,
        role: user?.role,
        isAdminRpc: rpcAdminResult,
        rpcError: rpcAdminErr
      });

      if (sessionErr) {
        console.warn('Supabase auth session error:', sessionErr);
      }

      // 3. Execute SELECT query on public.quote_requests
      let queryResult = await supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Fallback: If ordering by created_at causes error 42703 (undefined column), retry without order
      if (queryResult.error && queryResult.error.code === '42703') {
        console.warn('created_at column missing, retrying plain select(*) on quote_requests');
        queryResult = await supabase
          .from('quote_requests')
          .select('*');
      }

      if (queryResult.error) {
        const err = queryResult.error;
        console.error('Supabase quote_requests SELECT error:', err);
        setSelectError({
          code: err.code,
          message: err.message,
          details: err.details,
          hint: err.hint
        });
        setError(`Supabase SELECT error on quote_requests [Code: ${err.code || 'UNKNOWN'}]: ${err.message}${err.hint ? ` (Hint: ${err.hint})` : ''}`);
        setQuotes([]);
      } else {
        setSelectError(null);
        setError(null);
        setQuotes(queryResult.data || []);
      }
    } catch (err: any) {
      console.error('Unexpected error fetching quote requests:', err);
      setSelectError({
        code: err.code || 'CLIENT_EXCEPTION',
        message: err.message || String(err),
        details: err.details || null,
        hint: err.hint || null
      });
      setError('Unexpected error: ' + (err.message || String(err)));
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (quote: QuoteRequest) => {
    setSelectedQuote(quote);
    setEditingStatus(quote.status);
    setEditingNotes(quote.admin_notes || '');
  };

  const closeDetails = () => {
    setSelectedQuote(null);
  };

  const handleUpdateQuote = async () => {
    if (!selectedQuote) return;
    setIsUpdating(true);
    setError(null);

    const supabase = getSupabase();
    if (!supabase) {
      setIsUpdating(false);
      return;
    }

    try {
      const updatePayload = {
        status: editingStatus,
        admin_notes: editingNotes.trim() || null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('quote_requests')
        .update(updatePayload)
        .eq('id', selectedQuote.id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Update failed: Record not found or blocked by Row Level Security (RLS).');
      }

      // Update local state
      const updatedItem = { ...selectedQuote, ...updatePayload };
      setSelectedQuote(updatedItem);
      setQuotes(prev => prev.map(q => q.id === selectedQuote.id ? updatedItem : q));
      showSuccess('Quote status and notes updated successfully.');
      // Refresh list to update counters and latest timestamps
      await fetchQuotes();
    } catch (err: any) {
      console.error('Error updating quote request:', err);
      setError(`Supabase UPDATE error on quote_requests [Code: ${err.code || 'UNKNOWN'}]: ${err.message}${err.hint ? ` (Hint: ${err.hint})` : ''}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveStatus = async (quote: QuoteRequest) => {
    const targetStatus = selectedStatuses[quote.id] || quote.status;
    setSavingStatusIds(prev => ({ ...prev, [quote.id]: true }));
    setError(null);

    const supabase = getSupabase();
    if (!supabase) {
      setSavingStatusIds(prev => ({ ...prev, [quote.id]: false }));
      const msg = 'Supabase client not initialized.';
      setError(msg);
      return;
    }

    try {
      // Update ONLY that quote's "status" column and "updated_at" in public.quote_requests
      let { error } = await supabase
        .from('quote_requests')
        .update({
          status: targetStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', quote.id);

      // Fallback: If updated_at is undefined in schema (PostgreSQL error 42703), retry updating only status
      if (error && error.code === '42703') {
        const retry = await supabase
          .from('quote_requests')
          .update({ status: targetStatus })
          .eq('id', quote.id);
        error = retry.error;
      }

      if (error) {
        throw error;
      }

      // Show the existing success notification mechanism
      showSuccess(`Status for quote #${quote.id.slice(0, 8)} (${quote.full_name}) successfully updated to "${targetStatus}".`);

      if (selectedQuote && selectedQuote.id === quote.id) {
        setSelectedQuote(prev => prev ? { ...prev, status: targetStatus } : null);
        setEditingStatus(targetStatus);
      }

      // Clear local uncommitted state for this quote
      setSelectedStatuses(prev => {
        const next = { ...prev };
        delete next[quote.id];
        return next;
      });

      // If a status filter is currently active that wouldn't match the new status,
      // reset to 'all' so the updated quote remains visible and isn't hidden
      if (statusFilter !== 'all' && targetStatus !== statusFilter) {
        setStatusFilter('all');
      }

      // Refresh/reload the quote request list so the counters and displayed status update immediately
      await fetchQuotes();
    } catch (err: any) {
      console.error('Error updating quote status:', err);
      const errorMsg = `Supabase UPDATE error on quote_requests [Code: ${err.code || 'UNKNOWN'}]: ${err.message}${err.hint ? ` (Hint: ${err.hint})` : ''}`;
      setError(errorMsg);
    } finally {
      setSavingStatusIds(prev => ({ ...prev, [quote.id]: false }));
    }
  };

  const handleSaveModalStatusOnly = async () => {
    if (!selectedQuote) return;
    setIsUpdating(true);
    setError(null);

    const supabase = getSupabase();
    if (!supabase) {
      setIsUpdating(false);
      setError('Supabase client not initialized.');
      return;
    }

    try {
      let { error } = await supabase
        .from('quote_requests')
        .update({
          status: editingStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedQuote.id);

      if (error && error.code === '42703') {
        const retry = await supabase
          .from('quote_requests')
          .update({ status: editingStatus })
          .eq('id', selectedQuote.id);
        error = retry.error;
      }

      if (error) throw error;

      showSuccess(`Status for quote #${selectedQuote.id.slice(0, 8)} successfully updated to "${editingStatus}".`);
      setSelectedQuote(prev => prev ? { ...prev, status: editingStatus } : null);
      await fetchQuotes();
    } catch (err: any) {
      console.error('Error updating quote status in modal:', err);
      const errorMsg = `Supabase UPDATE error on quote_requests [Code: ${err.code || 'UNKNOWN'}]: ${err.message}${err.hint ? ` (Hint: ${err.hint})` : ''}`;
      setError(errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = (quote: QuoteRequest) => {
    setQuoteToDelete(quote);
  };

  const executeDelete = async () => {
    if (!quoteToDelete) return;
    setIsDeleting(true);
    setError(null);

    const supabase = getSupabase();
    if (!supabase) {
      setIsDeleting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('quote_requests')
        .delete()
        .eq('id', quoteToDelete.id);

      if (error) throw error;

      setQuotes(prev => prev.filter(q => q.id !== quoteToDelete.id));
      if (selectedQuote?.id === quoteToDelete.id) {
        setSelectedQuote(null);
      }
      setQuoteToDelete(null);
      showSuccess('Quote request deleted successfully.');
      await fetchQuotes();
    } catch (err: any) {
      console.error('Error deleting quote request:', err);
      setError('Error deleting quote request: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const matchesSearch = 
        q.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.company?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchTerm, statusFilter]);

  const getStatusBadge = (status: QuoteStatus) => {
    const config = statusOptions.find(opt => opt.value === status) || statusOptions[0];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeClass}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Client Quote Requests
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review incoming project briefs, track quotation milestones, and manage client requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchQuotes}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Supabase SELECT Query Error Alert */}
      {selectError && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-3 w-full">
              <div>
                <h3 className="text-base font-bold text-rose-900">
                  Supabase SELECT Query Error on &quot;public.quote_requests&quot;
                </h3>
                <p className="text-xs text-rose-700 mt-1">
                  The authenticated admin query returned an error from PostgreSQL / Supabase:
                </p>
              </div>

              <div className="bg-rose-950 text-rose-100 p-4 rounded-xl font-mono text-xs space-y-1.5 overflow-x-auto shadow-inner">
                <div><span className="text-rose-400 font-bold">code:</span> {selectError.code || 'None'}</div>
                <div><span className="text-rose-400 font-bold">message:</span> {selectError.message || 'None'}</div>
                <div><span className="text-rose-400 font-bold">details:</span> {selectError.details || 'null'}</div>
                <div><span className="text-rose-400 font-bold">hint:</span> {selectError.hint || 'null'}</div>
              </div>

              {authDebug && (
                <div className="p-3 bg-white/80 rounded-xl border border-rose-200 text-xs text-slate-700 space-y-1">
                  <div className="font-bold text-slate-900">Authenticated Session Diagnostics:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                    <div><span className="font-semibold text-slate-500">Session Present:</span> {authDebug.hasSession ? 'Yes (Authenticated)' : 'No (Anon Key)'}</div>
                    <div><span className="font-semibold text-slate-500">User Email:</span> {authDebug.userEmail || 'None'}</div>
                    <div><span className="font-semibold text-slate-500">User ID:</span> {authDebug.userId || 'None'}</div>
                    <div><span className="font-semibold text-slate-500">is_admin() RPC:</span> {authDebug.isAdminRpc === null ? `Error (${authDebug.rpcError})` : authDebug.isAdminRpc ? 'true' : 'false'}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={fetchQuotes}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Retry Query
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <span className="block text-[11px] font-bold uppercase tracking-wider opacity-75">All Quotes</span>
          <span className="text-lg font-extrabold">{quotes.length}</span>
        </button>

        {statusOptions.map((opt) => {
          const count = quotes.filter(q => q.status === opt.value).length;
          const isActive = statusFilter === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(isActive ? 'all' : opt.value)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="block text-[11px] font-bold uppercase tracking-wider opacity-75 truncate">{opt.label}</span>
              <span className="text-lg font-extrabold">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, email, company, or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <label htmlFor="admin-table-status-filter" className="sr-only">Filter table by status</label>
          <select
            id="admin-table-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Filter Table: All Statuses ({quotes.length})</option>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                Filter Table: {opt.label} ({quotes.filter(q => q.status === opt.value).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-medium">Loading quote requests...</p>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="py-16 text-center text-slate-500 px-4">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base mb-1">No Quote Requests Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? `No quote requests match your filter criteria (Status: ${statusFilter === 'all' ? 'All' : statusFilter}${searchTerm ? `, Search: "${searchTerm}"` : ''}).`
                : 'Submitted quote requests from clients will appear here automatically.'}
            </p>

            {/* Clear filter action if quotes exist in database but are filtered out */}
            {quotes.length > 0 && (statusFilter !== 'all' || searchTerm) && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchTerm('');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Show All {quotes.length} Quote Request{quotes.length === 1 ? '' : 's'} (Reset Filter)</span>
                </button>
              </div>
            )}

            {/* Diagnostic Query Status: ONLY shown when database query actually returned 0 rows */}
            {!selectError && authDebug && quotes.length === 0 && (
              <div className="inline-block text-left p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 max-w-lg mx-auto">
                <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  Database Query Status: Executed (0 rows returned from table)
                </div>
                <div className="space-y-0.5 text-[11px] text-slate-500">
                  <div>Target table: <code className="text-teal-700 font-semibold">public.quote_requests</code></div>
                  <div>Active User: <span className="font-medium text-slate-700">{authDebug.userEmail || 'Unauthenticated'}</span></div>
                  <div>Session: <span className="font-medium text-slate-700">{authDebug.hasSession ? 'Authenticated' : 'None (Anon Key)'}</span></div>
                  <div>is_admin() RPC: <span className={`font-semibold ${authDebug.isAdminRpc ? 'text-teal-700' : 'text-amber-700'}`}>{authDebug.isAdminRpc === null ? `Error (${authDebug.rpcError})` : String(authDebug.isAdminRpc)}</span></div>
                </div>
                {authDebug.isAdminRpc === false && (
                  <p className="text-amber-700 font-medium text-[11px] mt-2 pt-2 border-t border-slate-200">
                    Notice: <code className="bg-amber-50 px-1 py-0.5 rounded text-amber-900">public.is_admin()</code> evaluated to <strong>false</strong> for this session. The RLS policy <code className="bg-amber-50 px-1 py-0.5 rounded text-amber-900">USING (public.is_admin())</code> requires an active record in <code className="bg-amber-50 px-1 py-0.5 rounded text-amber-900">admin_users</code> to permit viewing quote requests.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Client & Company</th>
                  <th scope="col" className="px-6 py-3.5">Service</th>
                  <th scope="col" className="px-6 py-3.5">Contact</th>
                  <th scope="col" className="px-6 py-3.5">Status</th>
                  <th scope="col" className="px-6 py-3.5">Submitted</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Client & Company */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{quote.full_name}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        {quote.company ? (
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{quote.company}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">Individual Client</div>
                        )}
                        {(() => {
                          const attr = parseAttributionFromText(quote.additional_requirements);
                          const src = attr?.utm_source?.toLowerCase();
                          if (src) {
                            return (
                              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.2 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                                {src}
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-500">
                              direct
                            </span>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Service */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-md text-xs">
                        {quote.service}
                      </span>
                      {quote.budget && (
                        <div className="text-xs text-slate-500 mt-1">
                          Budget: <span className="font-medium text-slate-700">{quote.budget}</span>
                        </div>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 text-xs space-y-1">
                      <div className="text-slate-700 font-medium">{quote.email}</div>
                      <div className="text-slate-500">{quote.phone}</div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 min-w-[240px]">
                        <div>
                          {getStatusBadge(quote.status)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <select
                            id={`quote-status-select-${quote.id}`}
                            value={selectedStatuses[quote.id] ?? quote.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newStatus = e.target.value as QuoteStatus;
                              setSelectedStatuses(prev => ({ ...prev, [quote.id]: newStatus }));
                            }}
                            disabled={!!savingStatusIds[quote.id]}
                            className={`text-xs border rounded-lg px-2.5 py-1.5 bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
                              selectedStatuses[quote.id] && selectedStatuses[quote.id] !== quote.status
                                ? 'border-teal-500 bg-teal-50/60 font-semibold text-teal-900 ring-1 ring-teal-400'
                                : 'border-slate-300 hover:border-slate-400'
                            }`}
                            aria-label={`Select status for quote from ${quote.full_name}`}
                          >
                            {statusOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          <button
                            id={`quote-update-btn-${quote.id}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveStatus(quote);
                            }}
                            disabled={!!savingStatusIds[quote.id]}
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                              savingStatusIds[quote.id]
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : selectedStatuses[quote.id] && selectedStatuses[quote.id] !== quote.status
                                ? 'bg-teal-600 hover:bg-teal-700 text-white ring-2 ring-teal-400/50 hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-slate-800 hover:bg-slate-900 text-white hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                            title="Save status change to database"
                          >
                            {savingStatusIds[quote.id] ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-3 h-3" />
                                <span>Update Status</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Submitted Date */}
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(quote.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      <div className="text-[11px] text-slate-400">
                        {new Date(quote.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetails(quote)}
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          title="View Full Request"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(quote)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details View Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    Quote Request #{selectedQuote.id.slice(0, 8)}
                  </h3>
                  {getStatusBadge(selectedQuote.status)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Submitted on {new Date(selectedQuote.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-sm text-slate-700">
              
              {/* Quick Contact & Info Bar */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid sm:grid-cols-3 gap-4">
                <div>
                  <span className="block text-xs font-bold uppercase text-slate-500">Client Name</span>
                  <span className="font-bold text-slate-900 text-base">{selectedQuote.full_name}</span>
                  {selectedQuote.company && (
                    <div className="text-xs text-slate-600 mt-0.5">{selectedQuote.company}</div>
                  )}
                </div>

                <div>
                  <span className="block text-xs font-bold uppercase text-slate-500">Email Address</span>
                  <a 
                    href={`mailto:${selectedQuote.email}?subject=IOE%20Creative%20Studio%20-%20Quote%20for%20${encodeURIComponent(selectedQuote.service)}`}
                    className="font-medium text-teal-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {selectedQuote.email}
                  </a>
                </div>

                <div>
                  <span className="block text-xs font-bold uppercase text-slate-500">Phone / WhatsApp</span>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <a href={`tel:${selectedQuote.phone}`} className="font-medium text-slate-800 hover:text-teal-600 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {selectedQuote.phone}
                    </a>
                    {selectedQuote.whatsapp && (
                      <a 
                        href={`https://wa.me/${selectedQuote.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp: {selectedQuote.whatsapp}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Project Scope & Requirements */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider">Project Scope</h4>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="block text-xs text-slate-500 uppercase font-semibold">Service</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{selectedQuote.service}</span>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="block text-xs text-slate-500 uppercase font-semibold">Budget Range</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {selectedQuote.budget || 'Not specified'}
                    </span>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="block text-xs text-slate-500 uppercase font-semibold">Desired Deadline</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                      {selectedQuote.desired_completion_date 
                        ? new Date(selectedQuote.desired_completion_date).toLocaleDateString() 
                        : 'Flexible'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <span className="block text-xs font-bold uppercase text-slate-500 mb-1">Project Description</span>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl whitespace-pre-wrap leading-relaxed text-slate-800">
                    {selectedQuote.project_description}
                  </div>
                </div>

                {/* Additional Requirements & Campaign Attribution */}
                {(() => {
                  const raw = selectedQuote.additional_requirements || '';
                  const cleanRequirements = raw.includes('[Campaign Attribution]')
                    ? raw.split('[Campaign Attribution]')[0].trim()
                    : raw.trim();
                  const attribution = parseAttributionFromText(raw);

                  return (
                    <>
                      {cleanRequirements && (
                        <div>
                          <span className="block text-xs font-bold uppercase text-slate-500 mb-1">Additional Requirements</span>
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl whitespace-pre-wrap leading-relaxed text-slate-800">
                            {cleanRequirements}
                          </div>
                        </div>
                      )}

                      {/* Campaign & Acquisition Attribution Card */}
                      <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-teal-600" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Acquisition & Campaign Attribution</span>
                          </div>
                          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {attribution?.utm_source ? `Source: ${attribution.utm_source}` : 'Organic / Direct'}
                          </span>
                        </div>

                        {attribution ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                            <div>
                              <span className="text-slate-400 block font-semibold uppercase text-[10px]">Source</span>
                              <span className="font-bold text-slate-800 capitalize">{attribution.utm_source || '—'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-semibold uppercase text-[10px]">Medium</span>
                              <span className="font-medium text-slate-700">{attribution.utm_medium || '—'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-semibold uppercase text-[10px]">Campaign</span>
                              <span className="font-medium text-slate-700">{attribution.utm_campaign || '—'}</span>
                            </div>
                            {attribution.utm_content && (
                              <div>
                                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Content / Ad</span>
                                <span className="font-medium text-slate-700">{attribution.utm_content}</span>
                              </div>
                            )}
                            {attribution.utm_term && (
                              <div>
                                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Search Term</span>
                                <span className="font-medium text-slate-700">{attribution.utm_term}</span>
                              </div>
                            )}
                            {attribution.landing_page && (
                              <div className="sm:col-span-2">
                                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Landing Page</span>
                                <span className="font-mono text-slate-600 text-[11px]">{attribution.landing_page}</span>
                              </div>
                            )}
                            {attribution.referrer && attribution.referrer !== 'direct' && (
                              <div className="sm:col-span-3">
                                <span className="text-slate-400 block font-semibold uppercase text-[10px]">Referrer</span>
                                <span className="font-mono text-slate-600 text-[11px]">{attribution.referrer}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 pt-1">
                            Direct visitor or unpaid organic entry. No advertising UTM parameters were attached to this session.
                          </p>
                        )}
                      </div>
                    </>
                  );
                })()}

                {/* Reference URL / Asset */}
                {selectedQuote.reference_file_url && (
                  <div>
                    <span className="block text-xs font-bold uppercase text-slate-500 mb-1">Reference Asset / Brief Link</span>
                    <a
                      href={selectedQuote.reference_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 rounded-xl font-medium transition-colors break-all"
                    >
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      <span>{selectedQuote.reference_file_url}</span>
                    </a>
                  </div>
                )}

                {/* Agreement Accepted Status */}
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Client agreed to <strong>IOE Creative Studio Client/Service Agreement</strong> upon submission.
                  </span>
                </div>
              </div>

              {/* Admin Management Section */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                  <Edit3 className="w-4 h-4 text-teal-600" />
                  <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider">Admin Status & Notes</h4>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                      Status
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={editingStatus}
                        onChange={(e) => setEditingStatus(e.target.value as QuoteStatus)}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        disabled={isUpdating}
                        aria-label="Change status in modal"
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleSaveModalStatusOnly}
                        disabled={isUpdating}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                        title="Update Status"
                      >
                        {isUpdating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Update Status</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Internal Admin Notes <span className="text-slate-400 lowercase font-normal">(only visible to admins)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    placeholder="Add internal notes about quote amounts, client follow-up calls, milestones, or project manager assignments..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 rounded-b-3xl">
              <button
                type="button"
                onClick={() => confirmDelete(selectedQuote)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 p-2 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete Request
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={closeDetails}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleUpdateQuote}
                  disabled={isUpdating}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-blue-600 text-slate-900 text-sm font-bold rounded-xl shadow-xs transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {quoteToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
              <p className="text-sm text-slate-600 mt-1">
                Are you sure you want to permanently delete the quote request from{' '}
                <strong>{quoteToDelete.full_name}</strong> for{' '}
                <strong>{quoteToDelete.service}</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQuoteToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Request'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
