import React, { useState } from 'react';
import Header from './components/Header';
import NavigationTabs from './components/NavigationTabs';
import TextDetector from './components/TextDetector';
import ImageDetector from './components/ImageDetector';
import DeveloperModal from './components/DeveloperModal';
import ApiKeyModal from './components/ApiKeyModal';

export default function App() {
  // Default to 'image' tab on home screen load
  const [activeTab, setActiveTab] = useState('image');
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Header Bar */}
      <div>
        <Header
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
          onOpenDeveloperModal={() => setIsDeveloperModalOpen(true)}
        />

        {/* Tab Navigation Bar (Default Image Tab) */}
        <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Active Module Panel */}
        <main className="px-3 py-4 md:px-8 md:py-8 pb-16">
          {activeTab === 'image' && <ImageDetector />}
          {activeTab === 'text' && <TextDetector />}
        </main>
      </div>

      {/* Footer System */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 py-6 px-4 md:px-8 text-center text-xs text-slate-400 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-center sm:text-left leading-relaxed">
            © 2026 ZidBhai AuthentiScan. Powered by Open-Source AI Pipelines. Built & Maintained by <span className="text-cyan-400 font-semibold">Shahidul Islam Baizid (Baizid)</span>.
          </p>

          <div className="flex items-center space-x-4 shrink-0">
            <button
              onClick={() => setIsDeveloperModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold min-h-[44px] flex items-center"
            >
              Developer Info
            </button>
            <span>•</span>
            <button
              onClick={() => setIsApiKeyModalOpen(true)}
              className="text-slate-400 hover:text-slate-200 transition-colors min-h-[44px] flex items-center"
            >
              HF API Settings
            </button>
          </div>
        </div>
      </footer>

      {/* Action Modals */}
      <DeveloperModal
        isOpen={isDeveloperModalOpen}
        onClose={() => setIsDeveloperModalOpen(false)}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />

    </div>
  );
}
