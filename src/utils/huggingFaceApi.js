/**
 * Hugging Face Serverless Inference Router for ZidBhai AuthentiScan
 * Format: https://router.huggingface.co/hf-inference/models/{MODEL_ID}
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
 * Text Classifier: Hello-SimpleAI/chatgpt-detector-roberta
 */
export async function analyzeTextWithHf(text) {
  const modelId = 'Hello-SimpleAI/chatgpt-detector-roberta';
  const routerUrl = `https://router.huggingface.co/hf-inference/models/${modelId}`;
  const userToken = getStoredApiKey();

  const headers = { 'Content-Type': 'application/json' };
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
  
  let aiScore = 50;
  if (Array.isArray(data) && data[0]) {
    const results = Array.isArray(data[0]) ? data[0] : data;
    const chatGptItem = results.find(r => r.label && (r.label.toLowerCase().includes('chatgpt') || r.label.toLowerCase().includes('fake') || r.label.toLowerCase().includes('ai')));
    const humanItem = results.find(r => r.label && (r.label.toLowerCase().includes('human') || r.label.toLowerCase().includes('real')));

    if (chatGptItem) {
      aiScore = Math.round(chatGptItem.score * 100);
    } else if (humanItem) {
      aiScore = Math.round((1 - humanItem.score) * 100);
    }
  }

  return {
    aiScore,
    humanScore: 100 - aiScore,
    label: aiScore > 50 ? 'AI-Generated Text' : 'Human-Written Text',
    usedFallback: false,
    raw: data,
  };
}

/**
 * Image Classifier: umm-maybe/AI-image-detector or Organika/sdxl-detector
 */
export async function analyzeImageWithHf(imageBlob) {
  // Primary model: umm-maybe/AI-image-detector
  const primaryModel = 'umm-maybe/AI-image-detector';
  const fallbackModel = 'Organika/sdxl-detector';
  
  const userToken = getStoredApiKey();
  const headers = {};
  if (userToken) {
    headers['Authorization'] = `Bearer ${userToken}`;
  }

  const tryQueryModel = async (modelId) => {
    const url = `https://router.huggingface.co/hf-inference/models/${modelId}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: imageBlob,
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    return await resp.json();
  };

  let data;
  try {
    data = await tryQueryModel(primaryModel);
  } catch (e1) {
    try {
      data = await tryQueryModel(fallbackModel);
    } catch (e2) {
      throw new Error('Hugging Face Inference endpoints unreachable or rate-limited.');
    }
  }

  let aiScore = 50;
  if (Array.isArray(data)) {
    const aiItem = data.find(r => r.label && (r.label.toLowerCase().includes('artificial') || r.label.toLowerCase().includes('fake') || r.label.toLowerCase().includes('ai') || r.label.toLowerCase().includes('sdxl') || r.label.toLowerCase().includes('generated')));
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
    label: aiScore > 50 ? 'AI-Generated Image' : 'Authentic Human Image',
    usedFallback: false,
    raw: data,
  };
}
