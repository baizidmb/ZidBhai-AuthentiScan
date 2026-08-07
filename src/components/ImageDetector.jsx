import React, { useState, useRef } from 'react';
import { Image as ImageIcon, UploadCloud, AlertTriangle, FileCode, CheckCircle2, RefreshCw, ZoomIn, Eye, Sparkles } from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import MetadataViewer from './MetadataViewer';
import { analyzeImageWithHf } from '../utils/huggingFaceApi';
import { auditImageMetadata, analyzeImageVisualHeuristics } from '../utils/imageAnalysis';

export default function ImageDetector() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStep, setScanStep] = useState('');
  const [result, setResult] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [isMetadataDrawerOpen, setIsMetadataDrawerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const fileInputRef = useRef(null);
  const imagePreviewRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WebP, etc.).');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResult(null);
    setMetadata(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRunScan = async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setErrorMsg(null);
    setScanProgress(15);
    setScanStep('Auditing EXIF & PNG text chunk metadata...');

    try {
      // Step A: ExifReader metadata audit
      const metaAudit = await auditImageMetadata(selectedFile);
      setMetadata(metaAudit);
      setScanProgress(45);
      setScanStep('Transmitting blob to Deep Visual Neural Model...');

      let scanResult;
      try {
        // Step B: HF Model umm-maybe/AI-image-detector
        scanResult = await analyzeImageWithHf(selectedFile);
      } catch (hfErr) {
        console.warn('HF Image API error, running local visual heuristics fallback:', hfErr.message);
        setScanStep('API rate-limited. Executing client-side pixel frequency scan...');
        // Fallback local heuristic scan
        if (imagePreviewRef.current) {
          scanResult = await analyzeImageVisualHeuristics(imagePreviewRef.current);
        } else {
          scanResult = {
            aiScore: metaAudit.aiDetectedInMetadata ? 95 : 30,
            humanScore: metaAudit.aiDetectedInMetadata ? 5 : 70,
            label: metaAudit.aiDetectedInMetadata ? 'Synthetic AI Metadata Found' : 'Likely Authentic Image',
            usedFallback: true
          };
        }
      }

      setScanProgress(90);
      setScanStep('Finalizing authenticity diagnostics...');

      // Override score if synthetic metadata tag was explicitly found
      if (metaAudit.aiDetectedInMetadata) {
        scanResult.aiScore = Math.max(scanResult.aiScore, 92);
        scanResult.humanScore = 100 - scanResult.aiScore;
        scanResult.label = 'Synthetic Metadata Detected';
      }

      setResult(scanResult);
      setScanProgress(100);

    } catch (err) {
      setErrorMsg(`Image analysis error: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setMetadata(null);
    setErrorMsg(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Uploader & Image Column (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Upload Container */}
        {!previewUrl ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`glass-panel rounded-2xl p-10 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer min-h-[320px] ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
                : 'border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />
            
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
              <UploadCloud className="w-8 h-8 animate-bounce" />
            </div>

            <h3 className="text-lg font-bold text-white">Drop image here or click to browse</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Supports PNG, JPEG, WebP. Performs EXIF C2PA metadata audit and deep visual scan for DALL-E, Midjourney, & Stable Diffusion signatures.
            </p>
          </div>
        ) : (
          /* Image Preview & Scan Grid */
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-bold text-white truncate max-w-[200px]">
                  {selectedFile?.name}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {metadata && (
                  <button
                    onClick={() => setIsMetadataDrawerOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <FileCode className="w-4 h-4" /> Metadata Audit
                  </button>
                )}
                
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Change File
                </button>
              </div>
            </div>

            {/* Preview Image Frame with Scan Overlay */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-[400px]">
              <img
                ref={imagePreviewRef}
                src={previewUrl}
                alt="Upload preview"
                className="max-h-[380px] w-auto object-contain rounded-lg"
              />

              {/* Animated Scan Grid Overlay */}
              {isScanning && (
                <div className="absolute inset-0 bg-cyan-950/20 backdrop-blur-[2px] flex flex-col items-center justify-center p-4">
                  <div className="w-full h-1 bg-cyan-400 absolute top-0 animate-pulse shadow-[0_0_15px_#06B6D4]" />
                  <div className="p-4 rounded-2xl glass-panel border border-cyan-500/40 flex flex-col items-center text-center space-y-2 max-w-xs shadow-2xl">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                    <span className="text-xs font-mono text-cyan-300 font-bold">{scanStep}</span>
                    <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-700 overflow-hidden mt-2">
                      <div
                        className="bg-gradient-to-r from-cyan-400 to-violet-500 h-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Synthetic Metadata Badge Overlay */}
              {metadata?.aiDetectedInMetadata && !isScanning && (
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs font-bold flex items-center gap-1.5 shadow-xl">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Synthetic Metadata Badge</span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {!result && !isScanning && (
              <button
                onClick={handleRunScan}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-5 h-5 fill-slate-950" />
                <span>Execute Deep Image Authenticity Scan</span>
              </button>
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

      {/* Right Result Column (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        {result ? (
          <>
            <ScoreGauge
              aiScore={result.aiScore}
              humanScore={result.humanScore}
              usedFallback={result.usedFallback}
              syntheticMetadataFound={metadata?.aiDetectedInMetadata}
              label={result.label}
            />

            {/* Quick Metadata Summary Card */}
            {metadata && (
              <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono">Software Signature:</span>
                  <span className="font-semibold text-slate-200">
                    {metadata.softwareTag || 'None (Stripped)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono">Camera EXIF Model:</span>
                  <span className="font-semibold text-slate-200">
                    {metadata.cameraModel || 'No Hardware Tag'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setIsMetadataDrawerOpen(true)}
                    className="text-xs text-cyan-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    View Full Metadata Inspection Log →
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="glass-panel rounded-2xl p-8 border border-slate-800/80 text-center flex flex-col items-center justify-center min-h-[380px] shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-cyan-400 shadow-inner">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Awaiting Image Payload</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              Upload an image to audit EXIF signatures and run vision neural pipeline inference.
            </p>
          </div>
        )}
      </div>

      {/* Metadata Slide-Over Drawer */}
      <MetadataViewer
        metadata={metadata}
        isOpen={isMetadataDrawerOpen}
        onClose={() => setIsMetadataDrawerOpen(false)}
      />

    </div>
  );
}
