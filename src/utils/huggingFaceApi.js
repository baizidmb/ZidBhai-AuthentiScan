/**
 * Hugging Face Inference Integration for ZidBhai AuthentiScan
 * Routes via Backend Proxy (http://localhost:3001) to bypass CORS and API credentials restrictions.
 */

const LOCAL_STORAGE_KEY = 'zidbhai_authentiscan_hf_key';

export function getStoredApiKey() {
  return localStorage.getItem(LOCAL_STORAGE_KEY) || '';
}

export function setStoredApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem(LOCAL_STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}

/**
 * Text Classifier: Hello-SimpleAI/chatgpt-detector-roberta via Backend Proxy
 */
export async function analyzeTextWithHf(text) {
  const userToken = getStoredApiKey();
  const proxyUrl = 'http://localhost:3001/api/detect-text';

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      hfKey: userToken
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HF Proxy Error (${response.status}): ${errText}`);
  }

  return await response.json();
}

/**
 * Image Classifier: Ateeqq/ai-vs-human-image-detector via Backend Proxy
 */
export async function analyzeImageWithHf(imageBlob) {
  const userToken = getStoredApiKey();
  const proxyUrl = 'http://localhost:3001/api/detect-image';

  const formData = new FormData();
  formData.append('image', imageBlob);

  const headers = {};
  if (userToken) {
    headers['x-hf-token'] = userToken;
  }

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HF Image Proxy Error (${response.status}): ${errText}`);
  }

  return await response.json();
}
