import React, { useState } from 'react';
import { X, Cloud, CheckCircle2, AlertCircle, RefreshCw, Cpu } from 'lucide-react';
import { colabApi, ColabHealthResponse } from '../services/api';

interface ColabSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  colabUrl: string;
  onSaveUrl: (url: string) => void;
  onRefreshHealth: () => Promise<ColabHealthResponse | null>;
  colabInfo: ColabHealthResponse | null;
}

export const ColabSettingsModal: React.FC<ColabSettingsModalProps> = ({
  isOpen,
  onClose,
  colabUrl,
  onSaveUrl,
  onRefreshHealth,
  colabInfo,
}) => {
  const [inputUrl, setInputUrl] = useState(colabUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    setIsTesting(true);
    setTestResult(null);

    colabApi.setUrl(inputUrl);
    onSaveUrl(inputUrl);

    try {
      const res = await onRefreshHealth();
      if (res && res.status === 'ok') {
        setTestResult({
          success: true,
          msg: `اتصال برقرار شد! پردازشگر گرافیکی: ${res.gpu_name || 'فعال'} | آماده برای ساخت مدل‌های ۳۶۰ درجه با مدل Shap-E.`,
        });
      } else {
        setTestResult({
          success: false,
          msg: 'پاسخ از سرور دریافت شد، اما پردازشگر هوش مصنوعی هنوز در حال آماده‌سازی است.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: `خطا در اتصال: ${err.message}. لطفاً بررسی کنید که سلول‌های دفترچه کولب به طور کامل اجرا شده باشند.`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in font-vazir">
      <div className="bg-studio-800 border border-studio-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-700 transition"
          title="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 space-x-reverse mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">تنظیمات سرور هوش مصنوعی Google Colab</h2>
            <p className="text-xs text-slate-400">اتصال به پردازشگر گرافیکی رایگان T4 جهت ساخت مدل‌های کامل ۳۶۰ درجه</p>
          </div>
        </div>

        {/* Quick Instructions */}
        <div className="bg-studio-900/80 rounded-xl p-3.5 border border-studio-700/60 mb-4 text-xs text-slate-300 space-y-2 leading-relaxed">
          <p className="font-semibold text-sky-300 flex items-center space-x-1.5 space-x-reverse">
            <span>راهنمای راه‌اندازی سریع سرور در ۲ دقیقه:</span>
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
            <li>
              دفترچه را در گوگل کولب باز کنید:
              <a
                href="https://colab.research.google.com/github/idwnis/3d-viwer/blob/main/backend/3d_reconstruction_colab.ipynb"
                target="_blank"
                rel="noreferrer"
                className="mr-1 text-sky-400 hover:text-sky-300 underline font-medium inline-flex items-center"
              >
                <span>باز کردن در Colab</span>
              </a>
            </li>
            <li>از منوی بالا بروید به: <strong className="text-slate-200">Runtime ← Change runtime type ← T4 GPU</strong></li>
            <li>گزینه <strong className="text-slate-200">Runtime ← Run all</strong> را بزنید تا برنامه اجرا شود.</li>
            <li>آدرس لینک Cloudflare تولید شده را (مثال: <span className="font-mono text-sky-400" dir="ltr">https://xxxx.trycloudflare.com</span>) در کادر زیر وارد کنید.</li>
          </ol>
        </div>

        {/* URL Input */}
        <div className="space-y-2 mb-4">
          <label className="block text-xs font-semibold text-slate-300">
            آدرس عمومی سرور Colab (URL)
          </label>
          <div className="flex space-x-2 space-x-reverse">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://xyz.trycloudflare.com"
              dir="ltr"
              className="flex-1 bg-studio-900 border border-studio-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono text-left"
            />
            <button
              onClick={handleTestAndSave}
              disabled={isTesting || !inputUrl.trim()}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-studio-700 disabled:text-slate-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 space-x-reverse transition shadow shrink-0"
            >
              {isTesting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>{isTesting ? 'در حال بررسی...' : 'اتصال به سرور'}</span>
            </button>
          </div>
        </div>

        {/* Status result */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 space-x-reverse mb-4 ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{testResult.success ? 'اتصال با موفقیت برقرار شد' : 'خطا در برقراری ارتباط'}</p>
              <p className="mt-0.5 text-[11px] opacity-90">{testResult.msg}</p>
            </div>
          </div>
        )}

        {/* Current Info */}
        {colabInfo && (
          <div className="bg-studio-900/60 rounded-xl p-3 border border-studio-700 text-xs mb-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center space-x-1.5 space-x-reverse">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span>سخت‌افزار سرور:</span>
              </span>
              <span className="text-white font-mono font-medium" dir="ltr">{colabInfo.gpu_name || 'NVIDIA T4'}</span>
            </div>
            {colabInfo.vram_total_gb && (
              <div className="flex items-center justify-between text-slate-400 mt-1">
                <span>حافظه کارت گرافیک (VRAM):</span>
                <span className="text-slate-300 font-mono" dir="ltr">
                  {colabInfo.vram_allocated_gb?.toFixed(2)} GB / {colabInfo.vram_total_gb?.toFixed(2)} GB
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-studio-700">
          <span className="text-[11px] text-slate-400">سرور فعال نیست؟ می‌توانید از حالت «پردازش آفلاین سیستم» در بالای صفحه استفاده کنید.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-studio-700 hover:bg-studio-600 text-slate-200 transition shrink-0"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
