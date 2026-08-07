import React from 'react';
import { X, Cpu, Camera, FileCode, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function MetadataViewer({ metadata, isOpen, onClose }) {
  if (!isOpen || !metadata) return null;

  const rawKeys = Object.keys(metadata.rawTags || {});

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-md flex justify-end animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
        
        {/* Drawer Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <FileCode className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Technical Metadata Audit</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* AI Generator Warnings Banner */}
          {metadata.aiDetectedInMetadata && (
            <div className="my-4 p-4 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-start space-x-3 text-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-rose-300">Synthetic AI Signature Detected!</h4>
                <p className="text-xs mt-1 text-rose-200/90">
                  Matched known AI model payload tags:{' '}
                  <span className="font-mono font-bold text-rose-400">{metadata.detectedSignatures.join(', ')}</span>
                </p>
              </div>
            </div>
          )}

          {/* Key Attribute Cards */}
          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Software Tag
              </span>
              <p className="text-sm font-semibold text-slate-200 mt-1 truncate">
                {metadata.softwareTag || 'None (Stripped or Web Graphic)'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-violet-400" /> Camera Model
              </span>
              <p className="text-sm font-semibold text-slate-200 mt-1 truncate">
                {metadata.cameraModel || 'No Hardware EXIF'}
              </p>
            </div>
          </div>

          {/* Raw Tag Table */}
          <div className="mt-6">
            <h3 className="text-xs font-mono uppercase text-cyan-400 tracking-wider mb-2 font-semibold">
              Parsed EXIF / PNG / XMP Headers ({rawKeys.length} Tags)
            </h3>

            {rawKeys.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center text-slate-400 text-xs">
                No raw EXIF or PNG chunks found in this file header. (Common for social media uploads or web-compressed images).
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 overflow-hidden max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Header Field</th>
                      <th className="py-2.5 px-3">Extracted Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {rawKeys.map((key) => (
                      <tr key={key} className="hover:bg-slate-850/60">
                        <td className="py-2 px-3 text-cyan-300 font-semibold">{key}</td>
                        <td className="py-2 px-3 text-slate-300 break-all">
                          {String(metadata.rawTags[key])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Metadata Drawer
          </button>
        </div>

      </div>
    </div>
  );
}
