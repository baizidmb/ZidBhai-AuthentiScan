import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ShieldCheck, AlertTriangle, Cpu, CheckCircle2, Server, Sparkles } from 'lucide-react';

export default function ScoreGauge({ aiScore, humanScore, usedFallback, syntheticMetadataFound, label, engine = 'ZidBhai Multi-Feature Spectrum Engine', explanations = [] }) {
  const prevScoreRef = useRef(humanScore);

  const isAiDominant = aiScore >= 50 || syntheticMetadataFound;
  const primaryDisplayScore = isAiDominant ? aiScore : humanScore;
  const primaryDisplayLabel = isAiDominant ? 'AI Generated' : 'Human Authentic';

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

  let theme = {
    ringColor: 'stroke-emerald-400',
    glowColor: 'drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
    textColor: 'text-emerald-400',
    icon: CheckCircle2,
    verdict: 'Authentic Human Origin',
    description: 'Exhibits organic variance, natural spatial noise spectrum, and authentic signature characteristics.'
  };

  if (syntheticMetadataFound) {
    theme = {
      ringColor: 'stroke-rose-500',
      glowColor: 'drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]',
      badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-500/50',
      textColor: 'text-rose-400',
      icon: AlertTriangle,
      verdict: 'Synthetic AI Metadata Match',
      description: 'Header audit matched explicit AI generator software tags (DALL-E / Midjourney / SDXL).'
    };
  } else if (aiScore >= 60) {
    theme = {
      ringColor: 'stroke-rose-500',
      glowColor: 'drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]',
      badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
      textColor: 'text-rose-400',
      icon: Cpu,
      verdict: 'Likely AI-Generated',
      description: 'High spatial smoothness, uniform sentence length, or neural model classification.'
    };
  } else if (aiScore >= 40) {
    theme = {
      ringColor: 'stroke-amber-400',
      glowColor: 'drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]',
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
      textColor: 'text-amber-400',
      icon: AlertTriangle,
      verdict: 'Mixed / Hybrid Origin',
      description: 'Exhibits hybrid characteristics. May be human content edited with digital enhancement tools.'
    };
  }

  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillPercentage = isAiDominant ? aiScore : humanScore;
  const strokeDashoffset = circumference - (fillPercentage / 100) * circumference;

  const IconComponent = theme.icon;

  return (
    <div className="w-full flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl glass-panel relative overflow-hidden border border-slate-800 shadow-2xl space-y-4">
      
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-violet-500/5 pointer-events-none" />

      {/* Active Engine Name Badge */}
      <div className="max-w-full truncate px-3 py-1 text-[11px] whitespace-nowrap overflow-hidden flex items-center justify-center space-x-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 font-mono z-20 shadow-sm">
        <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="truncate">Active Engine: <strong>{engine}</strong></span>
      </div>

      {/* Radial SVG Score Ring displaying Dominant Score */}
      <div className={`relative z-10 flex items-center justify-center ${theme.glowColor}`}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 max-w-full h-auto"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-slate-800/80 fill-none"
          />
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

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 p-2">
          <span className={`text-3xl sm:text-4xl font-black tracking-tight font-mono ${theme.textColor}`}>
            {primaryDisplayScore}%
          </span>
          <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-slate-200 mt-0.5">
            {primaryDisplayLabel}
          </span>
        </div>
      </div>

      {/* Verdict Status Badge */}
      <div className={`relative z-10 px-4 py-2 rounded-xl border flex items-center justify-center space-x-2 font-semibold text-xs sm:text-sm shadow-md max-w-full text-center ${theme.badgeBg}`}>
        <IconComponent className="w-4 h-4 shrink-0" />
        <span className="truncate">{label || theme.verdict}</span>
      </div>

      {/* Probability Bar */}
      <div className="w-full space-y-1.5 relative z-10">
        <div className="flex justify-between text-[11px] font-semibold">
          <span className="text-rose-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
            AI Probability ({aiScore}%)
          </span>
          <span className="text-emerald-400 flex items-center gap-1">
            Human ({humanScore}%)
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800 flex p-0.5">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-violet-600 rounded-l-full transition-all duration-700"
            style={{ width: `${aiScore}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-r-full transition-all duration-700"
            style={{ width: `${humanScore}%` }}
          />
        </div>
      </div>

      {/* Itemized Explanations Box */}
      {explanations && explanations.length > 0 && (
        <div className="w-full pt-3 border-t border-slate-800/80 relative z-10 text-left space-y-2">
          <h4 className="text-xs font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Inspection Diagnostic Rationale
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {explanations.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
