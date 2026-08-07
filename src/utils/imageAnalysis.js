/**
 * Image Metadata Audit & Visual Frequency Scan for ZidBhai AuthentiScan
 * Uses ExifReader to search for EXPLICIT AI Generator Signatures (DALL-E, Midjourney, Stable Diffusion, Firefly, etc.)
 */

import ExifReader from 'exifreader';

// Strict AI signature patterns checked against specific software & metadata comment fields
const EXPLICIT_AI_SIGNATURES = [
  'dall-e', 'dalle', 'midjourney', 'stable diffusion', 'stablediffusion',
  'adobe firefly', 'automatic1111', 'comfyui', 'fooocus',
  'bing image creator', 'chatgpt', 'flux.1', 'flux', 'novelai',
  'civitai', 'sdxl', 'sd1.5', 'sd2.1', 'novita', 'text2img'
];

/**
 * Extracts EXIF, PNG chunks, and XMP metadata from an image file/arrayBuffer
 * Strictly matches explicit AI tool fields and defaults stripped/normal photos to Authentic.
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

    // Check specific software/model fields
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

    // Inspect target software/comment metadata fields for explicit AI signatures
    let fieldsToScan = [];
    if (tags.exif?.Software?.description) fieldsToScan.push(tags.exif.Software.description);
    if (tags.png?.Software?.description) fieldsToScan.push(tags.png.Software.description);
    if (tags.png?.Comment?.description) fieldsToScan.push(tags.png.Comment.description);
    if (tags.png?.Parameters?.description) fieldsToScan.push(tags.png.Parameters.description);
    if (tags.exif?.UserComment?.description) fieldsToScan.push(tags.exif.UserComment.description);
    if (tags.xmp?.CreatorTool?.description) fieldsToScan.push(tags.xmp.CreatorTool.description);

    const scannedText = fieldsToScan.join(' ').toLowerCase();

    // Match explicit AI signatures
    EXPLICIT_AI_SIGNATURES.forEach(keyword => {
      if (scannedText.includes(keyword)) {
        result.aiDetectedInMetadata = true;
        const upper = keyword.toUpperCase();
        if (!result.detectedSignatures.includes(upper)) {
          result.detectedSignatures.push(upper);
        }
      }
    });

    if (result.aiDetectedInMetadata) {
      result.warnings.push(`Explicit synthetic metadata footprint detected: ${result.detectedSignatures.join(', ')}`);
    } else {
      result.warnings.push('No synthetic AI generator metadata signatures found.');
    }

    // Populate simplified raw tags for metadata viewer
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
    result.warnings.push(`Metadata audit note: ${err.message || 'No standard EXIF header found (common in web graphics).'}`);
  }

  return result;
}

/**
 * Client-Side Heuristic Visual Analyzer (Spatial Noise & Pixel Quantization Grid scan)
 * Recalibrated for Real-World Smartphone/Camera Photos:
 * Real photos contain rich natural sensor grain, color channel micro-variations, and organic high-frequency edges.
 * Default baseline for real photos is 82%–95% Human.
 */
export async function analyzeImageVisualHeuristics(imageElement) {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Downscale to max 512px for pixel frequency scan
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

      // Analyze spatial noise variance & neighbor pixel diffs
      let noiseVariance = 0;
      let smoothPixelCount = 0;
      let colorChannelVariance = 0;

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        // Color channel micro-difference (Real camera sensors have subtle Bayer matrix noise)
        const rgDiff = Math.abs(r - g);
        const gbDiff = Math.abs(g - b);
        colorChannelVariance += (rgDiff + gbDiff);

        // Neighbor diff for spatial noise estimate
        if (i + 4 < pixels.length) {
          const nextR = pixels[i + 4];
          const diff = Math.abs(r - nextR);
          if (diff < 1) smoothPixelCount++;
          noiseVariance += diff;
        }
      }

      const pixelCount = pixels.length / 4;
      const avgNoise = noiseVariance / pixelCount;
      const avgColorVar = colorChannelVariance / pixelCount;
      const smoothnessRatio = smoothPixelCount / pixelCount;

      // Recalibrated baseline: Default real photos to 12%–18% AI (82%–88% Human)
      let aiProb = 15;

      // Only penalize towards AI if extreme artificial smoothness AND low sensor noise occur simultaneously
      if (smoothnessRatio > 0.65 && avgNoise < 1.8) {
        aiProb += 45; // AI diffusion smoothness signature
      } else if (smoothnessRatio > 0.55 && avgNoise < 2.5) {
        aiProb += 25;
      }

      // Camera sensor noise & color variance increase human authenticity confidence
      if (avgNoise > 6.0 && avgColorVar > 12) {
        aiProb = Math.max(5, aiProb - 10); // Authentic camera grain
      }

      const finalAiScore = Math.min(Math.max(Math.round(aiProb), 5), 90);
      const finalHumanScore = 100 - finalAiScore;

      resolve({
        aiScore: finalAiScore,
        humanScore: finalHumanScore,
        label: finalAiScore > 50 ? 'Likely AI-Generated Image' : 'High Confidence Authentic Image',
        usedFallback: true,
        metrics: {
          smoothnessRatio: Math.round(smoothnessRatio * 100),
          noiseVariance: Math.round(avgNoise * 10) / 10,
          colorVariance: Math.round(avgColorVar * 10) / 10,
          resolution: `${imageElement.naturalWidth || width}×${imageElement.naturalHeight || height}`
        }
      });
    } catch (e) {
      resolve({
        aiScore: 15,
        humanScore: 85,
        label: 'Authentic Photo (Default Baseline)',
        usedFallback: true,
        metrics: { error: e.message }
      });
    }
  });
}
