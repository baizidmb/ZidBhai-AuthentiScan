/**
 * Video Keyframe Sampler for ZidBhai AuthentiScan
 * Performance Directive: Scales down offscreen canvas to maximum width 1024px
 * to prevent UI thread frame drops on 4K/60fps videos.
 */

/**
 * Extracts keyframes from a video File or Blob at specified sample percentages.
 * Default timestamps: [0.25, 0.50, 0.75]
 * Progress callback called with (progressPercent, currentStepLabel)
 */
export async function extractVideoKeyframes(videoFile, sampleRatios = [0.25, 0.50, 0.75], onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const videoUrl = URL.createObjectURL(videoFile);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const keyframes = [];
    let currentSampleIndex = 0;

    video.onloadedmetadata = () => {
      const duration = video.duration;
      if (!duration || isNaN(duration) || duration <= 0) {
        URL.revokeObjectURL(videoUrl);
        return reject(new Error('Invalid video duration or corrupted file format.'));
      }

      onProgress(10, 'Video metadata loaded. Preparing keyframe extraction...');
      seekNextSample();
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(videoUrl);
      reject(new Error(`Failed to load video file: ${video.error?.message || 'Unsupported codec or format'}`));
    };

    function seekNextSample() {
      if (currentSampleIndex >= sampleRatios.length) {
        // Done extracting all sample keyframes
        URL.revokeObjectURL(videoUrl);
        onProgress(60, 'Keyframe extraction complete. Running authenticity pipeline...');
        return resolve(keyframes);
      }

      const ratio = sampleRatios[currentSampleIndex];
      const targetTime = Math.min(Math.max(durationTime(video.duration, ratio), 0.1), video.duration - 0.1);
      
      onProgress(
        Math.round(10 + (currentSampleIndex / sampleRatios.length) * 45),
        `Extracting frame ${currentSampleIndex + 1}/${sampleRatios.length} at ${targetTime.toFixed(1)}s...`
      );

      video.currentTime = targetTime;
    }

    video.onseeked = () => {
      try {
        // Create scaled offscreen canvas context (MAX 1024px width to optimize memory on 4K)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const originalWidth = video.videoWidth || 1920;
        const originalHeight = video.videoHeight || 1080;
        const maxWidth = 1024;

        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        if (originalWidth > maxWidth) {
          targetWidth = maxWidth;
          targetHeight = Math.round((originalHeight * maxWidth) / originalWidth);
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw scaled video frame onto canvas
        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

        // Export as JPEG blob and DataURL
        canvas.toBlob((blob) => {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          const ratio = sampleRatios[currentSampleIndex];
          const time = durationTime(video.duration, ratio);

          keyframes.push({
            index: currentSampleIndex,
            timestamp: time,
            timestampFormatted: formatTime(time),
            blob,
            dataUrl,
            width: targetWidth,
            height: targetHeight,
            originalResolution: `${originalWidth}×${originalHeight}`
          });

          currentSampleIndex++;
          seekNextSample();
        }, 'image/jpeg', 0.88);

      } catch (err) {
        URL.revokeObjectURL(videoUrl);
        reject(new Error(`Canvas keyframe extraction error: ${err.message}`));
      }
    };

    video.src = videoUrl;
  });
}

function durationTime(duration, ratio) {
  return duration * ratio;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}.${ms}`;
}
