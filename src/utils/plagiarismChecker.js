/**
 * ZeroGPT-Style Plagiarism & Text Originality Inspection Engine
 * Analyzes phrase uniqueness, n-gram duplication index, and web similarity risk.
 */

export function analyzePlagiarismRisk(text) {
  if (!text || text.trim().length === 0) {
    return {
      originalityScore: 100,
      plagiarismRiskScore: 0,
      duplicatePhrases: [],
      metrics: { uniqueWordsRatio: 100, duplicateNgramsCount: 0 }
    };
  }

  const words = text.toLowerCase().match(/\b[a-z']+\b/g) || [];
  if (words.length < 10) {
    return {
      originalityScore: 95,
      plagiarismRiskScore: 5,
      duplicatePhrases: [],
      metrics: { uniqueWordsRatio: 100, duplicateNgramsCount: 0 }
    };
  }

  // 1. Calculate 4-gram repetition index
  const fourGrams = {};
  for (let i = 0; i <= words.length - 4; i++) {
    const ngram = `${words[i]} ${words[i+1]} ${words[i+2]} ${words[i+3]}`;
    fourGrams[ngram] = (fourGrams[ngram] || 0) + 1;
  }

  const duplicateFourGrams = Object.entries(fourGrams).filter(([_, count]) => count > 1);
  const duplicateNgramsCount = duplicateFourGrams.length;

  // 2. Calculate unique word ratio
  const uniqueWords = new Set(words).size;
  const uniqueWordsRatio = Math.round((uniqueWords / words.length) * 100);

  // 3. Known widespread web filler / cliché sequences
  const COMMON_CLICHE_PHRASES = [
    'in order to understand the importance of',
    'it is generally agreed that the main cause of',
    'plays a vital role in our daily lives',
    'in this article we will explore the',
    'a wide range of factors contributing to',
    'it is important to keep in mind that',
    'on the other hand it is worth noting that',
    'has become an increasingly popular topic',
    'in today\'s fast-paced digital world',
    'a fundamental aspect of modern society'
  ];

  const lowerText = text.toLowerCase();
  const matchedWebClichés = [];

  COMMON_CLICHE_PHRASES.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      matchedWebClichés.push(phrase);
    }
  });

  // Calculate plagiarism risk score
  let riskPoints = 0;
  
  if (duplicateNgramsCount > 0) {
    riskPoints += Math.min(duplicateNgramsCount * 12, 40);
  }
  if (uniqueWordsRatio < 55) {
    riskPoints += Math.round((55 - uniqueWordsRatio) * 1.5);
  }
  if (matchedWebClichés.length > 0) {
    riskPoints += matchedWebClichés.length * 15;
  }

  const plagiarismRiskScore = Math.min(Math.max(Math.round(riskPoints), 0), 95);
  const originalityScore = 100 - plagiarismRiskScore;

  const duplicatePhrases = [
    ...duplicateFourGrams.map(([phrase, count]) => ({ phrase, count, type: 'Internal Repetition' })),
    ...matchedWebClichés.map(phrase => ({ phrase, count: 1, type: 'Common Web Cliché' }))
  ];

  return {
    originalityScore,
    plagiarismRiskScore,
    label: plagiarismRiskScore > 35 ? 'High Plagiarism & Similarity Risk' : 'High Originality Content',
    duplicatePhrases,
    explanations: [
      `Originality Score: ${originalityScore}% unique content ratio.`,
      duplicateNgramsCount > 0 ? `Found ${duplicateNgramsCount} repeated 4-word n-gram sequences.` : 'Zero internal repeated 4-word n-grams found.',
      matchedWebClichés.length > 0 ? `Matched ${matchedWebClichés.length} common web boilerplate clichés.` : 'No unoriginal web boilerplate phrases detected.'
    ],
    metrics: {
      uniqueWordsRatio,
      duplicateNgramsCount,
      totalWords: words.length
    }
  };
}
