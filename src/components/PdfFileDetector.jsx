import React, { useState, useRef } from 'react';
import { FileText, UploadCloud, FileCode, AlertTriangle, Sparkles, RefreshCw, Award, CheckCircle2, RotateCcw } from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import VerificationReportModal from './VerificationReportModal';
import { extractTextFromFile } from '../utils/pdfTextExtractor';
import { analyzeTextWithHf } from '../utils/huggingFaceApi';
import { analyzeTextWithTruthScan, getStoredTruthScanKey } from '../utils/truthScanApi';
import { analyzeTextHeuristics } from '../utils/textHeuristics';
import { analyzeSentenceLevelAI } from '../utils/sentenceHighlighter';

export default function PdfFileDetector() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [sentencesData, setSentencesData] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    setErrorMsg(null);
    setSelectedFile(file);
    setIsProcessing(true);
    setResult(null);
    setSentencesData([]);

    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length < 15) {
        throw new Error('Could not extract sufficient text content from this document file.');
      }

      setExtractedText(text);

      // Analyze sentence level risk
      const sentenceAnalysis = analyzeSentenceLevelAI(text);
      setSentencesData(sentenceAnalysis);

      // Run AI Detection Pipeline
      if (getStoredTruthScanKey()) {
        try {
          const truthResult = await analyzeTextWithTruthScan(text);
          const localMetrics = analyzeTextHeuristics(text);
          setResult({
            ...truthResult,
            metrics: localMetrics.metrics,
            explanations: [
              `TruthScan Document API Result: ${truthResult.aiScore}% AI probability.`,
              ...localMetrics.explanations
            ]
          });
          return;
        } catch (tsErr) {
          console.warn('TruthScan failed, using HF / Heuristics:', tsErr.message);
        }
      }

      try {
        const hfData = await analyzeTextWithHf(text);
        const localMetrics = analyzeTextHeuristics(text);
        setResult({
          ...hfData,
          metrics: localMetrics.metrics,
          explanations: [
            `Neural Cloud Document Classification: ${hfData.aiScore}% AI score.`,
            ...localMetrics.explanations
          ]
        });
      } catch (hfErr) {
        const fallbackResult = analyzeTextHeuristics(text);
        setResult(fallbackResult);
      }

    } catch (err) {
      setErrorMsg(`Document processing error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setExtractedText('');
    setResult(null);
    setSentencesData([]);
    setErrorMsg(null);
  };

  const aiSentencesCount = sentencesData.filter(s => s.riskLevel === 'ai').length;
  const humanSentencesCount = sentencesData.filter(s => s.riskLevel === 'human').length;

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        
        {!selectedFile ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); e.dataTransfer.files?.[0] && handleFileSelect(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
            className={`glass-panel rounded-2xl p-6 sm:p-10 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer min-h-[300px] ${
              isDragging ? 'border-cyan-400 bg-cyan-950/30' : 'border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              accept=".pdf,.txt,.md,.doc,.docx"
              className="hidden"
            />
            
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-500/10">
              <FileCode className="w-8 h-8 animate-bounce" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white">Upload PDF, TXT, or Document file</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
              Drag & drop document files. ZeroGPT engine extracts text and performs sentence-by-sentence AI probability verification.
            </p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4">
            
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-bold text-white truncate max-w-[220px]">
                  {selectedFile.name}
                </span>
              </div>

              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Upload Different Document
              </button>
            </div>

            {/* Document Sentence Highlight View */}
            <div className="relative">
              {isProcessing ? (
                <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <span className="text-xs font-mono text-cyan-300 font-bold">Extracting & analyzing PDF document sentences...</span>
                </div>
              ) : (
                <div className="w-full min-h-[220px] max-h-[380px] overflow-y-auto p-4 rounded-xl glass-input text-sm leading-relaxed font-sans text-slate-200 border border-slate-700/80">
                  {sentencesData.map((sent, idx) => (
                    <span key={idx} className={`inline-block px-1 py-0.5 rounded transition-all mr-1 ${sent.colorClass}`}>
                      {sent.text}{' '}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {sentencesData.length > 0 && (
              <div className="my-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between text-xs gap-2">
                <div className="flex items-center space-x-3 font-semibold">
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> High AI ({aiSentencesCount})
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Human ({humanSentencesCount})
                  </span>
                </div>

                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-xs text-cyan-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <Award className="w-4 h-4 text-cyan-400" /> Export PDF Audit Certificate
                </button>
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

      {/* Right Column (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        {result ? (
          <>
            <ScoreGauge
              aiScore={result.aiScore}
              humanScore={result.humanScore}
              usedFallback={result.usedFallback}
              label={result.label}
              engine={result.engine}
              explanations={result.explanations}
            />

            <button
              onClick={() => setShowReportModal(true)}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition-all flex items-center justify-center space-x-2 shadow-lg"
            >
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Download Official Document Audit Certificate</span>
            </button>
          </>
        ) : (
          <div className="glass-panel rounded-2xl p-8 border border-slate-800/80 text-center flex flex-col items-center justify-center min-h-[380px] shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-cyan-400 shadow-inner">
              <FileText className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-white">Awaiting Document File</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              Upload a PDF, TXT, or Markdown document to parse text and execute sentence-level AI risk analysis.
            </p>
          </div>
        )}
      </div>

      <VerificationReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        resultData={result}
        payloadType="pdf"
        payloadName={selectedFile?.name || 'Document'}
      />

    </div>
  );
}
