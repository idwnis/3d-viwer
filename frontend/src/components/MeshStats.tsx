import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';

export interface ModelMetrics {
  vertexCount: number;
  faceCount: number;
  dimensions: { x: number; y: number; z: number };
  engine: 'colab' | 'offline';
}

interface MeshStatsProps {
  metrics: ModelMetrics | null;
}

export const MeshStats: React.FC<MeshStatsProps> = ({ metrics }) => {
  if (!metrics) return null;

  return (
    <div className="absolute bottom-4 left-4 bg-studio-800/85 backdrop-blur-md border border-studio-700/80 rounded-xl p-3 shadow-xl z-20 text-xs text-slate-300 pointer-events-none select-none">
      <div className="flex items-center space-x-2 font-semibold text-slate-200 border-b border-studio-700 pb-1.5 mb-2">
        <Activity className="w-3.5 h-3.5 text-sky-400" />
        <span>Mesh Geometry Telemetry</span>
        {metrics.engine === 'offline' && (
          <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3" />
            <span>3D Printable Solid</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
        <div>
          <span className="text-slate-500">Vertices: </span>
          <span className="text-sky-300 font-medium">{metrics.vertexCount.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-slate-500">Triangles: </span>
          <span className="text-sky-300 font-medium">{metrics.faceCount.toLocaleString()}</span>
        </div>
        <div className="col-span-2 text-slate-500 mt-1">
          Bounding Box: <span className="text-slate-300">{metrics.dimensions.x.toFixed(2)} × {metrics.dimensions.y.toFixed(2)} × {metrics.dimensions.z.toFixed(2)} units</span>
        </div>
      </div>
    </div>
  );
};
