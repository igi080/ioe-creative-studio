import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  DollarSign, 
  Layers, 
  Link as LinkIcon, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSupabase } from '../lib/supabase';
import { Service } from '../types';
import { trackQuoteStarted, trackQuoteSubmitted, getUtmAttribution, formatAttributionForSubmission } from '../lib/analytics';

const defaultServices = [
  'Graphic Design',
  'Branding & Logo Design',
  'Motion Graphics',
  'Animation',
  'Video Editing',
  'Website Design & Development',
  'Full-Stack Web Development',
  'AI-Assisted Creative Services',
  'Other'
];

const budgetRanges = [
  'Under $500 / ₦400,000',
  '$500 – $1,500 / ₦400k – ₦1.2M',
  '$1,500 – $3,000 / ₦1.2M – ₦2.5M',
  '$3,000 – $5,000 / ₦2.5M – ₦4.0M',
  '$5,000+ / ₦4.0M+',
  'Flexible / To be discussed'
];

export default function RequestQuote() {
  const [availableServices, setAvailableServices] = useState<string[]>(defaultServices);
  const [isServicesLoading, setIsServicesLoading] = useState(true);

  // Uncontrolled input refs to eliminate mobile typing lag and full-form re-renders
  const fullNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const whatsappRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const projectDescriptionRef = useRef<HTMLTextAreaElement>(null);
  const completionDateRef = useRef<HTMLInputElement>(null);
  const additionalRequirementsRef = useRef<HTMLTextAreaElement>(null);
  const referenceUrlRef = useRef<HTMLInputElement>(null);
  const referenceFileNameRef = useRef<HTMLInputElement>(null);

  // Selection & Option States (only update on direct user selection, not per-keystroke)
  const [service, setService] = useState('');
  const [budget, setBudget] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [showReferenceFileName, setShowReferenceFileName] = useState(false);

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    fullName: string;
    email: string;
    phone: string;
    service: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Clear specific error on input without triggering re-render if field had no error
  const clearError = (field: string) => {
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Fetch active services from Supabase if available
  useEffect(() => {
    async function loadServices() {
      const supabase = getSupabase();
      if (!supabase) {
        setIsServicesLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('services')
          .select('title')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (!error && data && data.length > 0) {
          const fetchedTitles = data.map((s: { title: string }) => s.title);
          // Append 'Other' if not in list
          if (!fetchedTitles.includes('Other')) {
            fetchedTitles.push('Other');
          }
          setAvailableServices(fetchedTitles);
        }
      } catch (err) {
        console.error('Could not fetch active services, using standard list:', err);
      } finally {
        setIsServicesLoading(false);
      }
    }

    loadServices();
    // Track Request Quote opened / started
    trackQuoteStarted();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const nameVal = fullNameRef.current?.value.trim() || '';
    const emailVal = emailRef.current?.value.trim() || '';
    const phoneVal = phoneRef.current?.value.trim() || '';
    const serviceVal = service.trim();
    const descVal = projectDescriptionRef.current?.value.trim() || '';

    if (!nameVal) {
      newErrors.fullName = 'Full name is required';
    }

    if (!emailVal) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (!phoneVal) {
      newErrors.phone = 'Phone number is required';
    }

    if (!serviceVal) {
      newErrors.service = 'Please select a required service';
    }

    if (!descVal) {
      newErrors.projectDescription = 'Please describe your project requirements';
    } else if (descVal.length < 20) {
      newErrors.projectDescription = 'Please provide at least 20 characters of detail';
    }

    if (!agreementAccepted) {
      newErrors.agreementAccepted = 'You must review and agree to the Client/Service Agreement';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      const firstError = document.querySelector('.input-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Service connection unavailable. Please try again shortly or contact us directly.');
      }

      const nameVal = fullNameRef.current?.value.trim() || '';
      const emailVal = emailRef.current?.value.trim() || '';
      const phoneVal = phoneRef.current?.value.trim() || '';
      const whatsappVal = whatsappRef.current?.value.trim() || '';
      const companyVal = companyRef.current?.value.trim() || '';
      const descVal = projectDescriptionRef.current?.value.trim() || '';
      const dateVal = completionDateRef.current?.value.trim() || '';
      const addReqVal = additionalRequirementsRef.current?.value.trim() || '';
      const refUrlVal = referenceUrlRef.current?.value.trim() || '';
      const refNameVal = referenceFileNameRef.current?.value.trim() || '';

      // Capture campaign attribution (UTMs, referrer, landing page) safely
      const utmAttribution = getUtmAttribution();
      const attributionText = formatAttributionForSubmission(utmAttribution);

      // Combine user requirements with campaign attribution in existing additional_requirements column
      let finalAdditionalRequirements: string | null = null;
      if (addReqVal && attributionText) {
        finalAdditionalRequirements = `${addReqVal}\n\n${attributionText}`;
      } else if (attributionText) {
        finalAdditionalRequirements = attributionText;
      } else if (addReqVal) {
        finalAdditionalRequirements = addReqVal;
      }

      // Map exactly to existing public.quote_requests columns
      // Omit status, id, created_at, updated_at so database defaults apply
      const payload = {
        full_name: nameVal,
        email: emailVal.toLowerCase(),
        phone: phoneVal,
        whatsapp: whatsappVal || null,
        company: companyVal || null,
        service: service.trim(),
        project_description: descVal,
        budget: budget.trim() || null,
        desired_completion_date: dateVal || null,
        additional_requirements: finalAdditionalRequirements,
        reference_file_url: refUrlVal || null,
        reference_file_name: refUrlVal ? (refNameVal || 'Project Reference Link') : null,
        agreement_accepted: true
      };

      const { error: insertError } = await supabase
        .from('quote_requests')
        .insert([payload]);

      if (insertError) {
        console.error('Supabase quote insertion error:', insertError);
        // Expose actual Supabase error code, message, hint and details during testing
        const errorParts = [
          insertError.code ? `[Code: ${insertError.code}]` : '',
          insertError.message || 'Database error occurred',
          insertError.details ? `Details: ${insertError.details}` : '',
          insertError.hint ? `Hint: ${insertError.hint}` : ''
        ].filter(Boolean);

        throw new Error(errorParts.join(' — '));
      }

      // PRIMARY BUSINESS CONVERSION: Only fire generate_lead after confirmed successful database storage
      trackQuoteSubmitted({
        service: service.trim(),
        budget: budget.trim() || undefined,
        source: utmAttribution.utm_source || 'organic_direct',
        campaign: utmAttribution.utm_campaign,
        medium: utmAttribution.utm_medium,
        content_category: 'Quote Request',
        eventId: `quote_${Date.now()}_${emailVal.replace(/[^a-z0-9]/gi, '').slice(0, 8)}`
      });

      // Capture confirmation snapshot
      setSubmittedData({
        fullName: nameVal,
        email: emailVal,
        phone: phoneVal,
        service: service.trim()
      });

      // Reset form fields immediately
      if (fullNameRef.current) fullNameRef.current.value = '';
      if (emailRef.current) emailRef.current.value = '';
      if (phoneRef.current) phoneRef.current.value = '';
      if (whatsappRef.current) whatsappRef.current.value = '';
      if (companyRef.current) companyRef.current.value = '';
      if (projectDescriptionRef.current) projectDescriptionRef.current.value = '';
      if (completionDateRef.current) completionDateRef.current.value = '';
      if (additionalRequirementsRef.current) additionalRequirementsRef.current.value = '';
      if (referenceUrlRef.current) referenceUrlRef.current.value = '';
      if (referenceFileNameRef.current) referenceFileNameRef.current.value = '';
      setService('');
      setBudget('');
      setAgreementAccepted(false);
      setShowReferenceFileName(false);
      setErrors({});

      // Display confirmation
      setFormSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error submitting quote request:', err);
      setSubmitError(err.message || 'Something went wrong while submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    if (fullNameRef.current) fullNameRef.current.value = '';
    if (emailRef.current) emailRef.current.value = '';
    if (phoneRef.current) phoneRef.current.value = '';
    if (whatsappRef.current) whatsappRef.current.value = '';
    if (companyRef.current) companyRef.current.value = '';
    if (projectDescriptionRef.current) projectDescriptionRef.current.value = '';
    if (completionDateRef.current) completionDateRef.current.value = '';
    if (additionalRequirementsRef.current) additionalRequirementsRef.current.value = '';
    if (referenceUrlRef.current) referenceUrlRef.current.value = '';
    if (referenceFileNameRef.current) referenceFileNameRef.current.value = '';
    setService('');
    setBudget('');
    setAgreementAccepted(false);
    setShowReferenceFileName(false);
    setErrors({});
    setSubmitError(null);
    setSubmittedData(null);
    setFormSubmitted(false);
  };

  return (
    <div className="pt-24 pb-24 min-h-screen relative overflow-hidden bg-[#FAFAF8]">
      {/* Ambient background glows matching IOE brand */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-teal-600/10 blur-[130px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute bottom-1/4 -right-[10%] w-[500px] h-[500px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-[#FFFFFF] border border-stone-200 rounded-full text-xs font-bold text-teal-700 uppercase tracking-widest mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Custom Project Scoping</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Request a <span className="bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Quote</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Tell us about your project and we&apos;ll review your requirements and get back to you with a suitable quotation.
          </p>

          {/* Quick Pillars */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
            <div className="p-3 bg-white border border-stone-200 rounded-xl shadow-xs flex items-center gap-3">
              <Clock className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Fast Turnaround</span>
                <span className="text-slate-500">Estimate within 24-48h</span>
              </div>
            </div>
            <div className="p-3 bg-white border border-stone-200 rounded-xl shadow-xs flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Clear Agreement</span>
                <span className="text-slate-500">Transparent terms</span>
              </div>
            </div>
            <div className="p-3 bg-white border border-stone-200 rounded-xl shadow-xs flex items-center gap-3">
              <Layers className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Tailored Scope</span>
                <span className="text-slate-500">Customized to your goal</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Success Confirmation Card */}
        {formSubmitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-[#FFFFFF] border border-stone-200 rounded-3xl p-8 sm:p-12 shadow-sm text-center max-w-2xl mx-auto"
          >
            <div className="w-16 h-16 bg-teal-50 border border-teal-200 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Quote Request Received
            </h2>

            <p className="text-base text-slate-600 mb-6 leading-relaxed">
              Thank you. Your quote request has been submitted successfully. IOE Creative Studio will review your requirements and contact you shortly.
            </p>

            <div className="p-5 bg-slate-50 border border-stone-200 rounded-2xl text-left space-y-2 mb-8 text-sm text-slate-700">
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-slate-500">Client:</span>
                <span className="font-bold text-slate-900">{submittedData?.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-slate-500">Service:</span>
                <span className="font-bold text-teal-700">{submittedData?.service}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-800">{submittedData?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-medium text-slate-800">{submittedData?.phone}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold rounded-full hover:shadow-[0_8px_20px_rgba(13,148,136,0.2)] transition-all text-sm text-center"
              >
                Return to Homepage
              </Link>
              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-stone-200 text-slate-700 font-semibold rounded-full hover:bg-stone-50 transition-all text-sm cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          </motion.div>
        ) : (
          /* Main Quote Form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[#FFFFFF] border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-sm"
          >
            {submitError && (
              <div className="mb-8 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm break-words flex-1">
                  <p className="font-bold mb-1">Submission Error</p>
                  <p className="font-mono text-xs bg-white/70 p-2.5 rounded-lg border border-rose-200/60 leading-relaxed">{submitError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-10">
              
              {/* Part 1: Client Information */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-200">
                  <User className="w-5 h-5 text-teal-600" />
                  <h2 className="text-lg font-bold text-slate-900">1. Client Information</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="fullName"
                      ref={fullNameRef}
                      defaultValue=""
                      type="text"
                      onChange={() => clearError('fullName')}
                      placeholder="e.g. Alexandra Smith"
                      className={`w-full px-4 py-3 bg-stone-50 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-sm ${
                        errors.fullName ? 'border-rose-400 input-error ring-1 ring-rose-300' : 'border-stone-200'
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">{errors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="email"
                      ref={emailRef}
                      defaultValue=""
                      type="email"
                      onChange={() => clearError('email')}
                      placeholder="e.g. alexandra@example.com"
                      className={`w-full px-4 py-3 bg-stone-50 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-sm ${
                        errors.email ? 'border-rose-400 input-error ring-1 ring-rose-300' : 'border-stone-200'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="phone"
                      ref={phoneRef}
                      defaultValue=""
                      type="tel"
                      onChange={() => clearError('phone')}
                      placeholder="e.g. +234 900 000 0000"
                      className={`w-full px-4 py-3 bg-stone-50 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-sm ${
                        errors.phone ? 'border-rose-400 input-error ring-1 ring-rose-300' : 'border-stone-200'
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">{errors.phone}</p>
                    )}
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label htmlFor="whatsapp" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      WhatsApp Number <span className="text-slate-400 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      id="whatsapp"
                      ref={whatsappRef}
                      defaultValue=""
                      type="tel"
                      placeholder="e.g. +234 904 005 9278"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-sm"
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label htmlFor="company" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Company / Organization <span className="text-slate-400 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      id="company"
                      ref={companyRef}
                      defaultValue=""
                      type="text"
                      placeholder="e.g. Acme Ventures Ltd"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Part 2: Project Information */}
              <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-200">
                  <Layers className="w-5 h-5 text-teal-600" />
                  <h2 className="text-lg font-bold text-slate-900">2. Project Information</h2>
                </div>

                <div className="space-y-5">
                  {/* Service Required Dropdown */}
                  <div>
                    <label htmlFor="service" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Service Required <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="service"
                      value={service}
                      onChange={(e) => {
                        setService(e.target.value);
                        clearError('service');
                      }}
                      className={`w-full px-4 py-3 bg-stone-50 border rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-sm ${
                        errors.service ? 'border-rose-400 input-error ring-1 ring-rose-300' : 'border-stone-200'
                      }`}
                    >
                      <option value="">Select a service category...</option>
                      {availableServices.map((svcName) => (
                        <option key={svcName} value={svcName}>
                          {svcName}
                        </option>
                      ))}
                    </select>
                    {errors.service && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">{errors.service}</p>
                    )}
                  </div>

                  {/* Project Description */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label htmlFor="projectDescription" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Project Description <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">Be as descriptive as possible</span>
                    </div>
                    <textarea
                      id="projectDescription"
                      ref={projectDescriptionRef}
                      defaultValue=""
                      rows={5}
                      onChange={() => clearError('projectDescription')}
                      placeholder="Outline your project scope, target audience, core objectives, deliverables, and any specific ideas or requirements you have in mind..."
                      className={`w-full px-4 py-3 bg-stone-50 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-sm leading-relaxed ${
                        errors.projectDescription ? 'border-rose-400 input-error ring-1 ring-rose-300' : 'border-stone-200'
                      }`}
                    />
                    {errors.projectDescription && (
                      <p className="text-xs text-rose-600 mt-1 font-medium">{errors.projectDescription}</p>
                    )}
                  </div>

                  {/* Budget & Desired Completion Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Budget */}
                    <div>
                      <label htmlFor="budget" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Estimated Budget <span className="text-slate-400 font-normal lowercase">(optional)</span>
                      </label>
                      <select
                        id="budget"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-sm"
                      >
                        <option value="">Select an estimated budget range...</option>
                        {budgetRanges.map((range) => (
                          <option key={range} value={range}>
                            {range}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Desired Completion Date */}
                    <div>
                      <label htmlFor="completionDate" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Desired Completion Date <span className="text-slate-400 font-normal lowercase">(optional)</span>
                      </label>
                      <input
                        id="completionDate"
                        ref={completionDateRef}
                        defaultValue=""
                        type="date"
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* Additional Requirements */}
                  <div>
                    <label htmlFor="additionalRequirements" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Additional Requirements or Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
                    </label>
                    <textarea
                      id="additionalRequirements"
                      ref={additionalRequirementsRef}
                      defaultValue=""
                      rows={3}
                      placeholder="Special software, tech stack preferences, branding guidelines, specific aspect ratios, or milestone constraints..."
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-sm leading-relaxed"
                    />
                  </div>

                  {/* Reference Link / Asset URL */}
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="referenceUrl" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Reference File URL / Project Asset Link <span className="text-slate-400 font-normal lowercase">(optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <LinkIcon className="w-4 h-4" />
                        </div>
                        <input
                          id="referenceUrl"
                          ref={referenceUrlRef}
                          defaultValue=""
                          type="url"
                          onChange={(e) => {
                            const hasValue = Boolean(e.target.value.trim());
                            if (hasValue !== showReferenceFileName) {
                              setShowReferenceFileName(hasValue);
                            }
                          }}
                          placeholder="https://drive.google.com/... or Figma, Dropbox, OneDrive link"
                          className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-sm"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Attach links to design briefs, cloud folders, inspiration boards, or brand assets.
                      </p>
                    </div>

                    {showReferenceFileName && (
                      <div>
                        <label htmlFor="referenceFileName" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Reference Document / Asset Label <span className="text-slate-400 font-normal lowercase">(optional)</span>
                        </label>
                        <input
                          id="referenceFileName"
                          ref={referenceFileNameRef}
                          defaultValue=""
                          type="text"
                          placeholder="e.g. Brand Guidelines PDF or Figma Wireframes"
                          className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-colors text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Part 3: Agreement & Privacy Notice */}
              <div className="pt-4 border-t border-stone-200 space-y-4">
                <div className={`p-4 rounded-2xl border transition-colors ${
                  errors.agreementAccepted ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-stone-200'
                }`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreementAccepted}
                      onChange={(e) => {
                        setAgreementAccepted(e.target.checked);
                        clearError('agreementAccepted');
                      }}
                      className="mt-1 h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      I have read and agree to the{' '}
                      <Link 
                        to="/agreement" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:text-teal-800 font-bold underline inline-flex items-center gap-0.5"
                      >
                        IOE Creative Studio Client/Service Agreement
                      </Link>
                      .{' '}
                      <span className="text-slate-500">
                        We value your privacy. Details submitted are protected pursuant to our{' '}
                        <Link 
                           to="/privacy" 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="text-teal-600 hover:text-teal-800 font-medium underline"
                        >
                          Privacy Policy
                        </Link>.
                      </span>
                    </span>
                  </label>
                  {errors.agreementAccepted && (
                    <p className="text-xs text-rose-600 mt-2 font-medium pl-7">
                      {errors.agreementAccepted}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 px-8 rounded-full font-bold text-base text-white transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isSubmitting 
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                      : 'bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 hover:scale-[1.01] hover:shadow-[0_10px_25px_rgba(13,148,136,0.25)] cursor-pointer'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting Quote Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Quote Request</span>
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-slate-400 mt-3">
                  No online payment is required to request a quote. Our team will review your specifications and furnish an itemized proposal.
                </p>
              </div>

            </form>
          </motion.div>
        )}

      </div>
    </div>
  );
}
