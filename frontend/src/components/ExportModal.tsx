import React, { useState } from 'react';
import * as THREE from 'three';
import { X, Download, Box, Layers, Printer, Check } from 'lucide-react';
import { exportAsGLB, exportAsOBJ, exportAsSTL } from '../services/exporters';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: THREE.Object3D | null;
  baseFilename?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  model,
  baseFilename = 'reconstructed_model'
}) => {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen || !model) return null;

  const handleExport = async (format: 'glb' | 'obj' | 'stl') => {
    try {
      setDownloadingFormat(format);
      if (format === 'glb') {
        await exportAsGLB(model, `${baseFilename}.glb`);
      } else if (format === 'obj') {
        exportAsOBJ(model, `${baseFilename}.obj`);
      } else if (format === 'stl') {
        exportAsSTL(model, `${baseFilename}.stl`, true);
      }
      setDownloadSuccess(format);
      setTimeout(() => setDownloadSuccess(null), 2500);
    } catch (err) {
      console.error(`Export to ${format} failed:`, err);
      alert(`Export failed: ${err}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" dir="rtl">
      <div className="bg-studio-800 border border-studio-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-right">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 space-x-reverse mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">ذخیره و دریافت فایل مدل سه‌بعدی</h2>
            <p className="text-xs text-slate-400">انتخاب فرمت استاندارد برای کامپیوتر، نرم‌افزارهای CAD یا پرینتر سه‌بعدی</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* GLB Option */}
          <button
            onClick={() => handleExport('glb')}
            disabled={!!downloadingFormat}
            className="w-full text-right p-4 rounded-xl border border-studio-700 bg-studio-900/60 hover:bg-studio-700/50 hover:border-sky-500/50 transition flex items-center justify-between group"
          >
            <div className="flex items-start space-x-3.5 space-x-reverse">
              <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 mt-0.5">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="font-semibold text-sm text-white">glTF باینری (.GLB)</span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded font-bold">
                    پیشنهادی
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  شامل رنگ‌ها، بافت، متریال و هندسه کامل. مناسب Three.js، یونیتی، آنریل انجین و AR.
                </p>
              </div>
            </div>
            <div>
              {downloadSuccess === 'glb' ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <Download className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              )}
            </div>
          </button>

          {/* OBJ Option */}
          <button
            onClick={() => handleExport('obj')}
            disabled={!!downloadingFormat}
            className="w-full text-right p-4 rounded-xl border border-studio-700 bg-studio-900/60 hover:bg-studio-700/50 hover:border-sky-500/50 transition flex items-center justify-between group"
          >
            <div className="flex items-start space-x-3.5 space-x-reverse">
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 mt-0.5">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="font-semibold text-sm text-white">فرمت ویوفرانت (.OBJ)</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                    CAD / بلندر
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  فرمت استاندارد صنعتی برای نرم‌افزارهای Blender، Maya، 3ds Max و موتورهای بازی.
                </p>
              </div>
            </div>
            <div>
              {downloadSuccess === 'obj' ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <Download className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              )}
            </div>
          </button>

          {/* STL Option */}
          <button
            onClick={() => handleExport('stl')}
            disabled={!!downloadingFormat}
            className="w-full text-right p-4 rounded-xl border border-studio-700 bg-studio-900/60 hover:bg-studio-700/50 hover:border-emerald-500/50 transition flex items-center justify-between group"
          >
            <div className="flex items-start space-x-3.5 space-x-reverse">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="font-semibold text-sm text-white">استریولیتوگرافی (.STL)</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                    پرینتر سه‌بعدی
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  فرمت ساختار صلب برای اسلایسرهای پرینت سه‌بعدی (Cura، PrusaSlicer، Bambu Studio).
                </p>
              </div>
            </div>
            <div>
              {downloadSuccess === 'stl' ? (
                <Check className="w-5 h-5 text-emerald-400" />
              ) : (
                <Download className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
              )}
            </div>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-studio-700 hover:bg-studio-600 text-slate-200 transition"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
