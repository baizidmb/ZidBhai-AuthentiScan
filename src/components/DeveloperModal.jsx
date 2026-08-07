import React from 'react';
import { X, Code, Sparkles, Cpu, Layers, ShieldCheck, Terminal } from 'lucide-react';

export default function DeveloperModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden glass-panel">
        
        {/* Glow corner background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Creator Header */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-violet-600 p-[2px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-400">
              Lead Architect & Developer
            </span>
            <h2 className="text-2xl font-extrabold text-white">Shahidul Islam Baizid</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Creator of <span className="text-cyan-300 font-semibold">ZidBhai AuthentiScan</span>
            </p>
          </div>
        </div>

        {/* Bio / Project Purpose */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 mb-6 text-sm text-slate-300 space-y-2">
          <p className="leading-relaxed">
            <strong className="text-white">ZidBhai AuthentiScan</strong> was designed and engineered by{' '}
            <span className="text-cyan-300 font-semibold">Shahidul Islam Baizid (Baizid)</span> to provide a 100% free, high-performance, privacy-respecting verification suite for digital text, image, and video content.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            By pairing Hugging Face’s serverless AI Inference pipeline with client-side statistical heuristics (Burstiness variance, Perplexity entropy proxies, EXIF metadata auditing, and offscreen canvas video sampling), the application delivers instant authenticity verification without requiring paid cloud infrastructure.
          </p>
        </div>

        {/* Tech Stack Grid */}
        <div className="mb-6">
          <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" /> Architectural Stack
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center space-x-2">
              <Code className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <p className="font-semibold text-slate-200">React 18 + Vite</p>
                <p className="text-[10px] text-slate-400">Frontend Core</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
              <div>
                <p className="font-semibold text-slate-200">Tailwind CSS v3</p>
                <p className="text-[10px] text-slate-400">Glassmorphism UI</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-slate-200">HF Inference API</p>
                <p className="text-[10px] text-slate-400">RoBERTa & Vision Models</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="font-semibold text-slate-200">ExifReader</p>
                <p className="text-[10px] text-slate-400">EXIF & C2PA Audit</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <p className="font-semibold text-slate-200">Canvas Keyframes</p>
                <p className="text-[10px] text-slate-400">Offscreen Video Sampler</p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <p className="font-semibold text-slate-200">Client Heuristics</p>
                <p className="text-[10px] text-slate-400">Burstiness & Entropy</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <span>Built with passion by</span>
            <span className="font-semibold text-cyan-300">Baizid</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-cyan-500/20"
          >
            Close Developer Info
          </button>
        </div>

      </div>
    </div>
  );
}
