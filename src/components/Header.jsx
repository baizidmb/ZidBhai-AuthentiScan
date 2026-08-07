import React from 'react';
import { ShieldCheck, Key, Code2, Zap } from 'lucide-react';
import { getStoredApiKey } from '../utils/huggingFaceApi';

export default function Header({ onOpenApiKeyModal, onOpenDeveloperModal }) {
  const hasCustomKey = Boolean(getStoredApiKey());

  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-violet-600 p-[1.5px] shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>ZidBhai</span>
                <span className="gradient-text">AuthentiScan</span>
              </h1>
              <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-mono tracking-wider font-semibold uppercase bg-slate-800/90 text-cyan-300 border border-slate-700/80 rounded-md">
                v2.5 Lab
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              AI & Media Authenticity Verification Engine
            </p>
          </div>
        </div>

        {/* Status Indicators & Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Pulsing Creator Pill */}
          <div 
            onClick={onOpenDeveloperModal}
            className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400/60 cursor-pointer transition-all duration-200 group shadow-[0_0_12px_rgba(6,182,212,0.1)]"
            title="Click to view creator info"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-300 group-hover:text-cyan-300 transition-colors">
              Engineered by <span className="font-semibold text-cyan-400">Shahidul Islam Baizid</span>
            </span>
          </div>

          {/* API Mode Indicator */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              hasCustomKey
                ? 'bg-violet-950/60 text-violet-300 border-violet-500/40 hover:bg-violet-900/60 shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                : 'bg-slate-900/80 text-cyan-400 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/80'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${hasCustomKey ? 'text-violet-400 animate-pulse' : 'text-cyan-400'}`} />
            <span className="hidden sm:inline">
              {hasCustomKey ? 'Custom HF Token Active' : 'Free API Mode'}
            </span>
            <Key className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* Developer Info Button */}
          <button
            onClick={onOpenDeveloperModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-slate-700/80 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Created by ZidBhai</span>
          </button>

        </div>

      </div>
    </header>
  );
}
