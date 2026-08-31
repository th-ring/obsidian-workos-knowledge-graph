import React from 'react';
import { GraphFilterConfig } from '../types';
import { Layers, Zap, Sliders, X, Check, Eye } from 'lucide-react';

interface SettingsPillProps {
  isOpen: boolean;
  onClose: () => void;
  config: GraphFilterConfig;
  onChange: (newConfig: GraphFilterConfig) => void;
  availableWorkstreams: string[];
}

export const SettingsPill: React.FC<SettingsPillProps> = ({
  isOpen,
  onClose,
  config,
  onChange,
  availableWorkstreams,
}) => {
  if (!isOpen) return null;

  const update = (partial: Partial<GraphFilterConfig>) => {
    onChange({ ...config, ...partial });
  };

  return (
    <div className="absolute top-16 right-4 sm:right-1/2 sm:translate-x-1/2 md:translate-x-0 md:right-8 z-40 w-80 workos-glass-card rounded-2xl p-4 text-xs text-neutral-200 border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2 font-medium text-neutral-100">
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>Graph-Einstellungen & Filter</span>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Entity Type Visibility Chips */}
      <div className="mb-4">
        <div className="text-[11px] font-medium text-neutral-400 mb-2 flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-neutral-400" />
          <span>Sichtbare Entitäten</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => update({ showWorkstreams: !config.showWorkstreams })}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] transition-all ${
              config.showWorkstreams
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-200'
                : 'bg-black/20 border-white/5 text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Workstreams
            </span>
            {config.showWorkstreams && <Check className="w-3 h-3" />}
          </button>

          <button
            onClick={() => update({ showTasks: !config.showTasks })}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] transition-all ${
              config.showTasks
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-200'
                : 'bg-black/20 border-white/5 text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Tasks
            </span>
            {config.showTasks && <Check className="w-3 h-3" />}
          </button>

          <button
            onClick={() => update({ showNotes: !config.showNotes })}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] transition-all ${
              config.showNotes
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-200'
                : 'bg-black/20 border-white/5 text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              Notizen
            </span>
            {config.showNotes && <Check className="w-3 h-3" />}
          </button>

          <button
            onClick={() => update({ showBraindumps: !config.showBraindumps })}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] transition-all ${
              config.showBraindumps
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-200'
                : 'bg-black/20 border-white/5 text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Braindumps
            </span>
            {config.showBraindumps && <Check className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Workstream Filter */}
      {availableWorkstreams.length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] font-medium text-neutral-400 mb-1.5 flex items-center justify-between">
            <span>Workstream filtern</span>
            {config.activeWorkstream && (
              <button
                onClick={() => update({ activeWorkstream: null })}
                className="text-[10px] text-purple-400 hover:underline"
              >
                Zurücksetzen
              </button>
            )}
          </div>
          <select
            value={config.activeWorkstream || ''}
            onChange={(e) => update({ activeWorkstream: e.target.value || null })}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-purple-500/50"
          >
            <option value="">Alle Workstreams anzeigen</option>
            {availableWorkstreams.map((ws) => (
              <option key={ws} value={ws}>
                {ws}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Physics Sliders */}
      <div className="space-y-3 pt-2 border-t border-white/10">
        <div className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span>Graph-Physik & Dynamik</span>
        </div>

        {/* Repulsion */}
        <div>
          <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
            <span>Knoten-Abstoßung (Charge)</span>
            <span className="font-mono text-neutral-300">{Math.abs(config.repulsion)}</span>
          </div>
          <input
            type="range"
            min="-1000"
            max="-50"
            step="50"
            value={config.repulsion}
            onChange={(e) => update({ repulsion: Number(e.target.value) })}
            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* Link Distance */}
        <div>
          <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
            <span>Kantenlänge (Distance)</span>
            <span className="font-mono text-neutral-300">{config.linkDistance}px</span>
          </div>
          <input
            type="range"
            min="20"
            max="200"
            step="10"
            value={config.linkDistance}
            onChange={(e) => update({ linkDistance: Number(e.target.value) })}
            className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        {/* Link Particles Toggle */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-neutral-300 flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-purple-400" />
            Fließende Kanten-Partikel
          </span>
          <button
            onClick={() => update({ showParticles: !config.showParticles })}
            className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
              config.showParticles ? 'bg-purple-600' : 'bg-neutral-800'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                config.showParticles ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
