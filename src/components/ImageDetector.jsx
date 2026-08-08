import React, { useState, useRef } from 'react';
import { Image as ImageIcon, UploadCloud, AlertTriangle, FileCode, RefreshCw, Sparkles } from 'lucide-react';
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
      const metaAudit = await auditImageMetadata(selectedFile);
      setMetadata(metaAudit);
      setScanProgress(45);
      setScanStep('Executing spatial pixel noise spectrum & hardware EXIF analysis...');

      let scanResult;
      try {
        const hfResult = await analyzeImageWithHf(selectedFile);
        const localVisual = imagePreviewRef.current
          ? await analyzeImageVisualHeuristics(imagePreviewRef.current, metaAudit)
          : { explanations: metaAudit.explanations };

        scanResult = {
          ...hfResult,
          explanations: [
            `Hugging Face SigLIP Classification: ${hfResult.aiScore}% AI probability.`,
            ...localVisual.explanations
          ]
        };
      } catch (hfErr) {
        setScanStep('Executing multi-factor pixel frequency & EXIF spectrum scan...');
        if (imagePreviewRef.current) {
          scanResult = await analyzeImageVisualHeuristics(imagePreviewRef.current, metaAudit);
        } else {
          scanResult = {
            aiScore: metaAudit.aiDetectedInMetadata ? 98 : 12,
            humanScore: metaAudit.aiDetectedInMetadata ? 2 : 88,
            label: metaAudit.aiDetectedInMetadata ? 'Synthetic AI Metadata Found' : 'Authentic Human Image',
            engine: 'ZidBhai Multi-Feature Spectrum Engine',
            usedFallback: true,
            explanations: metaAudit.explanations
          };
        }
      }

      setScanProgress(90);
      setScanStep('Finalizing authenticity diagnostics...');

      if (metaAudit.aiDetectedInMetadata) {
        scanResult.aiScore = Math.max(scanResult.aiScore, 96);
        scanResult.humanScore = 100 - scanResult.aiScore;
        scanResult.label = 'Synthetic AI Metadata Detected';
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
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        
        {!previewUrl ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`glass-panel rounded-2xl p-6 sm:p-10 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer min-h-[280px] sm:min-h-[340px] ${
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
            
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
              <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8 animate-bounce" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white">Drop image here or click to browse</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
              Supports PNG, JPEG, WebP. Performs EXIF metadata audit, Bayer noise spectrum inspection, and deep vision neural scan.
            </p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4">
            
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                <ImageIcon className="w-5 h-5 text-cyan-400 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[180px] sm:max-w-[240px]">
                  {selectedFile?.name}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {metadata && (
                  <button
                    onClick={() => setIsMetadataDrawerOpen(true)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[40px]"
                  >
                    <FileCode className="w-4 h-4" /> Metadata Log
                  </button>
                )}
                
                <button
                  onClick={handleReset}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors min-h-[40px]"
                >
                  Change File
                </button>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center max-h-[380px]">
              <img
                ref={imagePreviewRef}
                src={previewUrl}
                alt="Upload preview"
                className="max-h-[360px] w-auto object-contain rounded-lg"
              />

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

              {metadata?.aiDetectedInMetadata && !isScanning && (
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs font-bold flex items-center gap-1.5 shadow-xl">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Synthetic AI Footprint Tag</span>
                </div>
              )}
            </div>

            {!result && !isScanning && (
              <button
                onClick={handleRunScan}
                className="w-full min-h-[48px] py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 text-sm"
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

      {/* Right Column (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        {result ? (
          <>
            <ScoreGauge
              aiScore={result.aiScore}
              humanScore={result.humanScore}
              usedFallback={result.usedFallback}
              syntheticMetadataFound={metadata?.aiDetectedInMetadata}
              label={result.label}
              engine={result.engine}
              explanations={result.explanations}
            />

            {metadata && (
              <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono">Software Tag:</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                    {metadata.softwareTag || 'None (Clean / Web Graphic)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono">Camera Hardware:</span>
                  <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                    {metadata.cameraModel || 'No Hardware Header'}
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800/80 text-center flex flex-col items-center justify-center min-h-[280px] sm:min-h-[380px] shadow-xl">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-cyan-400 shadow-inner">
              <ImageIcon className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">Awaiting Image Payload</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              Upload an image to audit EXIF hardware tags, pixel noise spectrum, and neural vision classification.
            </p>
          </div>
        )}
      </div>

      <MetadataViewer
        metadata={metadata}
        isOpen={isMetadataDrawerOpen}
        onClose={() => setIsMetadataDrawerOpen(false)}
      />

    </div>
  );
}
