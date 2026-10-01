import React, { useState } from 'react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Eye,
  FileText,
  Database,
  Server,
  Scale,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Award,
  FileCheck,
  Printer,
  Download,
  Sparkles,
  Check,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';
import { LegalPolicy, LegalHighlight } from '../../types';
import { trackAgreementInteraction, trackCtaClick } from '../../lib/analytics';

interface LegalDocumentRendererProps {
  policy: LegalPolicy;
  isAgreement?: boolean;
}

// Map highlight icon names to Lucide icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  Lock,
  Eye,
  FileText,
  Database,
  Server,
  Scale,
  CheckCircle2,
  CheckCircle: CheckCircle2,
  ShieldAlert,
  Clock,
  Award,
  FileCheck,
  ShieldCheck: FileCheck,
  Sparkles,
};

export const LegalDocumentRenderer: React.FC<LegalDocumentRendererProps> = ({
  policy,
  isAgreement = false,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Safe file download handler for Client Agreement or any legal document
  const handleDownload = () => {
    try {
      const headerLine = '='.repeat(80);
      const subHeaderLine = '-'.repeat(80);
      
      const fileHeader = `${headerLine}\nIOE CREATIVE STUDIO — OFFICIAL LEGAL DOCUMENT\n${policy.title.toUpperCase()}\nEffective Date / Last Updated: ${policy.last_updated}\n${headerLine}\n\n`;
      
      const subtitleText = policy.subtitle ? `SUMMARY:\n${policy.subtitle}\n\n${subHeaderLine}\n\n` : '';
      
      const highlightsText = Array.isArray(policy.key_highlights) && policy.key_highlights.length > 0
        ? `KEY HIGHLIGHTS:\n` +
          policy.key_highlights
            .map((h, i) => `  ${i + 1}. ${h.title}: ${h.description}`)
            .join('\n') +
          `\n\n${subHeaderLine}\n\n`
        : '';
        
      const footerText = `\n\n${headerLine}\nIOE CREATIVE STUDIO\nRepresentative: Igiharuwe Olayinka Emmanuel\nRole: Creative Lead & Principal Engineer\nEmail: Igiharuwe7@gmail.com\nPhone: +234 704 649 4532 | WhatsApp: +234 904 005 9278\nWebsite: https://ioecreativestudio.com\n${headerLine}\n`;

      const fullContent = `${fileHeader}${subtitleText}${highlightsText}${policy.content}${footerText}`;

      const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `IOE-Creative-Studio-${policy.slug || 'agreement'}.txt`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      setDownloadSuccess(true);
      trackAgreementInteraction('download');
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Download execution failed:', err);
    }
  };

  // Helper to escape HTML characters in dynamic strings
  const escapeHtml = (str: string): string => {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Safe Print / Save as PDF handler
  const handlePrint = () => {
    try {
      trackAgreementInteraction('print');
      // 1. Detect if executing inside an iframe (like the Google AI Studio preview environment)
      let isInIframe = false;
      try {
        isInIframe = window.self !== window.top;
      } catch {
        isInIframe = true;
      }

      // If in a top-level standalone window (direct desktop or mobile browser access), use native print
      if (!isInIframe) {
        window.focus();
        window.print();
        return;
      }

      // 2. In sandboxed iframes without 'allow-modals', direct window.print() is silently blocked by Chromium.
      // We open a clean, standalone print window with the rendered document so the native browser print dialog opens immediately.
      const markdownEl = document.querySelector('.markdown-body');
      const renderedHtml = markdownEl ? markdownEl.innerHTML : null;

      const titleText = policy.title || 'Client / Service Agreement';
      const badgeText = policy.badge_text || 'Official Engagement Contract';
      const lastUpdated = policy.last_updated || new Date().toLocaleDateString();
      const subtitleText = policy.subtitle || '';

      const highlightsHtml = Array.isArray(policy.key_highlights) && policy.key_highlights.length > 0
        ? `<div class="highlights-grid">` +
          policy.key_highlights.map(h => `
            <div class="highlight-card">
              <div class="highlight-title">${escapeHtml(h.title)}</div>
              <div class="highlight-desc">${escapeHtml(h.description)}</div>
            </div>
          `).join('') +
          `</div>`
        : '';

      const contentHtml = renderedHtml || `<div style="white-space: pre-wrap;">${escapeHtml(policy.content)}</div>`;

      const printHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IOE Creative Studio — ${escapeHtml(titleText)}</title>
  <style>
    @media print {
      @page {
        margin: 1.5cm;
        size: auto;
      }
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 32px 24px;
      margin: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
    }
    .no-print {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 12px 18px;
      margin-bottom: 28px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .no-print-btn {
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      transition: all 0.2s;
    }
    .btn-print {
      background: #0d9488;
      color: #ffffff;
    }
    .btn-print:hover {
      background: #0f766e;
    }
    .btn-close {
      background: #ffffff;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .btn-close:hover {
      background: #f1f5f9;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .studio-name {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #0d9488;
      margin-bottom: 8px;
    }
    .doc-title {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 8px 0;
      line-height: 1.25;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0d9488;
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      padding: 3px 10px;
      border-radius: 9999px;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      color: #475569;
      margin: 8px 0 12px 0;
    }
    .meta {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
    }
    .highlights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    .highlight-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
    }
    .highlight-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .highlight-desc {
      font-size: 12px;
      color: #475569;
    }
    .doc-body {
      font-size: 13px;
      color: #1e293b;
      line-height: 1.65;
    }
    .doc-body h1, .doc-body h2, .doc-body h3, .doc-body h4 {
      color: #0f172a;
      page-break-after: avoid;
      break-after: avoid;
    }
    .doc-body h1 { font-size: 20px; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .doc-body h2 { font-size: 16px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
    .doc-body h3 { font-size: 14px; margin-top: 16px; margin-bottom: 8px; }
    .doc-body p { margin: 0 0 10px 0; }
    .doc-body ul, .doc-body ol { margin: 0 0 12px 0; padding-left: 20px; }
    .doc-body li { margin-bottom: 4px; }
    .doc-body blockquote { border-left: 3px solid #0d9488; padding-left: 12px; margin: 12px 0; color: #475569; font-style: italic; }
    .doc-body hr { border: none; border-top: 1px solid #e2e8f0; margin: 20px 0; }
    .footer-sign {
      margin-top: 32px;
      border-top: 2px solid #0f172a;
      padding-top: 16px;
      font-size: 11px;
      color: #64748b;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="no-print">
      <div style="font-size: 13px; color: #334155;">
        <strong>Print / Save PDF Mode</strong> &mdash; Select <em>Save as PDF</em> or choose your preferred printer.
      </div>
      <div style="display: flex; gap: 8px;">
        <button type="button" class="no-print-btn btn-print" onclick="window.focus(); window.print();">
          Open Print Dialog
        </button>
        <button type="button" class="no-print-btn btn-close" onclick="window.close();">
          Close Window
        </button>
      </div>
    </div>

    <div class="header">
      <div class="studio-name">IOE CREATIVE STUDIO</div>
      ${badgeText ? `<div class="badge">${escapeHtml(badgeText)}</div>` : ''}
      <h1 class="doc-title">${escapeHtml(titleText)}</h1>
      ${subtitleText ? `<p class="subtitle">${escapeHtml(subtitleText)}</p>` : ''}
      <div class="meta">Effective / Last Updated: ${escapeHtml(lastUpdated)}</div>
    </div>

    ${highlightsHtml}

    <div class="doc-body">
      ${contentHtml}
    </div>

    <div class="footer-sign">
      <div><strong>IOE CREATIVE STUDIO</strong> &bull; Creative Lead & Principal Engineer: Igiharuwe Olayinka Emmanuel</div>
      <div>Contact: Igiharuwe7@gmail.com &bull; +234 704 649 4532 / +234 904 005 9278</div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.error(e);
        }
      }, 300);
    });
  </script>
</body>
</html>`;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
          } catch (e) {
            console.warn('Popup print trigger:', e);
          }
        }, 350);
      } else {
        // Fallback if popup was blocked by browser
        window.focus();
        window.print();
      }
    } catch (err) {
      console.error('Print execution error:', err);
      try {
        window.focus();
        window.print();
      } catch (e) {
        console.error('Final fallback failed:', e);
      }
    }
  };

  // Choose icon for the category badge
  const HeaderIcon = isAgreement 
    ? FileCheck 
    : policy.slug === 'terms-of-service' 
    ? Scale 
    : Shield;

  return (
    <div id="legal-document-view" className="pt-24 pb-24 min-h-screen relative overflow-hidden bg-[#FAFAF8]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -right-[15%] w-[500px] h-[500px] bg-teal-600/10 blur-[140px] rounded-full pointer-events-none -z-10 print:hidden" />
      <div className="absolute bottom-1/3 -left-[15%] w-[500px] h-[500px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none -z-10 print:hidden" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          {policy.badge_text && (
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-[#FFFFFF] border border-stone-200 rounded-full text-xs font-bold text-teal-700 uppercase tracking-widest mb-6 shadow-sm">
              <HeaderIcon className="w-3.5 h-3.5 text-teal-600" />
              <span>{policy.badge_text}</span>
            </div>
          )}
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-4">
            {policy.title}
          </h1>
          
          {policy.subtitle && (
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {policy.subtitle}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md">
              Last Updated: {policy.last_updated}
            </span>

            {/* Action buttons (always enabled for agreement; also useful on any policy) */}
            {isAgreement && (
              <div className="flex items-center gap-2 print:hidden">
                <button
                  id="btn-download-agreement-top"
                  onClick={handleDownload}
                  type="button"
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-md transition-all cursor-pointer min-h-[36px] active:scale-95 ${
                    downloadSuccess
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-300'
                  }`}
                  title="Download Agreement Document"
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Downloaded!
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      Save / Download
                    </>
                  )}
                </button>

                <button
                  id="btn-print-agreement-top"
                  onClick={handlePrint}
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-stone-200 px-3 py-1.5 rounded-md transition-all cursor-pointer min-h-[36px] active:scale-95 shadow-2xs"
                  title="Print or Save PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  Print / Save PDF
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Key Highlights Grid */}
        {Array.isArray(policy.key_highlights) && policy.key_highlights.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid sm:grid-cols-2 gap-4 mb-16 print:hidden"
          >
            {policy.key_highlights.map((highlight: LegalHighlight, idx: number) => {
              const HighlightIcon = (highlight.icon && ICON_MAP[highlight.icon]) || FileText;

              return (
                <div 
                  key={idx}
                  className="p-6 bg-[#FFFFFF] border border-stone-200 rounded-2xl shadow-sm hover:border-teal-500/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-4">
                    <HighlightIcon className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mb-1">{highlight.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{highlight.description}</p>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Content Document */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#FFFFFF] border border-stone-200 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8 text-slate-700 leading-relaxed print:border-none print:shadow-none print:p-0"
        >
          <div className="markdown-body text-slate-700">
            <Markdown
              components={{
                h1: ({ ...props }) => (
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-10 mb-5 border-b border-stone-200 pb-3" {...props} />
                ),
                h2: ({ ...props }) => (
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-10 mb-4 flex items-center gap-2 border-b border-stone-100 pb-2" {...props} />
                ),
                h3: ({ ...props }) => (
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-8 mb-3" {...props} />
                ),
                h4: ({ ...props }) => (
                  <h4 className="text-base font-bold text-slate-900 mt-6 mb-2" {...props} />
                ),
                p: ({ ...props }) => (
                  <p className="text-slate-700 leading-relaxed mb-5" {...props} />
                ),
                ul: ({ ...props }) => (
                  <ul className="list-disc pl-6 mb-5 space-y-2 text-slate-700" {...props} />
                ),
                ol: ({ ...props }) => (
                  <ol className="list-decimal pl-6 mb-5 space-y-2 text-slate-700" {...props} />
                ),
                li: ({ ...props }) => (
                  <li className="leading-relaxed" {...props} />
                ),
                strong: ({ ...props }) => (
                  <strong className="font-bold text-slate-900" {...props} />
                ),
                hr: ({ ...props }) => (
                  <hr className="my-10 border-stone-200" {...props} />
                ),
                a: ({ ...props }) => (
                  <a className="text-teal-600 hover:text-teal-800 font-semibold underline transition-colors" {...props} />
                ),
                blockquote: ({ ...props }) => (
                  <blockquote className="border-l-4 border-teal-600 pl-4 py-2 italic bg-slate-50 rounded-r-xl my-6 text-slate-800" {...props} />
                ),
                table: ({ ...props }) => (
                  <div className="overflow-x-auto my-6 border border-stone-200 rounded-xl">
                    <table className="min-w-full divide-y divide-stone-200" {...props} />
                  </div>
                ),
                th: ({ ...props }) => (
                  <th className="bg-slate-50 px-4 py-2.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider" {...props} />
                ),
                td: ({ ...props }) => (
                  <td className="px-4 py-2.5 text-sm text-slate-700 border-t border-stone-200" {...props} />
                ),
                code: ({ ...props }) => (
                  <code className="bg-slate-100 text-slate-800 font-mono text-xs px-1.5 py-0.5 rounded" {...props} />
                ),
              }}
            >
              {policy.content}
            </Markdown>
          </div>

          {/* Bottom Actions Bar */}
          <div className="pt-8 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
            {isAgreement ? (
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button
                  id="btn-download-agreement-bottom"
                  onClick={handleDownload}
                  type="button"
                  className={`inline-flex justify-center items-center gap-2 px-6 py-3 font-bold rounded-full transition-all text-sm cursor-pointer shadow-sm min-h-[44px] w-full sm:w-auto ${
                    downloadSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-teal-600 to-blue-600 text-white hover:shadow-[0_8px_20px_rgba(13,148,136,0.25)] hover:opacity-95'
                  }`}
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      Agreement Downloaded!
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Save / Download Agreement
                    </>
                  )}
                </button>

                <button
                  id="btn-print-agreement-bottom"
                  onClick={handlePrint}
                  type="button"
                  className="inline-flex justify-center items-center gap-2 px-5 py-3 bg-white border border-stone-200 text-slate-700 font-semibold rounded-full hover:bg-stone-50 transition-all text-sm cursor-pointer min-h-[44px] w-full sm:w-auto active:scale-95 shadow-2xs"
                  title="Print or Save PDF"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  Print / Save PDF
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-download-policy-bottom"
                  onClick={handleDownload}
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-xs cursor-pointer min-h-[40px]"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  Download Copy (.txt)
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Link 
                id="btn-policy-contact-brief"
                to="/contact"
                onClick={() => trackCtaClick('Initiate Project Brief', 'agreement_page')}
                className="inline-flex justify-center items-center px-6 py-3 bg-white border border-stone-300 text-slate-800 font-semibold rounded-full hover:bg-stone-50 transition-all text-sm min-h-[44px]"
              >
                Initiate Project Brief
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};
