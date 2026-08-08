/**
 * TruthScan API Integration for ZidBhai AuthentiScan
 * Routes via Backend Proxy (http://localhost:3001/api/detect-text) to bypass CORS and API credentials restrictions.
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
 * Sends text payload to TruthScan API endpoint via Backend Proxy
 */
export async function analyzeTextWithTruthScan(text) {
  const apiKey = getStoredTruthScanKey();

  // Route via backend proxy to eliminate CORS blocking
  const proxyUrl = 'http://localhost:3001/api/detect-text';

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      truthScanKey: apiKey
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`TruthScan Proxy Error (${response.status}): ${errText}`);
  }

  return await response.json();
}
