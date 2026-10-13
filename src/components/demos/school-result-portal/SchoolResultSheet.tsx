import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Calendar, 
  User, 
  BookOpen, 
  Hash, 
  FileText,
  QrCode,
  GraduationCap,
  MessageSquare,
  ArrowRight,
  Sparkles,
  School,
  Lock,
  Users,
  Settings
} from 'lucide-react';
import { StudentResultReport } from './types';
import { trackEvent } from '../../../lib/analytics';

interface SchoolResultSheetProps {
  report: StudentResultReport;
  onCheckAnother: () => void;
}

export function SchoolResultSheet({ report, onCheckAnother }: SchoolResultSheetProps) {
  const [downloadNotice, setDownloadNotice] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const quoteUrl = `/request-quote?service=${encodeURIComponent('School Website and Online Result Portal')}&source=${encodeURIComponent('School Result Portal Demo')}&demo=${encodeURIComponent('School Result Portal')}`;
  const studioWhatsapp = '2349040059278';
  const whatsappMsg = `Hello IOE Creative Studio! I reviewed the student result report sheet on your School Result Portal Demo and I would like to get this system for my school.\n\nPlease share details on features, pricing, and onboarding timeline.`;
  const whatsappUrl = `https://wa.me/${studioWhatsapp}?text=${encodeURIComponent(whatsappMsg)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    setDownloadNotice(true);
    setTimeout(() => {
      setDownloadNotice(false);
      window.print();
    }, 800);
  };

  const getGradeBadgeClass = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
    if (grade.startsWith('B')) return 'bg-blue-50 text-blue-800 border-blue-300 font-bold';
    if (grade.startsWith('C')) return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
    if (grade.startsWith('D') || grade.startsWith('E')) return 'bg-stone-50 text-stone-700 border-stone-300';
    return 'bg-red-50 text-red-800 border-red-300 font-bold';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar (hidden when printing) */}
      <div className="print:hidden bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCheckAnother}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>CHECK ANOTHER RESULT</span>
        </button>

        <div className="w-full sm:w-auto flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT RESULT</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD RESULT</span>
          </button>
        </div>
      </div>

      {/* Top Proprietor Call to Action Banner on Result Screen */}
      <div className="print:hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-blue-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <School className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">
                School Proprietor CTA
              </span>
              <span className="text-[9px] bg-blue-800 px-1.5 py-0.5 rounded text-blue-100 font-bold">
                Customized Setup
              </span>
            </div>
            <strong className="text-sm sm:text-base font-extrabold text-white block">
              Get This System for Your School
            </strong>
            <span className="text-xs text-blue-100 hidden sm:inline">
              IOE Creative Studio configures this secure result checking and printable A4 report workflow for your school.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Link
            to={quoteUrl}
            className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl text-center shadow-sm transition-all"
          >
            Request a Quote
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('whatsapp_click', { channel: 'whatsapp', source: 'School Result Sheet Top CTA' })}
            className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl text-center shadow-sm transition-all flex items-center justify-center gap-1"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Download/Print Feedback Toast */}
      {downloadNotice && (
        <div className="print:hidden p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs sm:text-sm flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Preparing high-resolution PDF print preview. Select "Save as PDF" in your print window.</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OFFICIAL NIGERIAN PRIVATE SCHOOL RESULT REPORT SHEET (Printable Container) */}
      {/* ========================================================================= */}
      <div 
        ref={printAreaRef}
        id="official-school-result-sheet"
        className="bg-white rounded-3xl border-2 border-stone-300/80 print:border-none print:shadow-none shadow-2xl p-4 sm:p-8 md:p-10 relative overflow-hidden text-slate-900"
      >
        {/* Safe Sandbox / Fictional Demonstration Watermark Banner */}
        <div className="print:hidden mb-4 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-900 text-[11px] font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>FICTIONAL DEMONSTRATION RECORD:</strong> Student Daniel Adekunle (GIA/2026/001) and scores are test sample data. Safe demonstration environment — cannot expose real student data or modify institutional records.
            </span>
          </div>
        </div>

        {/* Subtle Decorative Background Watermark Crest */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
          <GraduationCap className="w-96 h-96 text-blue-900" />
        </div>

        {/* 1. Official School Header */}
        <div className="relative border-b-2 border-blue-900 pb-6 mb-6 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-3">
            {/* School Crest / Logo */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-800 text-amber-300 flex items-center justify-center border-2 border-amber-400 shadow-md shrink-0">
              <GraduationCap className="w-12 h-12" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-blue-950 tracking-tight uppercase leading-tight">
                {report.school.name}
              </h1>
              <div className="text-xs sm:text-sm font-bold text-purple-900 tracking-wider uppercase mt-0.5">
                Motto: {report.school.motto}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-600 mt-1 max-w-lg mx-auto">
                {report.school.address} · Tel: {report.school.phone} · Web: {report.school.website}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
            <span className="px-4 py-1 rounded-full bg-blue-900 text-white font-extrabold text-xs uppercase tracking-wider">
              Student Result Report
            </span>
            <span className="text-xs font-bold text-slate-700 bg-stone-100 px-3 py-1 rounded-full">
              Session: {report.session}
            </span>
            <span className="text-xs font-bold text-slate-700 bg-stone-100 px-3 py-1 rounded-full">
              Term: {report.term}
            </span>
          </div>
        </div>

        {/* 2. Student Identification Grid */}
        <div className="bg-stone-50/90 border border-stone-200 rounded-2xl p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Student Photo Placeholder */}
            <div className="w-20 h-24 sm:w-24 sm:h-28 bg-stone-200 rounded-xl border border-stone-300 flex flex-col items-center justify-center text-slate-400 shrink-0 shadow-inner">
              <User className="w-10 h-10 mb-1" />
              <span className="text-[9px] uppercase font-bold text-slate-500">Student Photo</span>
            </div>

            {/* Student Information Fields */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Student Name:</span>
                <strong className="text-sm font-extrabold text-slate-900 block">
                  {report.student.fullName}
                </strong>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Registration No:</span>
                <strong className="text-sm font-mono font-extrabold text-blue-700 block">
                  {report.student.registrationNumber}
                </strong>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Class:</span>
                <strong className="text-sm font-extrabold text-slate-900 block">
                  {report.student.className} {report.student.classArm ? `(${report.student.classArm})` : ''}
                </strong>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Academic Session:</span>
                <span className="font-semibold text-slate-800">{report.session}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Academic Term:</span>
                <span className="font-semibold text-slate-800">{report.term}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Gender:</span>
                <span className="font-semibold text-slate-800">{report.student.gender}</span>
              </div>

              {report.student.house && (
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">House:</span>
                  <span className="font-semibold text-slate-800">{report.student.house}</span>
                </div>
              )}

              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Class Population:</span>
                <span className="font-semibold text-slate-800">{report.totalStudentsInClass} Students</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Verification Status:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Authenticated & Published
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Results Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-left border-collapse border border-stone-300 text-xs sm:text-sm min-w-[560px]">
            <thead>
              <tr className="bg-blue-900 text-white text-[11px] sm:text-xs uppercase tracking-wider font-bold">
                <th className="py-3 px-3 sm:px-4 border border-blue-800 text-left">Subject</th>
                <th className="py-3 px-2 sm:px-3 border border-blue-800 text-center">CA (30)</th>
                <th className="py-3 px-2 sm:px-3 border border-blue-800 text-center">Exam (70)</th>
                <th className="py-3 px-2 sm:px-3 border border-blue-800 text-center">Total (100)</th>
                <th className="py-3 px-2 sm:px-3 border border-blue-800 text-center">Grade</th>
                <th className="py-3 px-3 sm:px-4 border border-blue-800 text-left">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-medium">
              {report.scores.map((row, idx) => (
                <tr 
                  key={row.id} 
                  className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50/30' : 'bg-stone-50/70 hover:bg-blue-50/30'}
                >
                  <td className="py-2.5 px-3 sm:px-4 border border-stone-200 font-semibold text-slate-900">
                    {row.subjectName}
                  </td>
                  <td className="py-2.5 px-2 sm:px-3 border border-stone-200 text-center font-mono text-slate-700">
                    {row.caScore}
                  </td>
                  <td className="py-2.5 px-2 sm:px-3 border border-stone-200 text-center font-mono text-slate-700">
                    {row.examScore}
                  </td>
                  <td className="py-2.5 px-2 sm:px-3 border border-stone-200 text-center font-mono font-extrabold text-blue-900 bg-blue-50/20">
                    {row.totalScore}
                  </td>
                  <td className="py-2.5 px-2 sm:px-3 border border-stone-200 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs border ${getGradeBadgeClass(row.grade)}`}>
                      {row.grade}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 sm:px-4 border border-stone-200 text-slate-700">
                    {row.remark}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Table Summary Row */}
            <tfoot>
              <tr className="bg-stone-100 font-bold text-slate-900 text-xs sm:text-sm border-t-2 border-stone-300">
                <td className="py-3 px-3 sm:px-4 border border-stone-300 uppercase">
                  Total Aggregate Score
                </td>
                <td className="py-3 px-2 sm:px-3 border border-stone-300 text-center font-mono text-slate-600">
                  {report.scores.reduce((acc, s) => acc + s.caScore, 0)}
                </td>
                <td className="py-3 px-2 sm:px-3 border border-stone-300 text-center font-mono text-slate-600">
                  {report.scores.reduce((acc, s) => acc + s.examScore, 0)}
                </td>
                <td className="py-3 px-2 sm:px-3 border border-stone-300 text-center font-mono font-extrabold text-blue-900 bg-blue-100/50">
                  {report.overallTotalScore} / {report.obtainableScore}
                </td>
                <td colSpan={2} className="py-3 px-3 border border-stone-300 text-right text-xs text-slate-600">
                  Overall Average: <strong className="text-blue-900 text-sm font-bold">{report.overallAverage}%</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 4. Term Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-blue-50/80 border border-blue-200 p-3 sm:p-4 rounded-xl text-center">
            <span className="block text-[11px] font-bold uppercase text-blue-900 tracking-wider mb-1">
              Overall Average
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-950">
              {report.overallAverage}%
            </div>
            <span className="text-[10px] text-blue-700 font-medium">Terminal Performance</span>
          </div>

          <div className="bg-purple-50/80 border border-purple-200 p-3 sm:p-4 rounded-xl text-center">
            <span className="block text-[11px] font-bold uppercase text-purple-900 tracking-wider mb-1">
              Class Position
            </span>
            <div className="text-xl sm:text-2xl font-black text-purple-950">
              {report.classPosition}
            </div>
            <span className="text-[10px] text-purple-700 font-medium">Out of {report.totalStudentsInClass} Students</span>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200 p-3 sm:p-4 rounded-xl text-center">
            <span className="block text-[11px] font-bold uppercase text-emerald-900 tracking-wider mb-1">
              Number of Students
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-950">
              {report.totalStudentsInClass}
            </div>
            <span className="text-[10px] text-emerald-700 font-medium">{report.student.className} Population</span>
          </div>

          <div className="bg-amber-50/80 border border-amber-200 p-3 sm:p-4 rounded-xl text-center">
            <span className="block text-[11px] font-bold uppercase text-amber-900 tracking-wider mb-1">
              Attendance
            </span>
            <div className="text-lg sm:text-xl font-black text-amber-950">
              {report.attendance.daysPresent} / {report.attendance.daysSchoolOpened}
            </div>
            <span className="text-[10px] text-amber-700 font-medium">{report.attendance.percentage}% Present</span>
          </div>
        </div>

        {/* 5. Affective & Psychomotor Traits Grid */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 sm:p-5 mb-6">
          <h3 className="text-xs font-bold uppercase text-slate-800 tracking-wider mb-3">
            Behavioral & Affective Traits Rating (Scale 1–5)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
            {Object.entries(report.affectiveTraits).map(([trait, rating]) => (
              <div key={trait} className="bg-white p-2 rounded-lg border border-stone-200 text-center">
                <span className="block capitalize text-[11px] text-slate-600 mb-1">{trait}</span>
                <div className="font-extrabold text-blue-900 text-sm">{rating} / 5</div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Teacher and Principal Remarks */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Form Teacher's Remark */}
          <div className="border border-stone-200 rounded-2xl p-4 bg-white">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-blue-900 mb-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Teacher&apos;s Remark</span>
            </div>
            <blockquote className="text-xs sm:text-sm text-slate-800 italic leading-relaxed mb-4">
              &quot;{report.teacherRemark}&quot;
            </blockquote>
            <div className="border-t border-stone-100 pt-3 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">{report.teacherName}</span>
              <span className="text-[10px] text-slate-400 font-mono italic">Verified Signature</span>
            </div>
          </div>

          {/* Principal's Remark */}
          <div className="border border-stone-200 rounded-2xl p-4 bg-white relative">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-purple-900 mb-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Principal&apos;s Remark</span>
            </div>
            <blockquote className="text-xs sm:text-sm text-slate-800 italic leading-relaxed mb-4">
              &quot;{report.principalRemark}&quot;
            </blockquote>
            <div className="border-t border-stone-100 pt-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">{report.principalName}</span>
                <span className="text-[10px] text-slate-500">Head of Academics</span>
              </div>
              {/* Stamp Placeholder */}
              <div className="w-14 h-14 rounded-full border-2 border-purple-800 text-purple-900 flex flex-col items-center justify-center text-[8px] font-black uppercase text-center rotate-[-12deg] opacity-80 leading-tight">
                <span>OFFICIAL</span>
                <span>GIA STAMP</span>
                <span>APPROVED</span>
              </div>
            </div>
          </div>
        </div>

        {/* 7. Footer: Resumption Date & Digital Verification */}
        <div className="border-t-2 border-stone-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-[11px] text-slate-500 block">Date Issued:</span>
              <strong className="text-slate-900">{report.dateIssued}</strong>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Next Term Resumes:</span>
              <strong className="text-blue-900">{report.nextTermResumptionDate}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 p-1.5 bg-stone-100 rounded-lg border border-stone-200">
              <QrCode className="w-8 h-8 text-slate-800" />
              <div className="text-left">
                <span className="text-[10px] block font-mono text-slate-500 uppercase">Verification Hash:</span>
                <span className="text-[10px] font-mono font-bold text-slate-900">{report.verificationCode}</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 hidden md:inline">Scan QR or enter PIN at student portal to re-verify.</span>
          </div>
        </div>

        {/* 8. WAEC/NECO Standard Grading Legend */}
        <div className="mt-6 pt-3 border-t border-stone-200 text-[10px] text-slate-500">
          <span className="font-bold uppercase text-slate-700 mr-2">Grading System:</span>
          <span>A1: 75–100% (Distinction) · B2: 70–74% (Very Good) · B3: 65–69% (Good) · C4: 60–64% · C5: 55–59% · C6: 50–54% · D7: 45–49% · E8: 40–44% · F9: 0–39% (Fail)</span>
        </div>
      </div>

      {/* Bottom Action Repeat & Proprietor Conversion Call to Action */}
      <div className="print:hidden bg-stone-50 p-4 sm:p-6 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCheckAnother}
          className="w-full sm:w-auto text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Check Another Student Result
        </button>

        <div className="w-full sm:w-auto flex items-center justify-center gap-2">
          <Link
            to={quoteUrl}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Get This System for Your School</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2.5 bg-white border border-stone-300 hover:bg-stone-100 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>
    </div>
  );
}
