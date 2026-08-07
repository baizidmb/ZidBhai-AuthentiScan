import React, { useState, useEffect } from 'react';
import { X, Key, Check, Info, ShieldAlert } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../utils/huggingFaceApi';

export default function ApiKeyModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setStoredApiKey(apiKey);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setApiKey('');
    setStoredApiKey('');
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
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Hugging Face API Settings</h2>
            <p className="text-xs text-slate-400">Optional custom Access Token manager</p>
          </div>
        </div>

        {/* Info Callout */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 mb-5 text-xs text-slate-300 space-y-1">
          <p className="flex items-center gap-1.5 font-semibold text-cyan-300">
            <Info className="w-4 h-4" /> Free Public API Mode is Active by default
          </p>
          <p className="text-slate-400 leading-relaxed">
            Adding your free Hugging Face User Access Token (starts with <code className="text-cyan-300 font-mono">hf_</code>) bypasses shared rate-limits and enables higher throughput for heavy image and text inference.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-2 font-semibold">
              User Access Token (hf_...)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-4 py-3 rounded-xl glass-input text-sm text-slate-100 font-mono focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              Token is saved locally in your browser's <code className="text-slate-400">localStorage</code> and never sent to third-party analytics.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {getStoredApiKey() ? (
              <button
                type="button"
                onClick={handleClear}
                className="px-3.5 py-2 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 hover:bg-rose-900/60 text-xs font-semibold transition-colors"
              >
                Clear Token
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
                  <span>Save Settings</span>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
