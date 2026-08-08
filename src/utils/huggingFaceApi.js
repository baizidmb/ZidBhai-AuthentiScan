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
 * Text Model: Hello-SimpleAI/chatgpt-detector-roberta
 */
export async function analyzeTextWithHf(text) {
  const userToken = getStoredApiKey();
  if (!userToken) {
    throw new Error('HF_TOKEN_REQUIRED: Hugging Face Router requires an API token. Enter a free token in settings or use local spectrum analysis.');
  }

  const modelId = 'Hello-SimpleAI/chatgpt-detector-roberta';
  const routerUrl = `https://router.huggingface.co/hf-inference/models/${modelId}`;

  const response = await fetch(routerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
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
    engine: 'Hugging Face RoBERTa Neural Cloud',
    usedFallback: false,
    raw: data,
  };
}

/**
 * Image Model: Ateeqq/ai-vs-human-image-detector or umm-maybe/AI-image-detector
 */
export async function analyzeImageWithHf(imageBlob) {
  const userToken = getStoredApiKey();
  if (!userToken) {
    throw new Error('HF_TOKEN_REQUIRED: Hugging Face Router requires an API token. Enter a free token in settings or use local spectrum analysis.');
  }

  const primaryModel = 'Ateeqq/ai-vs-human-image-detector';
  const fallbackModel = 'umm-maybe/AI-image-detector';

  const tryModel = async (modelId) => {
    const routerUrl = `https://router.huggingface.co/hf-inference/models/${modelId}`;
    const response = await fetch(routerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`
      },
      body: imageBlob,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HF HTTP ${response.status}: ${errText}`);
    }
    return await response.json();
  };

  let data;
  try {
    data = await tryModel(primaryModel);
  } catch (e) {
    data = await tryModel(fallbackModel);
  }

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
    label: aiScore > 50 ? 'AI-Generated Image' : 'Authentic Human Image',
    engine: 'Hugging Face SigLIP Neural Cloud',
    usedFallback: false,
    raw: data,
  };
}
