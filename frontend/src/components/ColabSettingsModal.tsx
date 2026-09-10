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
          msg: `Connected! GPU: ${res.gpu_name || 'Active'} | Ready for 360° AI Mesh generation.`,
        });
      } else {
        setTestResult({
          success: false,
          msg: 'Server responded, but GPU is not ready yet.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: `Connection error: ${err.message}. Make sure your Colab notebook is running cell 3 & 4.`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-studio-800 border border-studio-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-studio-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Google Colab Backend Settings</h2>
            <p className="text-xs text-slate-400">Connect to free T4 GPU backend for 360° AI 3D generation</p>
          </div>
        </div>

        {/* Quick Instructions */}
        <div className="bg-studio-900/80 rounded-xl p-3.5 border border-studio-700/60 mb-4 text-xs text-slate-300 space-y-2">
          <p className="font-semibold text-sky-300 flex items-center space-x-1.5">
            <span>How to launch the Google Colab Backend in 2 minutes:</span>
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-400">
            <li>
              Open notebook in Google Colab:
              <a
                href="https://colab.research.google.com/github/idwnis/3d-viwer/blob/main/backend/3d_reconstruction_colab.ipynb"
                target="_blank"
                rel="noreferrer"
                className="ml-1 text-sky-400 hover:text-sky-300 underline font-medium inline-flex items-center space-x-1"
              >
                <span>Open in Colab</span>
              </a>
            </li>
            <li>Select <strong className="text-slate-200">Runtime → Change runtime type → T4 GPU</strong>.</li>
            <li>Click <strong className="text-slate-200">Runtime → Run all</strong>.</li>
            <li>Copy the generated Cloudflare tunnel URL (e.g. <span className="font-mono text-sky-400">https://xxxx.trycloudflare.com</span>) and paste below.</li>
          </ol>
        </div>

        {/* URL Input */}
        <div className="space-y-2 mb-4">
          <label className="block text-xs font-semibold text-slate-300">
            Colab Public API URL
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://xyz.trycloudflare.com"
              className="flex-1 bg-studio-900 border border-studio-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
            />
            <button
              onClick={handleTestAndSave}
              disabled={isTesting || !inputUrl.trim()}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-studio-700 disabled:text-slate-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition shadow"
            >
              {isTesting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>{isTesting ? 'Testing...' : 'Connect'}</span>
            </button>
          </div>
        </div>

        {/* Status result */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 mb-4 ${
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
              <p className="font-semibold">{testResult.success ? 'Connected Successfully' : 'Connection Failed'}</p>
              <p className="mt-0.5 text-[11px] opacity-90">{testResult.msg}</p>
            </div>
          </div>
        )}

        {/* Current Info */}
        {colabInfo && (
          <div className="bg-studio-900/60 rounded-xl p-3 border border-studio-700 text-xs mb-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span>Backend Hardware:</span>
              </span>
              <span className="text-white font-mono font-medium">{colabInfo.gpu_name || 'NVIDIA T4'}</span>
            </div>
            {colabInfo.vram_total_gb && (
              <div className="flex items-center justify-between text-slate-400 mt-1">
                <span>VRAM Memory:</span>
                <span className="text-slate-300 font-mono">
                  {colabInfo.vram_allocated_gb?.toFixed(2)} GB / {colabInfo.vram_total_gb?.toFixed(2)} GB
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-studio-700">
          <span className="text-[11px] text-slate-500">No Colab GPU right now? Switch to Offline CPU mode in the header.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-studio-700 hover:bg-studio-600 text-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
