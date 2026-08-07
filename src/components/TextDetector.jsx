import React, { useState } from 'react';
import { FileText, Sparkles, AlertCircle, RotateCcw, Layers, Cpu, Server } from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import { analyzeTextWithHf } from '../utils/huggingFaceApi';
import { analyzeTextWithTruthScan, getStoredTruthScanKey } from '../utils/truthScanApi';
import { analyzeTextHeuristics } from '../utils/textHeuristics';

const SAMPLE_HUMAN_TEXT = `The unexpected resurgence of analog film photography among Gen Z creators offers a compelling lens into modern digital fatigue. While smartphone cameras capture hyper-sharpened 48-megapixel images in milliseconds, younger photographers actively seek out tactile constraints: thirty-six exposures per roll, manual focusing rings, and the slow, deliberate chemistry of darkroom developers. Last summer, I spent three weeks interviewing street photographers in Tokyo's Shimokitazawa neighborhood. Every single artist mentioned how the physical wait time between pressing the shutter and receiving scans created a completely different emotional relationship with their imagery. It wasn't about seeking technical perfection—in fact, light leaks and subtle grain were praised as unique artistic signatures rather than errors.`;

const SAMPLE_AI_TEXT = `In conclusion, film photography plays a crucial role in modern visual culture. It is important to remember that analog mediums serve as a testament to artistic authenticity in an ever-evolving digital landscape. Delving into the multifaceted aspects of grain and light leaks, we find that tactile constraints offer a rich tapestry of creative expression. Furthermore, it is worth noting that Japan's urban photography scene remains a vibrant beacon of innovation. Moreover, by understanding the delicate balance between instant digital feedback and slow chemical processing, creators can unlock new dimensions of storytelling.`;

export default function TextDetector() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showHighlight, setShowHighlight] = useState(true);

  const handleAnalyze = async () => {
    if (!text || text.trim().length < 15) {
      setErrorMsg('Please enter or paste at least 15 characters of text to perform statistical verification.');
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);

    try {
      // 1. TruthScan Server Integration (if API key present)
      if (getStoredTruthScanKey()) {
        try {
          const truthResult = await analyzeTextWithTruthScan(text);
          const localMetrics = analyzeTextHeuristics(text);
          setResult({
            ...truthResult,
            flaggedPhrases: localMetrics.flaggedPhrases,
            metrics: localMetrics.metrics,
            explanations: [
              `TruthScan Enterprise API Detection: ${truthResult.aiScore}% AI score.`,
              ...localMetrics.explanations
            ]
          });
          return;
        } catch (tsErr) {
          console.warn('TruthScan API failed, falling back to Hugging Face / Heuristics:', tsErr.message);
        }
      }

      // 2. Primary Hugging Face RoBERTa
      try {
        const hfData = await analyzeTextWithHf(text);
        const localMetrics = analyzeTextHeuristics(text);
        setResult({
          ...hfData,
          flaggedPhrases: localMetrics.flaggedPhrases,
          metrics: localMetrics.metrics,
          explanations: [
            `RoBERTa Neural Model Result: ${hfData.aiScore}% AI probability.`,
            ...localMetrics.explanations
          ]
        });
      } catch (hfErr) {
        // 3. Multi-Factor Local Heuristic Engine
        console.warn('HF Text API rate-limited, running multi-factor heuristic engine:', hfErr.message);
        const fallbackResult = analyzeTextHeuristics(text);
        setResult(fallbackResult);
      }

    } catch (err) {
      setErrorMsg(`Text analysis error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLoadSample = (sampleType) => {
    const sample = sampleType === 'human' ? SAMPLE_HUMAN_TEXT : SAMPLE_AI_TEXT;
    setText(sample);
    setResult(null);
    setErrorMsg(null);
  };

  const handleClear = () => {
    setText('');
    setResult(null);
    setErrorMsg(null);
  };

  const renderHighlightedText = () => {
    if (!result || !result.flaggedPhrases || result.flaggedPhrases.length === 0) {
      return text;
    }

    let elements = [];
    let lastIndex = 0;
    const sortedPhrases = [...result.flaggedPhrases].sort((a, b) => a.startIndex - b.startIndex);

    sortedPhrases.forEach((item, idx) => {
      if (item.startIndex > lastIndex) {
        elements.push(text.substring(lastIndex, item.startIndex));
      }
      elements.push(
        <mark
          key={idx}
          className="bg-rose-500/30 text-rose-200 border-b-2 border-rose-500 px-1 py-0.5 rounded font-semibold transition-all hover:bg-rose-500/50"
          title={`Flagged LLM Phrase: "${item.phrase}" (${item.desc})`}
        >
          {text.substring(item.startIndex, item.endIndex)}
        </mark>
      );
      lastIndex = item.endIndex;
    });

    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return elements;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl relative">
          
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800/80 mb-3 gap-2">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Text Authenticity Inspector</h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleLoadSample('human')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/60 transition-colors min-h-[36px]"
              >
                + Human Sample
              </button>
              <button
                onClick={() => handleLoadSample('ai')}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-semibold hover:bg-rose-900/60 transition-colors min-h-[36px]"
              >
                + AI Sample
              </button>
            </div>
          </div>

          <div className="relative">
            {result && showHighlight && result.flaggedPhrases?.length > 0 ? (
              <div className="w-full min-h-[200px] max-h-[360px] overflow-y-auto p-4 rounded-xl glass-input text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-200 border border-slate-700/80">
                {renderHighlightedText()}
              </div>
            ) : (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or write article text, essay, or email to verify whether it was generated by ChatGPT, Claude, or a human author..."
                rows={8}
                className="w-full p-4 rounded-xl glass-input text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-y leading-relaxed font-sans"
              />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between pt-3 mt-2 text-xs text-slate-400 gap-2 border-t border-slate-800/80">
            <div className="flex items-center space-x-4">
              <span>Words: <strong className="text-slate-200">{text.trim() ? text.trim().split(/\s+/).length : 0}</strong></span>
              <span>Chars: <strong className="text-slate-200">{text.length}</strong></span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {text && (
                <button
                  onClick={handleClear}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 min-h-[40px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Clear
                </button>
              )}

              {result && result.flaggedPhrases?.length > 0 && (
                <button
                  onClick={() => setShowHighlight(!showHighlight)}
                  className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-1 font-semibold min-h-[40px] ${
                    showHighlight
                      ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {showHighlight ? 'Hide Highlights' : 'Show Highlights'}
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
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>Verify Authenticity</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>

        {result?.metrics && (
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" /> Statistical Diagnostics
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Burstiness Variance</span>
                <span className="text-base font-bold text-slate-100 font-mono">
                  {result.metrics.stdDev || 0} stdDev
                </span>
                <span className="text-[10px] text-cyan-400 block mt-0.5">Pacing variation</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Vocabulary Entropy</span>
                <span className="text-base font-bold text-slate-100 font-mono">
                  {result.metrics.uniqueRatio || 0}%
                </span>
                <span className="text-[10px] text-violet-400 block mt-0.5">Unique word ratio</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Avg Word Length</span>
                <span className="text-base font-bold text-slate-100 font-mono">
                  {result.metrics.avgWordLength || 0} chars
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Density score</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Flagged Phrases</span>
                <span className="text-base font-bold text-rose-400 font-mono">
                  {result.flaggedPhrases?.length || 0}
                </span>
                <span className="text-[10px] text-rose-300 block mt-0.5">LLM clichés</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Right Result Column (5 cols) */}
      <div className="lg:col-span-5">
        {result ? (
          <ScoreGauge
            aiScore={result.aiScore}
            humanScore={result.humanScore}
            usedFallback={result.usedFallback}
            label={result.label}
            explanations={result.explanations}
          />
        ) : (
          <div className="glass-panel rounded-2xl p-8 border border-slate-800/80 text-center flex flex-col items-center justify-center min-h-[380px] shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-cyan-400 shadow-inner">
              <Cpu className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-white">Awaiting Text Payload</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              Input content on the left to calculate TruthScan / RoBERTa neural probability and sentence burstiness with itemized rationale.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
