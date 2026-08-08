import React, { useState } from 'react';
import { Layers, Sparkles, AlertCircle, RotateCcw, CheckCircle2, Copy, FileText, AlertTriangle } from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import { analyzePlagiarismRisk } from '../utils/plagiarismChecker';

const SAMPLE_ORIGINAL_TEXT = `In our study of urban ecosystems in modern Tokyo, we observed an intriguing correlation between pocket parks and avian species diversity. Over fourteen months, field researchers recorded bird calls across forty-two micro-green spaces in Shibuya and Shinjuku. The data indicates that native flora density—rather than park square footage—was the primary driver of biodiversity retention.`;

const SAMPLE_PLAGIARIZED_TEXT = `In order to understand the importance of urban green spaces, it is generally agreed that the main cause of biodiversity loss is habitat fragmentation. On the other hand it is worth noting that pocket parks play a vital role in our daily lives. In today's fast-paced digital world, urban nature has become an increasingly popular topic among city planners. In order to understand the importance of environmental conservation, a wide range of factors contributing to green space planning must be considered.`;

export default function PlagiarismChecker() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleAnalyze = () => {
    if (!text || text.trim().length < 15) {
      setErrorMsg('Please enter or paste at least 15 characters of text to check plagiarism risk.');
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);

    setTimeout(() => {
      const data = analyzePlagiarismRisk(text);
      setResult(data);
      setIsAnalyzing(false);
    }, 400);
  };

  const handleLoadSample = (type) => {
    const sample = type === 'original' ? SAMPLE_ORIGINAL_TEXT : SAMPLE_PLAGIARIZED_TEXT;
    setText(sample);
    setResult(null);
    setErrorMsg(null);
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4">
          
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
            <div className="flex items-center space-x-2">
              <Copy className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Plagiarism & Originality Checker</h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleLoadSample('original')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/60 transition-colors min-h-[36px]"
              >
                + Original Sample
              </button>
              <button
                onClick={() => handleLoadSample('plagiarized')}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-semibold hover:bg-rose-900/60 transition-colors min-h-[36px]"
              >
                + Cliché Sample
              </button>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text here to inspect n-gram phrase repetition, unoriginal web boilerplate, and similarity risk score..."
            rows={8}
            className="w-full p-4 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-y leading-relaxed font-sans"
          />

          <div className="flex flex-wrap items-center justify-between pt-3 mt-2 text-xs text-slate-400 gap-2 border-t border-slate-800/80">
            <div className="flex items-center space-x-4">
              <span>Words: <strong className="text-slate-200">{text.trim() ? text.trim().split(/\s+/).length : 0}</strong></span>
              <span>Chars: <strong className="text-slate-200">{text.length}</strong></span>
            </div>

            <div className="flex items-center space-x-2">
              {text && (
                <button
                  onClick={handleClear}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 min-h-[40px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear
                </button>
              )}

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !text.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 disabled:opacity-50 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-1.5 min-h-[44px]"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Checking Plagiarism...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>Check Plagiarism Risk</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>

        {/* Flagged Unoriginal Phrases List */}
        {result && result.duplicatePhrases.length > 0 && (
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-xl space-y-2 text-xs">
            <h4 className="font-mono text-rose-400 font-bold flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> Flagged Duplications & Web Clichés ({result.duplicatePhrases.length})
            </h4>
            <ul className="space-y-1.5 text-slate-300">
              {result.duplicatePhrases.map((item, idx) => (
                <li key={idx} className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 flex justify-between items-center">
                  <span className="font-mono font-medium text-rose-200">"{item.phrase}"</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-rose-300 border border-rose-500/30">
                    {item.type} ({item.count}x)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Right Column (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        {result ? (
          <ScoreGauge
            aiScore={result.plagiarismRiskScore}
            humanScore={result.originalityScore}
            usedFallback={true}
            label={result.label}
            engine="ZeroGPT Plagiarism & Originality Risk Engine"
            explanations={result.explanations}
          />
        ) : (
          <div className="glass-panel rounded-2xl p-8 border border-slate-800/80 text-center flex flex-col items-center justify-center min-h-[380px] shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-cyan-400 shadow-inner">
              <Copy className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-white">Awaiting Text Input</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              Paste text to run n-gram duplicate sequence analysis and unoriginal web boilerplate detection.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
