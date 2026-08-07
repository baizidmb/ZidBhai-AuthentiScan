import React from 'react';
import { FileText, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

export default function NavigationTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'text', label: 'Text Authenticity', icon: FileText, desc: 'RoBERTa + Burstiness' },
    { id: 'image', label: 'Image Scan', icon: ImageIcon, desc: 'EXIF Metadata + Visual AI Scan' },
    { id: 'video', label: 'Video Keyframe Scan', icon: VideoIcon, desc: 'Canvas Keyframes + Frame Timeline' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto my-6 px-4">
      <div className="p-1.5 rounded-2xl glass-panel border border-slate-800/90 grid grid-cols-3 gap-1.5 shadow-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-3.5 px-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-slate-900/90 text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
              }`}
            >
              {isActive && (
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-violet-500/10 pointer-events-none" />
              )}
              
              <div className="flex items-center space-x-2 z-10">
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-cyan-400 scale-110' : 'text-slate-500'}`} />
                <span className={`font-semibold text-sm sm:text-base ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {tab.label}
                </span>
              </div>
              
              <span className={`text-[11px] mt-1 font-mono hidden sm:block ${isActive ? 'text-cyan-300/80' : 'text-slate-500'}`}>
                {tab.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
