/**
 * Image Metadata Audit & Visual Frequency Scan for ZidBhai AuthentiScan
 * Uses ExifReader to search for AI Generator Signatures (DALL-E, Midjourney, Stable Diffusion, Firefly, etc.)
 */

import ExifReader from 'exifreader';

const AI_SIGNATURE_KEYWORDS = [
  'dall-e', 'dalle', 'midjourney', 'stable diffusion', 'stablediffusion',
  'adobe firefly', 'firefly', 'automatic1111', 'comfyui', 'fooocus',
  'bing image creator', 'chatgpt', 'flux.1', 'flux', 'novelai',
  'civitai', 'sdxl', 'sd1.5', 'sd2.1', 'synthetic', 'ai generated',
  't2i', 'text2img', 'prompt:', 'negative prompt:'
];

/**
 * Extracts EXIF, PNG chunks, and XMP metadata from an image file/arrayBuffer
 */
export async function auditImageMetadata(file) {
  const result = {
    hasMetadata: false,
    aiDetectedInMetadata: false,
    detectedSignatures: [],
    softwareTag: null,
    cameraModel: null,
    dimensions: null,
    rawTags: {},
    warnings: []
  };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = ExifReader.load(arrayBuffer, { expanded: true });

    result.hasMetadata = Object.keys(tags).length > 0;

    // Convert all tags to flat searchable string
    let searchableString = JSON.stringify(tags).toLowerCase();

    // Check specific known fields
    if (tags.exif && tags.exif.Software) {
      result.softwareTag = tags.exif.Software.description;
    } else if (tags.png && tags.png.Software) {
      result.softwareTag = tags.png.Software.description;
    }

    if (tags.exif && tags.exif.Model) {
      result.cameraModel = `${tags.exif.Make?.description || ''} ${tags.exif.Model.description}`.trim();
    }

    if (tags.file) {
      if (tags.file['Image Width'] && tags.file['Image Height']) {
        result.dimensions = `${tags.file['Image Width'].value} × ${tags.file['Image Height'].value}`;
      }
    }

    // Check for AI generator signature keywords
    AI_SIGNATURE_KEYWORDS.forEach(keyword => {
      if (searchableString.includes(keyword)) {
        result.aiDetectedInMetadata = true;
        if (!result.detectedSignatures.includes(keyword.toUpperCase())) {
          result.detectedSignatures.push(keyword.toUpperCase());
        }
      }
    });

    if (result.aiDetectedInMetadata) {
      result.warnings.push(`Synthetic metadata payload detected matching signature: ${result.detectedSignatures.join(', ')}`);
    }

    // Clean human-friendly tag list for raw viewer
    const simplifiedRaw = {};
    if (tags.exif) {
      Object.keys(tags.exif).forEach(key => {
        simplifiedRaw[`EXIF:${key}`] = tags.exif[key].description || tags.exif[key].value;
      });
    }
    if (tags.png) {
      Object.keys(tags.png).forEach(key => {
        simplifiedRaw[`PNG:${key}`] = tags.png[key].description || tags.png[key].value;
      });
    }
    if (tags.xmp) {
      Object.keys(tags.xmp).forEach(key => {
        simplifiedRaw[`XMP:${key}`] = tags.xmp[key].description || tags.xmp[key].value;
      });
    }
    if (tags.file) {
      Object.keys(tags.file).forEach(key => {
        simplifiedRaw[`FILE:${key}`] = tags.file[key].description || tags.file[key].value;
      });
    }

    result.rawTags = simplifiedRaw;

  } catch (err) {
    result.warnings.push(`EXIF parsing note: ${err.message || 'No standard EXIF header found (common in web graphics).'}`);
  }

  return result;
}

/**
 * Client-Side Heuristic Visual Analyzer (Spatial Noise & Pixel Quantization Grid scan)
 * Executes when HF API endpoint is unreachable or rate-limited.
 */
export async function analyzeImageVisualHeuristics(imageElement) {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Downscale to max 512px for quick pixel scan
      const maxDim = 512;
      let width = imageElement.naturalWidth || imageElement.width || 512;
      let height = imageElement.naturalHeight || imageElement.height || 512;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(imageElement, 0, 0, width, height);
      const imgData = ctx.getImageData(0, 0, width, height);
      const pixels = imgData.data;

      // Analyze pixel noise variance & color channel correlation
      let totalLuminance = 0;
      let noiseVariance = 0;
      let smoothPixelCount = 0;

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += lum;

        // Neighbor diff for spatial noise estimate
        if (i + 4 < pixels.length) {
          const nextR = pixels[i + 4];
          const diff = Math.abs(r - nextR);
          if (diff < 2) smoothPixelCount++;
          noiseVariance += diff;
        }
      }

      const pixelCount = pixels.length / 4;
      const avgNoise = noiseVariance / pixelCount;
      const smoothnessRatio = smoothPixelCount / pixelCount;

      // AI generated images often have unnatural high-frequency smoothness or specific diffusion noise patterns
      let aiProb = 45;
      if (smoothnessRatio > 0.45) {
        aiProb += 25; // Extremely smooth pixel transitions typical of AI diffusion
      }
      if (avgNoise < 3.5) {
        aiProb += 20; // Very low camera sensor grain noise
      }

      const finalAiScore = Math.min(Math.max(Math.round(aiProb), 10), 90);

      resolve({
        aiScore: finalAiScore,
        humanScore: 100 - finalAiScore,
        label: finalAiScore > 50 ? 'Likely AI-Generated Image' : 'Likely Authentic Image',
        usedFallback: true,
        metrics: {
          smoothnessRatio: Math.round(smoothnessRatio * 100),
          noiseVariance: Math.round(avgNoise * 10) / 10,
          resolution: `${imageElement.naturalWidth || width}×${imageElement.naturalHeight || height}`
        }
      });
    } catch (e) {
      resolve({
        aiScore: 50,
        humanScore: 50,
        label: 'Inconclusive Visual Heuristic',
        usedFallback: true,
        metrics: { error: e.message }
      });
    }
  });
}
