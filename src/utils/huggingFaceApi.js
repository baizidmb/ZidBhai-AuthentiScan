/**
 * Hugging Face Inference API Integration for ZidBhai AuthentiScan
 * Routing Format: https://router.huggingface.co/hf-inference/models/{MODEL_ID}
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
 * Sends text to Hello-SimpleAI/chatgpt-detector-roberta via HF Inference Router
 * Returns { score: number (0-100 AI prob), isAi: boolean, raw: any, usedFallback: false }
 * Or throws error for fallback engine
 */
export async function analyzeTextWithHf(text) {
  const modelId = 'Hello-SimpleAI/chatgpt-detector-roberta';
  const routerUrl = `https://router.huggingface.co/hf-inference/models/${modelId}`;
  const userToken = getStoredApiKey();

  const headers = {
    'Content-Type': 'application/json',
  };
  if (userToken) {
    headers['Authorization'] = `Bearer ${userToken}`;
  }

  const response = await fetch(routerUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ inputs: text.slice(0, 1500) }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HF API HTTP ${response.status}: ${errText || response.statusText}`);
  }

  const data = await response.json();
  
  // Format returns array of [{ label: 'ChatGPT'|'Human', score: 0.98 }, ...]
  let aiScore = 50;
  if (Array.isArray(data) && data[0]) {
    const results = Array.isArray(data[0]) ? data[0] : data;
    const chatGptItem = results.find(r => r.label && r.label.toLowerCase().includes('chatgpt') || r.label.toLowerCase().includes('fake') || r.label.toLowerCase().includes('ai'));
    const humanItem = results.find(r => r.label && r.label.toLowerCase().includes('human') || r.label.toLowerCase().includes('real'));

    if (chatGptItem) {
      aiScore = Math.round(chatGptItem.score * 100);
    } else if (humanItem) {
      aiScore = Math.round((1 - humanItem.score) * 100);
    }
  }

  return {
    aiScore,
    humanScore: 100 - aiScore,
    label: aiScore > 50 ? 'AI-Generated' : 'Human-Written',
    usedFallback: false,
    raw: data,
  };
}

/**
 * Sends image blob/file to umm-maybe/AI-image-detector via HF Inference Router
 * Returns { aiScore: number, humanScore: number, label: string, usedFallback: false }
 */
export async function analyzeImageWithHf(imageBlob) {
  const modelId = 'umm-maybe/AI-image-detector';
  const routerUrl = `https://router.huggingface.co/hf-inference/models/${modelId}`;
  const userToken = getStoredApiKey();

  const headers = {};
  if (userToken) {
    headers['Authorization'] = `Bearer ${userToken}`;
  }

  const response = await fetch(routerUrl, {
    method: 'POST',
    headers,
    body: imageBlob,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HF API HTTP ${response.status}: ${errText || response.statusText}`);
  }

  const data = await response.json();
  
  // Format: [{ label: 'artificial', score: 0.95 }, { label: 'human', score: 0.05 }]
  let aiScore = 50;
  if (Array.isArray(data)) {
    const aiItem = data.find(r => r.label && (r.label.toLowerCase().includes('artificial') || r.label.toLowerCase().includes('fake') || r.label.toLowerCase().includes('ai') || r.label.toLowerCase().includes('generated')));
    const humanItem = data.find(r => r.label && (r.label.toLowerCase().includes('human') || r.label.toLowerCase().includes('real')));

    if (aiItem) {
      aiScore = Math.round(aiItem.score * 100);
    } else if (humanItem) {
      aiScore = Math.round((1 - humanItem.score) * 100);
    }
  }

  return {
    aiScore,
    humanScore: 100 - aiScore,
    label: aiScore > 50 ? 'Likely AI-Generated Image' : 'Likely Authentic Image',
    usedFallback: false,
    raw: data,
  };
}
