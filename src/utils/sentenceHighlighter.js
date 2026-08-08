/**
 * ZeroGPT-Style Sentence-by-Sentence AI Highlighting Engine
 * Evaluates individual sentence probability and assigns color-coded risk levels:
 * - High AI Risk (> 70%): Deep Rose
 * - Moderate AI Risk (40% - 70%): Amber
 * - Human Authentic (< 40%): Emerald
 */

import { findFlaggedPhrases } from './textHeuristics';

export function analyzeSentenceLevelAI(text) {
  if (!text || text.trim().length === 0) {
    return { sentences: [], overallAiScore: 0 };
  }

  // Split into sentences preserving punctuation
  const rawSentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const flaggedPhrases = findFlaggedPhrases(text);

  const evaluatedSentences = rawSentences.map((sentence, index) => {
    const trimmed = sentence.trim();
    const words = trimmed.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    let sentenceAiScore = 35; // Neutral baseline

    // Check if sentence contains any flagged LLM phrases
    const matchedPhrases = flaggedPhrases.filter(f => 
      trimmed.toLowerCase().includes(f.phrase.toLowerCase())
    );

    if (matchedPhrases.length > 0) {
      sentenceAiScore += 45;
    }

    // Sentence length uniformity check (sentences between 14-22 words are very common in AI generation)
    if (wordCount >= 14 && wordCount <= 22) {
      sentenceAiScore += 18;
    } else if (wordCount < 8 || wordCount > 30) {
      sentenceAiScore -= 15; // Short punchy or very long complex sentences indicate human writing
    }

    // Unique word ratio inside sentence
    const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
    const uniqueRatio = words.length > 0 ? uniqueWords / words.length : 1;

    if (uniqueRatio < 0.8) {
      sentenceAiScore += 12;
    } else {
      sentenceAiScore -= 10;
    }

    const finalScore = Math.min(Math.max(Math.round(sentenceAiScore), 5), 98);

    let riskLevel = 'human';
    let colorClass = 'bg-emerald-500/20 text-emerald-200 border-b border-emerald-500/40';
    
    if (finalScore >= 70) {
      riskLevel = 'ai';
      colorClass = 'bg-rose-500/30 text-rose-100 border-b-2 border-rose-500 font-medium';
    } else if (finalScore >= 45) {
      riskLevel = 'mixed';
      colorClass = 'bg-amber-500/25 text-amber-200 border-b border-amber-500/50';
    }

    // Humanizer natural rephrasing suggestion for AI-flagged sentences
    let humanizedSuggestion = null;
    if (riskLevel === 'ai') {
      let rephrased = trimmed;
      matchedPhrases.forEach(mp => {
        if (mp.phrase.toLowerCase() === 'in conclusion') rephrased = rephrased.replace(/in conclusion/gi, 'Ultimately');
        if (mp.phrase.toLowerCase() === 'delve into') rephrased = rephrased.replace(/delve into/gi, 'explore');
        if (mp.phrase.toLowerCase() === 'rich tapestry') rephrased = rephrased.replace(/rich tapestry/gi, 'complex mix');
        if (mp.phrase.toLowerCase() === 'testament to') rephrased = rephrased.replace(/testament to/gi, 'proof of');
        if (mp.phrase.toLowerCase() === 'plays a crucial role') rephrased = rephrased.replace(/plays a crucial role/gi, 'is essential');
      });
      humanizedSuggestion = rephrased;
    }

    return {
      index,
      text: sentence,
      wordCount,
      score: finalScore,
      riskLevel,
      colorClass,
      matchedPhrases: matchedPhrases.map(m => m.phrase),
      humanizedSuggestion
    };
  });

  return evaluatedSentences;
}
