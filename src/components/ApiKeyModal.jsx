import React, { useState, useEffect } from 'react';
import { X, Key, Check, Info, ShieldCheck, Server } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../utils/huggingFaceApi';
import { getStoredTruthScanKey, setStoredTruthScanKey } from '../utils/truthScanApi';

export default function ApiKeyModal({ isOpen, onClose }) {
  const [hfKey, setHfKey] = useState('');
  const [truthScanKey, setTruthScanKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHfKey(getStoredApiKey());
      setTruthScanKey(getStoredTruthScanKey());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setStoredApiKey(hfKey);
    setStoredTruthScanKey(truthScanKey);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setHfKey('');
    setTruthScanKey('');
    setStoredApiKey('');
    setStoredTruthScanKey('');
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden glass-panel">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Detection Server Settings</h2>
            <p className="text-xs text-slate-400">TruthScan & Hugging Face Engine Credentials</p>
          </div>
        </div>

        {/* Info Callout */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 mb-5 text-xs text-slate-300 space-y-1">
          <p className="flex items-center gap-1.5 font-semibold text-cyan-300">
            <Info className="w-4 h-4" /> TruthScan & Hugging Face Server Integration
          </p>
          <p className="text-slate-400 leading-relaxed">
            Enter your TruthScan API key (`POST detect-text.truthscan.com`) or Hugging Face access token to query enterprise detection servers directly.
          </p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSave} className="space-y-4">
          
          {/* TruthScan Key Input */}
          <div>
            <label className="block text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1.5 font-semibold">
              TruthScan API Key
            </label>
            <input
              type="password"
              value={truthScanKey}
              onChange={(e) => setTruthScanKey(e.target.value)}
              placeholder="TruthScan API Key (e.g. ts_live_...)"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 font-mono focus:outline-none"
            />
          </div>

          {/* Hugging Face Key Input */}
          <div>
            <label className="block text-xs font-mono text-violet-400 uppercase tracking-wider mb-1.5 font-semibold">
              Hugging Face User Access Token
            </label>
            <input
              type="password"
              value={hfKey}
              onChange={(e) => setHfKey(e.target.value)}
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-slate-100 font-mono focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {(getStoredApiKey() || getStoredTruthScanKey()) ? (
              <button
                type="button"
                onClick={handleClear}
                className="px-3.5 py-2 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 hover:bg-rose-900/60 text-xs font-semibold transition-colors"
              >
                Clear Credentials
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Credentials</span>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
