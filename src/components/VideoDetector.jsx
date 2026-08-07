import React, { useState, useRef } from 'react';
import { Video as VideoIcon, UploadCloud, Play, Film, AlertTriangle, RefreshCw, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import { extractVideoKeyframes } from '../utils/videoSampler';
import { analyzeImageWithHf } from '../utils/huggingFaceApi';
import { analyzeImageVisualHeuristics } from '../utils/imageAnalysis';

export default function VideoDetector() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [keyframes, setKeyframes] = useState([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
  const [aggregateResult, setAggregateResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('video/')) {
      setErrorMsg('Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setKeyframes([]);
    setAggregateResult(null);
  };

  const handleRunVideoPipeline = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setProgressPercent(5);
    setProgressMsg('Initializing offscreen 1024px scaled canvas sampler...');

    try {
      // Step 1: Canvas Keyframe Extraction at 25%, 50%, 75%
      const extractedFrames = await extractVideoKeyframes(
        selectedFile,
        [0.25, 0.50, 0.75],
        (pct, msg) => {
          setProgressPercent(pct);
          setProgressMsg(msg);
        }
      );

      // Step 2: Run keyframe blobs sequentially through Image Detection Pipeline
      const analyzedFrames = [];
      let totalAiScore = 0;

      for (let i = 0; i < extractedFrames.length; i++) {
        const frame = extractedFrames[i];
        setProgressPercent(60 + Math.round(((i + 1) / extractedFrames.length) * 35));
        setProgressMsg(`Running vision model on keyframe ${i + 1}/${extractedFrames.length} (${frame.timestampFormatted})...`);

        let frameResult;
        try {
          frameResult = await analyzeImageWithHf(frame.blob);
        } catch (hfErr) {
          console.warn(`HF API offline for frame ${i + 1}, using visual heuristic:`, hfErr.message);
          
          // Create temp image element to run visual heuristic fallback
          const tempImg = new Image();
          tempImg.src = frame.dataUrl;
          await new Promise((res) => { tempImg.onload = res; });
          frameResult = await analyzeImageVisualHeuristics(tempImg);
        }

        totalAiScore += frameResult.aiScore;

        analyzedFrames.push({
          ...frame,
          aiScore: frameResult.aiScore,
          humanScore: frameResult.humanScore,
          label: frameResult.label,
          usedFallback: frameResult.usedFallback
        });
      }

      const avgAiScore = Math.round(totalAiScore / analyzedFrames.length);
      const avgHumanScore = 100 - avgAiScore;

      setKeyframes(analyzedFrames);
      setAggregateResult({
        aiScore: avgAiScore,
        humanScore: avgHumanScore,
        label: avgAiScore > 50 ? 'Likely AI-Generated Video' : 'Likely Authentic Video',
        usedFallback: analyzedFrames.some(f => f.usedFallback)
      });

      setProgressPercent(100);

    } catch (err) {
      setErrorMsg(`Video processing error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setKeyframes([]);
    setAggregateResult(null);
    setErrorMsg(null);
  };

  const activeKeyframe = keyframes[selectedFrameIndex];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Video Player & Sampling Column (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        
        {!videoUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="glass-panel rounded-2xl p-10 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/50 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer min-h-[320px]"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              accept="video/*"
              className="hidden"
            />

            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
              <Film className="w-8 h-8 animate-pulse" />
            </div>

            <h3 className="text-lg font-bold text-white">Upload video file for Keyframe Authenticity Scan</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Supports MP4, WebM, MOV. Uses offscreen 1024px scaled canvas context to sample keyframes without dropping UI frames.
            </p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <VideoIcon className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-bold text-white truncate max-w-[200px]">
                  {selectedFile?.name}
                </span>
              </div>

              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Change Video
              </button>
            </div>

            {/* Video Player */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full max-h-[360px] object-contain rounded-lg"
              />

              {/* Extraction Overlay Banner */}
              {isProcessing && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <RefreshCw className="w-9 h-9 text-cyan-400 animate-spin" />
                  <span className="text-xs font-mono font-bold text-cyan-300">{progressMsg}</span>
                  <div className="w-full max-w-xs bg-slate-900 rounded-full h-2.5 border border-slate-700 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-400 via-teal-400 to-violet-500 h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Trigger Button */}
            {keyframes.length === 0 && !isProcessing && (
              <button
                onClick={handleRunVideoPipeline}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-5 h-5 fill-slate-950" />
                <span>Extract Canvas Keyframes & Verify Authenticity</span>
              </button>
            )}

            {/* Frame Timeline Scrubber Cards */}
            {keyframes.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <h4 className="text-xs font-mono uppercase text-cyan-400 font-semibold flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> Extracted Keyframe Timeline (Scaled 1024px Context)
                </h4>

                <div className="grid grid-cols-3 gap-2.5">
                  {keyframes.map((frame, index) => {
                    const isSelected = selectedFrameIndex === index;
                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedFrameIndex(index)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] scale-[1.02]'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden mb-1.5 bg-slate-900">
                          <img
                            src={frame.dataUrl}
                            alt={`Frame ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-cyan-300">
                            {frame.timestampFormatted}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400">Frame #{index + 1}</span>
                          <span className={`font-bold ${frame.aiScore > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {frame.aiScore}% AI
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

      </div>

      {/* Right Aggregate Score Column (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        {aggregateResult ? (
          <>
            <ScoreGauge
              aiScore={aggregateResult.aiScore}
              humanScore={aggregateResult.humanScore}
              usedFallback={aggregateResult.usedFallback}
              label={aggregateResult.label}
            />

            {/* Selected Keyframe Inspector Card */}
            {activeKeyframe && (
              <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
                <h4 className="font-mono text-cyan-400 font-semibold flex items-center justify-between border-b border-slate-800 pb-2">
                  <span>Selected Frame Inspection: #{activeKeyframe.index + 1}</span>
                  <span className="text-slate-400">@{activeKeyframe.timestampFormatted}</span>
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Frame Resolution:</span>
                  <span className="font-mono text-slate-200">{activeKeyframe.width}×{activeKeyframe.height} (Scaled from {activeKeyframe.originalResolution})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Frame AI Score:</span>
                  <span className="font-mono font-bold text-rose-400">{activeKeyframe.aiScore}%</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="glass-panel rounded-2xl p-8 border border-slate-800/80 text-center flex flex-col items-center justify-center min-h-[380px] shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-cyan-400 shadow-inner">
              <Film className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Awaiting Video File</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              Upload a video file to run HTML5 offscreen canvas keyframe extraction and sequence authenticity scoring.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
