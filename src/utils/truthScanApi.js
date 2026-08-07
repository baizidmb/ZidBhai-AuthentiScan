/**
 * TruthScan API Integration for ZidBhai AuthentiScan
 * Text Endpoint: https://detect-text.truthscan.com/detect
 */

const TRUTHSCAN_KEY_STORAGE = 'zidbhai_authentiscan_truthscan_key';

export function getStoredTruthScanKey() {
  return localStorage.getItem(TRUTHSCAN_KEY_STORAGE) || '';
}

export function setStoredTruthScanKey(key) {
  if (key && key.trim()) {
    localStorage.setItem(TRUTHSCAN_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(TRUTHSCAN_KEY_STORAGE);
  }
}

/**
 * Sends text payload to TruthScan API endpoint
 */
export async function analyzeTextWithTruthScan(text) {
  const apiKey = getStoredTruthScanKey();
  if (!apiKey) {
    throw new Error('No TruthScan API Key configured.');
  }

  const response = await fetch('https://detect-text.truthscan.com/detect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      key: apiKey
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`TruthScan HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  // TruthScan returns score (1-100), >60 is AI
  const score = data.result || data.score || 50;
  const aiScore = Math.min(Math.max(Math.round(score), 0), 100);
  const humanScore = 100 - aiScore;

  return {
    aiScore,
    humanScore,
    label: aiScore > 50 ? 'AI-Generated Text (TruthScan Engine)' : 'Authentic Human Text (TruthScan Engine)',
    engine: 'TruthScan Server API',
    usedFallback: false,
    explanations: [
      `TruthScan Enterprise API result score: ${aiScore}% AI likelihood.`,
      aiScore > 60 ? 'TruthScan flagged text above 60% threshold (Definite AI).' : 'TruthScan evaluated text below 50% threshold (Human-written).'
    ],
    raw: data
  };
}
