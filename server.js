import express from 'express';
import cors from 'cors';
import multer from 'multer';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3001;

// TruthScan Text Detection Proxy
app.post('/api/detect-text', async (req, res) => {
  const { text, truthScanKey, hfKey } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text payload is required.' });
  }

  // 1. TruthScan Integration
  if (truthScanKey && truthScanKey.trim()) {
    try {
      const response = await fetch('https://detect-text.truthscan.com/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, key: truthScanKey.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        const score = data.result || data.score || 50;
        const aiScore = Math.min(Math.max(Math.round(score), 0), 100);
        
        return res.json({
          aiScore,
          humanScore: 100 - aiScore,
          label: aiScore > 50 ? 'AI-Generated Text (TruthScan Engine)' : 'Authentic Human Text (TruthScan Engine)',
          engine: 'TruthScan Enterprise Cloud API',
          usedFallback: false,
          explanations: [
            `TruthScan Enterprise API result score: ${aiScore}% AI likelihood.`,
            aiScore > 60 ? 'TruthScan flagged text above 60% threshold (Definite AI).' : 'TruthScan evaluated text below 50% threshold (Human-written).'
          ],
          raw: data
        });
      }
    } catch (err) {
      console.warn('TruthScan Proxy Error:', err.message);
    }
  }

  // 2. Hugging Face RoBERTa Cloud Integration
  if (hfKey && hfKey.trim()) {
    try {
      const modelId = 'Hello-SimpleAI/chatgpt-detector-roberta';
      const routerUrl = `https://router.huggingface.co/hf-inference/models/${modelId}`;

      const response = await fetch(routerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${hfKey.trim()}`
        },
        body: JSON.stringify({ inputs: text.slice(0, 1500) }),
      });

      if (response.ok) {
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

        return res.json({
          aiScore,
          humanScore: 100 - aiScore,
          label: aiScore > 50 ? 'AI-Generated Text (RoBERTa Neural Cloud)' : 'Authentic Human Text',
          engine: 'Hugging Face RoBERTa Neural Cloud',
          usedFallback: false,
          explanations: [
            `RoBERTa Neural Model result score: ${aiScore}% AI probability.`,
            aiScore > 50 ? 'Classifier detected synthetic LLM sentence patterns.' : 'Classifier verified human sentence structure.'
          ],
          raw: data
        });
      }
    } catch (err) {
      console.warn('HF Text Proxy Error:', err.message);
    }
  }

  return res.status(400).json({ error: 'No active API Key configured or upstream servers unreachable.' });
});

// Image Detection Proxy
app.post('/api/detect-image', upload.single('image'), async (req, res) => {
  const hfKey = req.headers['x-hf-token'];
  if (!req.file) {
    return res.status(400).json({ error: 'Image file required.' });
  }

  if (hfKey && hfKey.trim()) {
    try {
      const modelId = 'Ateeqq/ai-vs-human-image-detector';
      const routerUrl = `https://router.huggingface.co/hf-inference/models/${modelId}`;

      const response = await fetch(routerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfKey.trim()}`
        },
        body: req.file.buffer,
      });

      if (response.ok) {
        const data = await response.json();
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

        return res.json({
          aiScore,
          humanScore: 100 - aiScore,
          label: aiScore > 50 ? 'AI-Generated Image (SigLIP Vision Neural)' : 'Authentic Human Photo',
          engine: 'Hugging Face SigLIP Vision Neural Cloud',
          usedFallback: false,
          explanations: [
            `SigLIP Vision Classifier score: ${aiScore}% AI probability.`,
            aiScore > 50 ? 'Neural model detected synthetic diffusion artifacts.' : 'Neural model verified authentic camera photograph.'
          ],
          raw: data
        });
      }
    } catch (err) {
      console.warn('HF Image Proxy Error:', err.message);
    }
  }

  return res.status(400).json({ error: 'No Hugging Face token provided or model endpoint rate-limited.' });
});

app.listen(PORT, () => {
  console.log(`ZidBhai AuthentiScan Backend Proxy Server running on port ${PORT}`);
});
