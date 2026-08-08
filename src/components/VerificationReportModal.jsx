import React from 'react';
import { X, ShieldCheck, Printer, Download, CheckCircle2, AlertTriangle, Cpu, Calendar, Hash, FileText } from 'lucide-react';

export default function VerificationReportModal({ isOpen, onClose, resultData, payloadType = 'text', payloadName = 'Document' }) {
  if (!isOpen || !resultData) return null;

  const verificationId = `ZB-AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    window.print();
  };

  const isHuman = resultData.humanScore >= 60;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden glass-panel">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Watermark Header */}
        <div className="border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-violet-600 p-[2px] shadow-lg shadow-cyan-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-cyan-400" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>ZidBhai</span>
                  <span className="gradient-text">AuthentiScan</span>
                </h2>
                <p className="text-xs text-cyan-400 font-mono">Official Authenticity Audit Certificate</p>
              </div>
            </div>

            <div className="text-right text-xs font-mono text-slate-400">
              <div className="flex items-center justify-end gap-1 text-slate-300">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold">{verificationId}</span>
              </div>
              <div className="flex items-center justify-end gap-1 mt-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{currentDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Main Grade Panel */}
        <div className={`p-6 rounded-2xl border mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isHuman
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
            : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
        }`}>
          <div>
            <span className="text-xs font-mono uppercase tracking-wider font-semibold opacity-80">
              Audit Verdict Classification
            </span>
            <h3 className="text-2xl font-black mt-1 flex items-center gap-2">
              {isHuman ? <CheckCircle2 className="w-7 h-7 text-emerald-400" /> : <AlertTriangle className="w-7 h-7 text-rose-400" />}
              <span>{resultData.label || (isHuman ? 'Authentic Human Content' : 'AI-Generated Content')}</span>
            </h3>
            <p className="text-xs opacity-90 mt-1">
              Verified by <strong className="text-white">{resultData.engine || 'ZidBhai Multi-Feature Spectrum Engine'}</strong>.
            </p>
          </div>

          <div className="text-center sm:text-right shrink-0">
            <span className="text-4xl font-extrabold font-mono text-white">
              {resultData.humanScore}%
            </span>
            <span className="block text-[10px] uppercase font-mono tracking-wider opacity-80 mt-0.5">
              Human Authenticity Score
            </span>
          </div>
        </div>

        {/* Inspection Details Summary */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-cyan-400" /> Inspection Diagnostic Rationale
          </h4>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2">
            {resultData.explanations?.map((exp, i) => (
              <p key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>{exp}</span>
              </p>
            ))}
          </div>
        </div>

        {/* Footer Credit & Action Buttons */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <p className="text-[11px] font-mono text-slate-400">
            Built & Maintained by <span className="text-cyan-300 font-semibold">Shahidul Islam Baizid (Baizid)</span>
          </p>

          <div className="flex items-center space-x-2 print:hidden">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF Report</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
