import { useParams, Navigate } from 'react-router-dom';
import { useLegalPolicy } from '../hooks/useLegalPolicy';
import { LegalDocumentRenderer } from '../components/legal/LegalDocumentRenderer';
import { PolicyUnavailable } from '../components/legal/PolicyUnavailable';

function LegalSkeleton() {
  return (
    <div className="pt-24 pb-24 min-h-[75vh] max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
      <div className="text-center mb-16 space-y-4">
        <div className="h-6 w-44 bg-slate-200 rounded-full mx-auto" />
        <div className="h-12 w-3/4 max-w-md bg-slate-200 rounded-2xl mx-auto" />
        <div className="h-5 w-2/3 max-w-lg bg-slate-200 rounded mx-auto" />
        <div className="h-4 w-36 bg-slate-200 rounded mx-auto" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-16">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-6 bg-white border border-stone-200 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200" />
            <div className="h-5 w-1/2 bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-12 space-y-6">
        <div className="h-7 w-1/3 bg-slate-200 rounded" />
        <div className="h-4 w-full bg-slate-200 rounded" />
        <div className="h-4 w-5/6 bg-slate-200 rounded" />
        <div className="h-4 w-4/6 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

export default function DynamicLegalPolicy() {
  const { slug } = useParams<{ slug: string }>();

  // If known standard slugs are accessed via /legal/..., redirect to their dedicated routes
  if (slug === 'privacy-policy') {
    return <Navigate to="/privacy" replace />;
  }
  if (slug === 'terms-of-service') {
    return <Navigate to="/terms" replace />;
  }
  if (slug === 'client-agreement') {
    return <Navigate to="/agreement" replace />;
  }

  const { policy, loading } = useLegalPolicy(slug || '');

  if (loading) {
    return <LegalSkeleton />;
  }

  if (!policy || !policy.is_published) {
    return <PolicyUnavailable slug={slug} title={slug ? slug.replace(/-/g, ' ') : undefined} />;
  }

  const isAgreement = slug?.includes('agreement') || policy.slug?.includes('agreement');

  return <LegalDocumentRenderer policy={policy} isAgreement={isAgreement} />;
}
