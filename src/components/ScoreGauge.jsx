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
    description: 'Natural statistical variance, human phrasing signatures, and organic sentence flow detected.'
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
      description: 'High uniformity in sentence length, low perplexity, or deep neural model classification.'
    };
  } else if (aiScore >= 35) {
    theme = {
      ringColor: 'stroke-amber-400',
      glowColor: 'drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]',
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
      icon: AlertTriangle,
      verdict: 'Mixed / Uncertain Origin',
      description: 'Exhibits hybrid characteristics. May be human text refined by AI grammar tools.'
    };
  }

  // SVG Gauge calculations
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (humanScore / 100) * circumference;

  const IconComponent = theme.icon;

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl glass-panel relative overflow-hidden border border-slate-800 shadow-2xl">
      
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-violet-500/5 pointer-events-none" />

      {/* Fallback Mode Banner */}
      {usedFallback && (
        <div className="mb-4 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-amber-500/30 text-[11px] text-amber-300 font-mono">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>Local Heuristic Engine Active (API Offline/Rate-Limited)</span>
        </div>
      )}

      {/* Radial SVG Score Ring */}
      <div className={`relative flex items-center justify-center my-2 ${theme.glowColor}`}>
        <svg width={size} height={size} className="transform -rotate-90">
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

        {/* Center Text inside Gauge */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
            {humanScore}%
          </span>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
            Human Score
          </span>
        </div>
      </div>

      {/* Verdict Status Badge */}
      <div className={`mt-4 px-4 py-2 rounded-xl border flex items-center space-x-2 font-semibold text-sm shadow-md ${theme.badgeBg}`}>
        <IconComponent className="w-4 h-4" />
        <span>{theme.verdict}</span>
      </div>

      {/* Probability Breakdown Bar */}
      <div className="w-full mt-6 space-y-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Human Authenticity ({humanScore}%)
          </span>
          <span className="text-rose-400 flex items-center gap-1">
            AI Probability ({aiScore}%)
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
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
      <p className="text-xs text-slate-400 text-center mt-4 max-w-md">
        {theme.description}
      </p>

    </div>
  );
}
