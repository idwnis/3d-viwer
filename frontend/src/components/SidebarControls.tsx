import React, { useRef } from 'react';
import {
  UploadCloud,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  FolderOpen,
  X,
  FileCode,
  Download
} from 'lucide-react';
import { SAMPLE_IMAGES, SampleImage } from '../services/sampleData';

interface SidebarControlsProps {
  selectedImage: string | null;
  onSelectImage: (dataUrl: string, name?: string) => void;
  onClearImage: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generationStep: string;
  engineMode: 'colab' | 'offline';
  onFileUpload3D: (file: File) => void;
  depthScale: number;
  onDepthScaleChange: (val: number) => void;
  onOpenExport: () => void;
  hasModel: boolean;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  selectedImage,
  onSelectImage,
  onClearImage,
  onGenerate,
  isGenerating,
  generationStep,
  engineMode,
  onFileUpload3D,
  depthScale,
  onDepthScaleChange,
  onOpenExport,
  hasModel
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const file3DInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onSelectImage(ev.target.result as string, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handle3DFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload3D(file);
    }
  };

  return (
    <aside className="w-80 border-r border-studio-700 bg-studio-850 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto p-4 space-y-5 select-none bg-[#11151c]">
      {/* 1. Image Upload Section */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>Input 2D Image</span>
          </label>
          {selectedImage && (
            <button
              onClick={onClearImage}
              className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center space-x-0.5"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {selectedImage ? (
          <div className="relative rounded-xl overflow-hidden border border-studio-600 bg-studio-900 group">
            <img
              src={selectedImage}
              alt="Source"
              className="w-full h-44 object-contain p-2 bg-gradient-to-b from-transparent to-black/30"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-studio-700 text-white text-xs font-semibold hover:bg-studio-600 shadow"
              >
                Replace
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-studio-700 hover:border-sky-500 rounded-xl p-6 text-center cursor-pointer transition bg-studio-900/40 hover:bg-studio-900/80 group"
          >
            <UploadCloud className="w-8 h-8 mx-auto text-slate-500 group-hover:text-sky-400 transition" />
            <p className="text-xs font-semibold text-slate-300 mt-2">
              Drop an image here, or <span className="text-sky-400">browse</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Supports PNG, JPG, JPEG, WebP</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </section>

      {/* 2. Quick Demo Samples */}
      <section className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
          <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>Quick Demo Presets</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SAMPLE_IMAGES.map((sample: SampleImage) => (
            <button
              key={sample.id}
              onClick={() => onSelectImage(sample.dataUrl, sample.name)}
              className="flex items-center space-x-2 p-2 rounded-xl border border-studio-700 bg-studio-900/50 hover:bg-studio-800 hover:border-sky-500/50 text-left transition group"
            >
              <img
                src={sample.dataUrl}
                alt={sample.name}
                className="w-8 h-8 rounded-lg object-cover border border-studio-700 group-hover:border-sky-500/50"
              />
              <div className="overflow-hidden">
                <p className="text-[11px] font-semibold text-slate-200 truncate">{sample.name}</p>
                <p className="text-[9px] text-slate-500">{sample.category}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Parameter Controls */}
      {engineMode === 'offline' && (
        <section className="space-y-2 bg-studio-900/60 p-3 rounded-xl border border-studio-700/70">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center space-x-1">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Depth Relief Scale</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold">{depthScale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.8"
            step="0.05"
            value={depthScale}
            onChange={(e) => onDepthScaleChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-studio-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <p className="text-[10px] text-slate-500">Controls heightfield extrusion depth for 3D relief</p>
        </section>
      )}

      {/* 4. Action Button: Generate 3D */}
      <section className="pt-2">
        <button
          onClick={onGenerate}
          disabled={!selectedImage || isGenerating}
          className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition shadow-lg ${
            !selectedImage || isGenerating
              ? 'bg-studio-700 text-slate-500 cursor-not-allowed'
              : engineMode === 'colab'
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/20'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>{generationStep || 'Processing...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>
                {engineMode === 'colab' ? 'Reconstruct 360° 3D Model' : 'Generate 3D Relief (Offline)'}
              </span>
            </>
          )}
        </button>
      </section>

      {/* 5. Direct 3D Model Import & Save Quick Actions */}
      <div className="mt-auto pt-4 border-t border-studio-700/60 space-y-2">
        <button
          onClick={() => file3DInputRef.current?.click()}
          className="w-full py-2 px-3 rounded-xl border border-studio-700 hover:border-studio-600 bg-studio-900/40 hover:bg-studio-900 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center space-x-2 transition"
        >
          <FileCode className="w-3.5 h-3.5 text-slate-400" />
          <span>Open Existing .GLB / .OBJ</span>
        </button>
        <input
          ref={file3DInputRef}
          type="file"
          accept=".glb, .gltf, .obj"
          onChange={handle3DFileChange}
          className="hidden"
        />

        {hasModel && (
          <button
            onClick={onOpenExport}
            className="w-full py-2 px-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-2 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .GLB / .OBJ / .STL</span>
          </button>
        )}
      </div>
    </aside>
  );
};
