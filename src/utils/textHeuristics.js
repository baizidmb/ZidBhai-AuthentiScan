/**
 * Client-Side Heuristic Engine & Explanatory Diagnostic Generator for Text Authenticity
 * Evaluates Burstiness (sentence length variance across multi-sentence paragraphs), 
 * Perplexity/Entropy proxies, and LLM signature phrase density.
 */

// Common LLM fingerprint phrases with exact diagnostic descriptions
const LLM_PHRASE_PATTERNS = [
  { phrase: "in conclusion", weight: 2.5, desc: "Generic LLM concluding transition" },
  { phrase: "delve into", weight: 3.5, desc: "ChatGPT high-frequency vocabulary marker ('delve')" },
  { phrase: "testament to", weight: 3.0, desc: "Common LLM hyperbolic filler ('testament to')" },
  { phrase: "it's important to remember", weight: 3.0, desc: "ChatGPT warning boilerplate" },
  { phrase: "it is important to note", weight: 3.0, desc: "LLM formal passive disclaimer" },
  { phrase: "plays a crucial role", weight: 2.8, desc: "Repetitive LLM functional phrase" },
  { phrase: "plays a vital role", weight: 2.8, desc: "Repetitive LLM functional phrase" },
  { phrase: "rich tapestry", weight: 4.0, desc: "Signature AI metaphor ('rich tapestry')" },
  { phrase: "beacon of", weight: 3.5, desc: "AI stylistic embellishment" },
  { phrase: "furthermore", weight: 1.8, desc: "Standard AI paragraph transition" },
  { phrase: "moreover", weight: 1.8, desc: "Standard AI paragraph transition" },
  { phrase: "let's explore", weight: 2.2, desc: "Conversational AI intro prompt" },
  { phrase: "in summary", weight: 2.0, desc: "LLM structural conclusion" },
  { phrase: "ever-evolving landscape", weight: 4.0, desc: "Overused AI cliché" },
  { phrase: "multifaceted aspect", weight: 3.2, desc: "Abstract AI filler phrase" }
];

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
    return { score: 50, variance: 0, stdDev: 0, sentenceCount: sentenceLengths.length };
  }

  const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const variance = sentenceLengths.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / sentenceLengths.length;
  const stdDev = Math.sqrt(variance);

  // StdDev < 4.0 indicates robotic uniformity (high AI score)
  // StdDev > 8.0 indicates natural human sentence variation (low AI score)
  let burstinessAiScore = 50;
  if (stdDev < 4.0) {
    burstinessAiScore = Math.round(85 - (stdDev / 4.0) * 20);
  } else if (stdDev > 7.5) {
    burstinessAiScore = Math.round(Math.max(10, 40 - (stdDev - 7.5) * 4));
  } else {
    burstinessAiScore = Math.round(65 - ((stdDev - 4.0) / 3.5) * 25);
  }

  return {
    score: burstinessAiScore,
    variance: Math.round(variance * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    sentenceCount: sentenceLengths.length,
    meanLength: Math.round(mean * 10) / 10
  };
}

function calculatePerplexityProxy(paragraphs) {
  const allText = paragraphs.join(' ').toLowerCase();
  const words = allText.match(/\b[a-z']+\b/g) || [];

  if (words.length === 0) {
    return { score: 50, uniqueRatio: 0.5, avgWordLength: 5, totalWords: 0 };
  }

  const wordCounts = {};
  words.forEach(w => wordCounts[w] = (wordCounts[w] || 0) + 1);

  const uniqueWords = Object.keys(wordCounts).length;
  const uniqueRatio = uniqueWords / words.length;

  let entropy = 0;
  Object.values(wordCounts).forEach(count => {
    const p = count / words.length;
    entropy -= p * Math.log2(p);
  });

  const totalChars = words.reduce((sum, w) => sum + w.length, 0);
  const avgWordLength = totalChars / words.length;

  // High unique ratio & entropy = Human variability
  let perplexityAiScore = 50;
  if (uniqueRatio < 0.45) {
    perplexityAiScore = 75;
  } else if (uniqueRatio > 0.65) {
    perplexityAiScore = 20;
  } else {
    perplexityAiScore = Math.round(75 - ((uniqueRatio - 0.45) / 0.20) * 55);
  }

  return {
    score: perplexityAiScore,
    uniqueRatio: Math.round(uniqueRatio * 100),
    entropy: Math.round(entropy * 100) / 100,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    totalWords: words.length
  };
}

export function findFlaggedPhrases(text) {
  const lowerText = text.toLowerCase();
  const flagged = [];

  LLM_PHRASE_PATTERNS.forEach(({ phrase, weight, desc }) => {
    let pos = lowerText.indexOf(phrase);
    while (pos !== -1) {
      flagged.push({
        phrase: text.substring(pos, pos + phrase.length),
        startIndex: pos,
        endIndex: pos + phrase.length,
        weight,
        desc
      });
      pos = lowerText.indexOf(phrase, pos + phrase.length);
    }
  });

  return flagged;
}

export function analyzeTextHeuristics(text) {
  if (!text || text.trim().length === 0) {
    return {
      aiScore: 0,
      humanScore: 100,
      label: 'Empty Input',
      usedFallback: true,
      explanations: ['No text content provided.'],
      metrics: { wordCount: 0, sentenceCount: 0 }
    };
  }

  const rawParagraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
  const paragraphs = rawParagraphs.length > 0 ? rawParagraphs : [text.trim()];

  const burstiness = calculateBurstiness(paragraphs);
  const perplexity = calculatePerplexityProxy(paragraphs);
  const flagged = findFlaggedPhrases(text);
  const explanations = [];

  // Phrase Penalty
  const phrasePenalty = Math.min(flagged.reduce((sum, item) => sum + item.weight * 12, 0), 45);

  if (flagged.length > 0) {
    const phraseList = flagged.map(f => `"${f.phrase}"`).slice(0, 3).join(', ');
    explanations.push(`Detected ${flagged.length} signature LLM transition phrases (${phraseList}).`);
  } else {
    explanations.push('Zero generic LLM transition clichés found ("rich tapestry", "delve into", etc.).');
  }

  // Burstiness Explanation
  if (burstiness.stdDev < 4.0) {
    explanations.push(`Low sentence length variation (stdDev: ${burstiness.stdDev}), indicating unnatural, uniform sentence pacing typical of LLMs.`);
  } else if (burstiness.stdDev > 7.0) {
    explanations.push(`High burstiness sentence variation (stdDev: ${burstiness.stdDev}), characteristic of organic human writing.`);
  } else {
    explanations.push(`Moderate sentence length variance (stdDev: ${burstiness.stdDev}).`);
  }

  // Perplexity Explanation
  if (perplexity.uniqueRatio < 48) {
    explanations.push(`Repetitive vocabulary selection (${perplexity.uniqueRatio}% unique word ratio).`);
  } else if (perplexity.uniqueRatio > 62) {
    explanations.push(`High vocabulary diversity (${perplexity.uniqueRatio}% unique words), matching human expression.`);
  }

  // Calculate final score
  let rawAiScore = Math.round(burstiness.score * 0.40 + perplexity.score * 0.30 + phrasePenalty);

  // Short text moderation dampening
  const totalWords = perplexity.totalWords;
  if (totalWords < 25) {
    const confidence = totalWords / 25;
    rawAiScore = Math.round(rawAiScore * confidence + 50 * (1 - confidence));
    explanations.push('Short text input: score moderated toward neutral confidence due to sample size.');
  }

  const finalAiScore = Math.min(Math.max(rawAiScore, 5), 95);
  const finalHumanScore = 100 - finalAiScore;

  return {
    aiScore: finalAiScore,
    humanScore: finalHumanScore,
    label: finalAiScore > 50 ? 'Likely AI-Generated Text' : 'Likely Human-Written Text',
    usedFallback: true,
    flaggedPhrases: flagged,
    explanations,
    metrics: {
      wordCount: perplexity.totalWords,
      sentenceCount: burstiness.sentenceCount,
      avgWordLength: perplexity.avgWordLength,
      burstinessScore: 100 - burstiness.score,
      perplexityScore: 100 - perplexity.score,
      stdDev: burstiness.stdDev,
      uniqueRatio: perplexity.uniqueRatio,
    }
  };
}
