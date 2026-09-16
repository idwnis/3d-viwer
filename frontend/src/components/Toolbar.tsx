import React from 'react';
import {
  Layers,
  Grid,
  RotateCw,
  Focus,
  Download,
  Palette,
  Eye
} from 'lucide-react';

export type RenderMode = 'textured' | 'wireframe' | 'clay' | 'normal';

interface ToolbarProps {
  renderMode: RenderMode;
  onSetRenderMode: (mode: RenderMode) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onResetCamera: () => void;
  onOpenExport: () => void;
  hasModel: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  renderMode,
  onSetRenderMode,
  showGrid,
  onToggleGrid,
  autoRotate,
  onToggleAutoRotate,
  onResetCamera,
  onOpenExport,
  hasModel,
}) => {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-studio-800/90 backdrop-blur-md border border-studio-700/80 rounded-2xl px-3 py-1.5 shadow-2xl flex items-center space-x-1.5 space-x-reverse z-20 select-none">
      {/* Shading mode selectors */}
      <div className="flex items-center space-x-1 space-x-reverse bg-studio-900/80 p-1 rounded-xl border border-studio-700/50">
        <button
          onClick={() => onSetRenderMode('textured')}
          title="رنگ‌آمیزی بافت‌دار (Photorealistic)"
          className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 space-x-reverse transition ${
            renderMode === 'textured'
              ? 'bg-sky-500 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">بافت‌دار</span>
        </button>

        <button
          onClick={() => onSetRenderMode('wireframe')}
          title="ساختار خطی و توپولوژی (Wireframe)"
          className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 space-x-reverse transition ${
            renderMode === 'wireframe'
              ? 'bg-sky-500 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">وایر فریم</span>
        </button>

        <button
          onClick={() => onSetRenderMode('clay')}
          title="سطح گلی و انحنای هندسه (Clay)"
          className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 space-x-reverse transition ${
            renderMode === 'clay'
              ? 'bg-sky-500 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">سطح گلی</span>
        </button>

        <button
          onClick={() => onSetRenderMode('normal')}
          title="بردارهای عمود بر سطح (Normals)"
          className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 space-x-reverse transition ${
            renderMode === 'normal'
              ? 'bg-sky-500 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="w-3 h-3 rounded-full bg-gradient-to-tr from-rose-500 via-emerald-500 to-sky-500 inline-block" />
          <span className="hidden sm:inline">نرمال‌ها</span>
        </button>
      </div>

      <div className="h-5 w-px bg-studio-700 mx-1" />

      {/* Grid toggle */}
      <button
        onClick={onToggleGrid}
        title={showGrid ? 'پنهان کردن شبکه کف' : 'نمایش شبکه کف'}
        className={`p-1.5 rounded-lg text-xs transition border ${
          showGrid
            ? 'bg-studio-700 text-sky-400 border-studio-600'
            : 'text-slate-400 hover:text-white border-transparent'
        }`}
      >
        <Grid className="w-4 h-4" />
      </button>

      {/* Auto-Rotate Turntable */}
      <button
        onClick={onToggleAutoRotate}
        title={autoRotate ? 'توقف چرخش خودکار' : 'چرخش خودکار ۳۶۰ درجه'}
        className={`p-1.5 rounded-lg text-xs transition border ${
          autoRotate
            ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
            : 'text-slate-400 hover:text-white border-transparent'
        }`}
      >
        <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
      </button>

      {/* Reset Camera View */}
      <button
        onClick={onResetCamera}
        title="بازنشانی زاویه دوربین"
        className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-studio-700 transition"
      >
        <Focus className="w-4 h-4" />
      </button>

      <div className="h-5 w-px bg-studio-700 mx-1" />

      {/* Export Model Trigger */}
      <button
        onClick={onOpenExport}
        disabled={!hasModel}
        title={hasModel ? 'ذخیره و دانلود مدل سه‌بعدی' : 'ابتدا یک مدل تولید کنید'}
        className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center space-x-1.5 space-x-reverse transition ${
          hasModel
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20'
            : 'bg-studio-700/50 text-slate-500 cursor-not-allowed'
        }`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>ذخیره مدل</span>
      </button>
    </div>
  );
};
