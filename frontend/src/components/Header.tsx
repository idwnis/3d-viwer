import React from 'react';
import { Box, Cloud, Cpu, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import { ColabHealthResponse } from '../services/api';

interface HeaderProps {
  engineMode: 'colab' | 'offline';
  onToggleEngine: (mode: 'colab' | 'offline') => void;
  colabStatus: 'connected' | 'disconnected' | 'checking';
  colabInfo: ColabHealthResponse | null;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  engineMode,
  onToggleEngine,
  colabStatus,
  colabInfo,
  onOpenSettings
}) => {
  return (
    <header className="h-14 border-b border-studio-700 bg-studio-800/90 backdrop-blur px-5 flex items-center justify-between z-30 select-none">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Box className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm tracking-wide text-white">3D VISION STUDIO</span>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              CE Final Project
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Single-Image 3D Reconstruction & CAD Studio</p>
        </div>
      </div>

      {/* Center Engine Switcher */}
      <div className="flex items-center bg-studio-900 p-1 rounded-xl border border-studio-700">
        <button
          onClick={() => onToggleEngine('colab')}
          className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            engineMode === 'colab'
              ? 'bg-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Colab AI (360°)</span>
        </button>
        <button
          onClick={() => onToggleEngine('offline')}
          className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            engineMode === 'offline'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Universal CPU (Offline)</span>
        </button>
      </div>

      {/* Right: Colab Connection status & Settings */}
      <div className="flex items-center space-x-3">
        {engineMode === 'colab' ? (
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-2 px-2.5 py-1 rounded-lg text-xs font-medium bg-studio-700/60 hover:bg-studio-700 border border-studio-600 transition-colors"
          >
            {colabStatus === 'connected' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Colab Online</span>
                {colabInfo?.gpu_name && (
                  <span className="text-slate-400 text-[10px] hidden md:inline">({colabInfo.gpu_name})</span>
                )}
              </>
            ) : colabStatus === 'checking' ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                <span className="text-amber-400">Checking...</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400">Colab Offline</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-800/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Zero-GPU Mode Active</span>
          </div>
        )}

        <button
          onClick={onOpenSettings}
          title="Colab & Pipeline Settings"
          className="p-1.5 rounded-lg bg-studio-700/60 hover:bg-studio-700 text-slate-300 hover:text-white border border-studio-600 transition"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
