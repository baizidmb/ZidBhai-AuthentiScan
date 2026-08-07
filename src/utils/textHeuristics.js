/**
 * Client-Side Heuristic Fallback Engine for Text Authenticity Analysis
 * Implements Burstiness (paragraph-grained sentence length variance), 
 * Perplexity/Entropy estimates, and LLM phrase pattern detection.
 */

// Common LLM fingerprint phrases
const LLM_PHRASE_PATTERNS = [
  { phrase: "in conclusion", weight: 2.5 },
  { phrase: "delve into", weight: 3.5 },
  { phrase: "testament to", weight: 3.0 },
  { phrase: "it's important to remember", weight: 3.0 },
  { phrase: "it is important to note", weight: 3.0 },
  { phrase: "plays a crucial role", weight: 2.8 },
  { phrase: "plays a vital role", weight: 2.8 },
  { phrase: "a key factor", weight: 2.0 },
  { phrase: "rich tapestry", weight: 4.0 },
  { phrase: "beacon of", weight: 3.5 },
  { phrase: "furthermore", weight: 1.8 },
  { phrase: "moreover", weight: 1.8 },
  { phrase: "let's explore", weight: 2.2 },
  { phrase: "in summary", weight: 2.0 },
  { phrase: "serves as a", weight: 2.0 },
  { phrase: "ever-evolving landscape", weight: 4.0 },
  { phrase: "multifaceted aspect", weight: 3.2 },
  { phrase: "it is worth noting", weight: 2.8 },
  { phrase: "delving deeper", weight: 3.5 },
  { phrase: "by understanding", weight: 1.8 },
  { phrase: "it is essential to", weight: 2.5 },
  { phrase: "a cornerstone of", weight: 2.8 }
];

/**
 * Calculates sentence length variance (Burstiness) across paragraphs.
 * Human writing has high burstiness (mix of short punchy & long complex sentences).
 * AI text tends to be uniform (low variance).
 */
function calculateBurstiness(paragraphs) {
  let sentenceLengths = [];

  paragraphs.forEach(paragraph => {
    const sentences = paragraph.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    sentences.forEach(s => {
      const words = s.split(/\s+/).filter(w => w.length > 0);
      if (words.length > 0) {
        sentenceLengths.push(words.length);
      }
    });
  });

  if (sentenceLengths.length < 2) {
    return { score: 50, variance: 0, stdDev: 0 };
  }

  const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const variance = sentenceLengths.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / sentenceLengths.length;
  const stdDev = Math.sqrt(variance);

  // Standardized burstiness score (High variance = Human writing, Low variance = AI uniformity)
  // Low stdDev (< 4) -> High AI probability. High stdDev (> 9) -> High Human probability.
  const normVariance = Math.min(Math.max(stdDev, 2), 15);
  // Map normVariance 2..15 to AI probability 85..15
  const burstinessAiScore = Math.round(100 - ((normVariance - 2) / 13) * 70);

  return {
    score: burstinessAiScore,
    variance: Math.round(variance * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    sentenceCount: sentenceLengths.length,
    meanLength: Math.round(mean * 10) / 10
  };
}

/**
 * Calculates Perplexity / Vocabulary Entropy proxy across multi-sentence paragraph blocks.
 * AI models prefer common vocabulary & smooth transitions (lower entropy).
 */
function calculatePerplexityProxy(paragraphs) {
  const allText = paragraphs.join(' ').toLowerCase();
  const words = allText.match(/\b[a-z']+\b/g) || [];

  if (words.length === 0) {
    return { score: 50, uniqueRatio: 0.5, avgWordLength: 5 };
  }

  const wordCounts = {};
  words.forEach(w => wordCounts[w] = (wordCounts[w] || 0) + 1);

  const uniqueWords = Object.keys(wordCounts).length;
  const uniqueRatio = uniqueWords / words.length;

  // Calculate Shannon entropy over word distribution
  let entropy = 0;
  Object.values(wordCounts).forEach(count => {
    const p = count / words.length;
    entropy -= p * Math.log2(p);
  });

  // Calculate average word length
  const totalChars = words.reduce((sum, w) => sum + w.length, 0);
  const avgWordLength = totalChars / words.length;

  // Higher unique ratio and higher entropy = human variation.
  // AI typically scores lower on unique word ratio for medium texts.
  const perplexityAiScore = Math.round(Math.min(Math.max((0.75 - uniqueRatio) * 120 + (6.5 - entropy) * 15, 10), 90));

  return {
    score: perplexityAiScore,
    uniqueRatio: Math.round(uniqueRatio * 100),
    entropy: Math.round(entropy * 100) / 100,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    totalWords: words.length
  };
}

/**
 * Finds LLM signature phrases and returns matches with offsets
 */
export function findFlaggedPhrases(text) {
  const lowerText = text.toLowerCase();
  const flagged = [];

  LLM_PHRASE_PATTERNS.forEach(({ phrase, weight }) => {
    let pos = lowerText.indexOf(phrase);
    while (pos !== -1) {
      flagged.push({
        phrase: text.substring(pos, pos + phrase.length),
        startIndex: pos,
        endIndex: pos + phrase.length,
        weight
      });
      pos = lowerText.indexOf(phrase, pos + phrase.length);
    }
  });

  return flagged;
}

/**
 * Analyzes text using local heuristic fallback.
 * Uses paragraph-level granularity to prevent single short sentence extreme skews.
 */
export function analyzeTextHeuristics(text) {
  if (!text || text.trim().length === 0) {
    return {
      aiScore: 0,
      humanScore: 100,
      label: 'Empty Input',
      usedFallback: true,
      metrics: { wordCount: 0, sentenceCount: 0 }
    };
  }

  // Split into paragraphs (grouping at least 3 paragraphs or multi-sentence blocks)
  const rawParagraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  const paragraphs = rawParagraphs.length > 0 ? rawParagraphs : [text.trim()];

  const burstiness = calculateBurstiness(paragraphs);
  const perplexity = calculatePerplexityProxy(paragraphs);
  const flagged = findFlaggedPhrases(text);

  // Pattern penalty
  const phrasePenalty = Math.min(flagged.reduce((sum, item) => sum + item.weight * 12, 0), 40);

  // Weighted Combination of heuristics
  let rawAiScore = Math.round(burstiness.score * 0.45 + perplexity.score * 0.35 + phrasePenalty);

  // Short text moderation dampening so 1 short sentence doesn't jump to 100% or 0%
  const totalWords = perplexity.totalWords;
  if (totalWords < 25) {
    // Dampen score towards neutral 50% for very short input
    const confidence = totalWords / 25;
    rawAiScore = Math.round(rawAiScore * confidence + 50 * (1 - confidence));
  }

  const finalAiScore = Math.min(Math.max(rawAiScore, 5), 95);
  const finalHumanScore = 100 - finalAiScore;

  return {
    aiScore: finalAiScore,
    humanScore: finalHumanScore,
    label: finalAiScore > 50 ? 'Likely AI-Generated Text' : 'Likely Human-Written Text',
    usedFallback: true,
    flaggedPhrases: flagged,
    metrics: {
      wordCount: perplexity.totalWords,
      sentenceCount: burstiness.sentenceCount,
      avgWordLength: perplexity.avgWordLength,
      burstinessScore: 100 - burstiness.score, // higher = more human burstiness
      perplexityScore: 100 - perplexity.score,
      stdDev: burstiness.stdDev,
      uniqueRatio: perplexity.uniqueRatio,
    }
  };
}
