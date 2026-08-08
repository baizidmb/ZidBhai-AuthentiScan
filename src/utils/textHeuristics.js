/**
 * High-Precision Text Authenticity & LLM Fingerprint Diagnostics Engine
 * Evaluates sentence burstiness variance, n-gram entropy, and exact LLM transition clichés.
 */

const LLM_PHRASE_PATTERNS = [
  { phrase: "in conclusion", weight: 3.5, desc: "Generic LLM concluding transition" },
  { phrase: "delve into", weight: 4.5, desc: "ChatGPT signature verb ('delve')" },
  { phrase: "testament to", weight: 3.8, desc: "Common LLM hyperbolic filler ('testament to')" },
  { phrase: "it's important to remember", weight: 4.0, desc: "ChatGPT disclaimer boilerplate" },
  { phrase: "it is important to note", weight: 4.0, desc: "LLM formal passive disclaimer" },
  { phrase: "plays a crucial role", weight: 3.5, desc: "Repetitive LLM functional phrase" },
  { phrase: "plays a vital role", weight: 3.5, desc: "Repetitive LLM functional phrase" },
  { phrase: "rich tapestry", weight: 5.0, desc: "Signature AI metaphor ('rich tapestry')" },
  { phrase: "beacon of", weight: 4.0, desc: "AI stylistic embellishment ('beacon of')" },
  { phrase: "furthermore", weight: 2.2, desc: "Standard AI paragraph transition" },
  { phrase: "moreover", weight: 2.2, desc: "Standard AI paragraph transition" },
  { phrase: "let's explore", weight: 3.0, desc: "Conversational AI prompt intro" },
  { phrase: "in summary", weight: 2.8, desc: "LLM structural conclusion" },
  { phrase: "ever-evolving landscape", weight: 5.0, desc: "Overused AI cliché ('ever-evolving landscape')" },
  { phrase: "multifaceted aspect", weight: 4.0, desc: "Abstract AI filler phrase" },
  { phrase: "serves as a", weight: 2.8, desc: "Formal LLM connector" },
  { phrase: "delving deeper", weight: 4.5, desc: "Signature AI transition ('delving deeper')" }
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

  return {
    score: stdDev < 3.8 ? 92 : stdDev > 7.0 ? 8 : 45,
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

  const totalChars = words.reduce((sum, w) => sum + w.length, 0);
  const avgWordLength = totalChars / words.length;

  return {
    score: uniqueRatio < 0.46 ? 85 : uniqueRatio > 0.64 ? 12 : 45,
    uniqueRatio: Math.round(uniqueRatio * 100),
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
      engine: 'ZidBhai Statistical Text Diagnostics Engine',
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

  let finalAiScore = 50;

  // 1. HARD CRITERIA: Multiple LLM Fingerprint Clichés Matched
  if (flagged.length >= 2) {
    finalAiScore = 96;
    const phraseList = flagged.map(f => `"${f.phrase}"`).slice(0, 4).join(', ');
    explanations.push(`Definite ChatGPT Match: Contains ${flagged.length} signature LLM transition tropes (${phraseList}).`);
  } else if (flagged.length === 1) {
    finalAiScore = 84;
    explanations.push(`Matched signature LLM transition trope: "${flagged[0].phrase}".`);
  } else {
    explanations.push('Zero generic LLM transition clichés found ("delve into", "rich tapestry", "testament to").');
  }

  // 2. BURSTINESS SENTENCE PACING DISCRIMINATOR
  if (burstiness.stdDev < 3.8) {
    if (finalAiScore < 84) finalAiScore = 88;
    explanations.push(`Robotic sentence length uniformity (stdDev: ${burstiness.stdDev}), matching ChatGPT token probability.`);
  } else if (burstiness.stdDev > 7.0) {
    if (flagged.length === 0) finalAiScore = 6; // 94% Human!
    explanations.push(`High sentence length burstiness (stdDev: ${burstiness.stdDev}), matching organic human author pacing.`);
  }

  // 3. VOCABULARY DIVERSITY
  if (perplexity.uniqueRatio < 48 && finalAiScore > 50) {
    explanations.push(`Repetitive vocabulary token distribution (${perplexity.uniqueRatio}% unique word ratio).`);
  } else if (perplexity.uniqueRatio > 62 && flagged.length === 0) {
    if (finalAiScore < 20) finalAiScore = 4; // 96% Human!
    explanations.push(`High vocabulary diversity (${perplexity.uniqueRatio}% unique words), characteristic of human writing.`);
  }

  const finalHumanScore = 100 - finalAiScore;

  return {
    aiScore: finalAiScore,
    humanScore: finalHumanScore,
    label: finalAiScore > 50 ? 'Likely AI-Generated Text' : 'Authentic Human-Written Text',
    engine: 'ZidBhai Statistical Text Diagnostics Engine',
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
