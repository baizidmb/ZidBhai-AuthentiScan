import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ShieldCheck, AlertTriangle, Cpu, CheckCircle2, Info } from 'lucide-react';

export default function ScoreGauge({ aiScore, humanScore, usedFallback, syntheticMetadataFound, label }) {
  const prevScoreRef = useRef(humanScore);

  // Trigger confetti for high human authenticity score (> 85%)
  useEffect(() => {
    if (humanScore >= 85 && (prevScoreRef.current < 85 || prevScoreRef.current === undefined)) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06B6D4', '#10B981', '#3B82F6', '#8B5CF6']
        });
      } catch (e) {
        // ignore if canvas-confetti fails
      }
    }
    prevScoreRef.current = humanScore;
  }, [humanScore]);

  // Determine dynamic colors & status text based on AI vs Human probability
  let theme = {
    ringColor: 'stroke-emerald-400',
    glowColor: 'drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
    icon: CheckCircle2,
    verdict: 'High Confidence Human',
    description: 'Natural camera sensor grain, organic pixel variance, and authentic metadata signature detected.'
  };

  if (syntheticMetadataFound) {
    theme = {
      ringColor: 'stroke-rose-500',
      glowColor: 'drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]',
      badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-500/50',
      icon: AlertTriangle,
      verdict: 'Synthetic Metadata Found',
      description: 'EXIF/XMP header audit matched known AI generator software footprints (DALL-E / Midjourney / SD).'
    };
  } else if (aiScore >= 65) {
    theme = {
      ringColor: 'stroke-rose-500',
      glowColor: 'drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]',
      badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
      icon: Cpu,
      verdict: 'Likely AI-Generated',
      description: 'High uniformity in sentence length, low perplexity, or deep neural vision model classification.'
    };
  } else if (aiScore >= 35) {
    theme = {
      ringColor: 'stroke-amber-400',
      glowColor: 'drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]',
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
      icon: AlertTriangle,
      verdict: 'Mixed / Uncertain Origin',
      description: 'Exhibits hybrid characteristics. May be human media processed with digital compression or filters.'
    };
  }

  // SVG Gauge calculations (fluid scaling with viewBox)
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (humanScore / 100) * circumference;

  const IconComponent = theme.icon;

  return (
    <div className="w-full flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl glass-panel relative overflow-hidden border border-slate-800 shadow-2xl">
      
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-violet-500/5 pointer-events-none" />

      {/* Fallback Mode Banner with truncate and flex wrapping to prevent center overlap glitch */}
      {usedFallback && (
        <div className="mb-4 max-w-full truncate px-3 py-1 text-xs whitespace-nowrap overflow-hidden flex items-center justify-center space-x-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 font-mono z-20">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">Local Heuristic Engine Active (API Offline/Rate-Limited)</span>
        </div>
      )}

      {/* Radial SVG Score Ring with explicit z-10 positioning */}
      <div className={`relative z-10 flex items-center justify-center my-2 ${theme.glowColor}`}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 max-w-full h-auto"
        >
          {/* Track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-slate-800/80 fill-none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`fill-none ${theme.ringColor} transition-all duration-1000 ease-out`}
          />
        </svg>

        {/* Center Text inside Gauge with explicit z-10 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
            {humanScore}%
          </span>
          <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
            Human Score
          </span>
        </div>
      </div>

      {/* Verdict Status Badge with relative z-10 */}
      <div className={`relative z-10 mt-4 px-3.5 py-2 rounded-xl border flex items-center justify-center space-x-2 font-semibold text-xs sm:text-sm shadow-md max-w-full text-center ${theme.badgeBg}`}>
        <IconComponent className="w-4 h-4 shrink-0" />
        <span className="truncate">{theme.verdict}</span>
      </div>

      {/* Probability Breakdown Bar */}
      <div className="w-full mt-6 space-y-2 relative z-10">
        <div className="flex justify-between text-[11px] sm:text-xs font-semibold gap-1">
          <span className="text-emerald-400 flex items-center gap-1 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 inline-block" />
            Human ({humanScore}%)
          </span>
          <span className="text-rose-400 flex items-center gap-1 truncate">
            AI ({aiScore}%)
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 inline-block" />
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden border border-slate-800 flex p-0.5">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-full transition-all duration-700"
            style={{ width: `${humanScore}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-violet-600 rounded-r-full transition-all duration-700"
            style={{ width: `${aiScore}%` }}
          />
        </div>
      </div>

      {/* Technical Summary */}
      <p className="text-xs text-slate-400 text-center mt-4 max-w-md relative z-10 leading-relaxed">
        {theme.description}
      </p>

    </div>
  );
}
