import React from 'react';
import { ViewMode, GraphFilterConfig } from '../types';
import { Network, Box, GitFork, Search, SlidersHorizontal, RefreshCw, X } from 'lucide-react';

interface GraphHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
  onRefresh: () => void;
  nodeCount: number;
  linkCount: number;
}

export const GraphHeader: React.FC<GraphHeaderProps> = ({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  isSettingsOpen,
  onToggleSettings,
  onRefresh,
  nodeCount,
  linkCount,
}) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-2 max-w-[95vw]">
      {/* Main Floating Glass Pill */}
      <div className="workos-glass-pill flex items-center gap-1.5 p-1.5 rounded-full text-xs text-neutral-200">
        
        {/* Brand / Title */}
        <div className="flex items-center gap-2 pl-3 pr-2 py-1 text-neutral-300 font-medium">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-sm">
            <Network className="w-3 h-3" />
          </div>
          <span className="hidden sm:inline tracking-tight font-semibold text-neutral-100">WorkOS Graph</span>
          <span className="text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
            {nodeCount} Nodes · {linkCount} Links
          </span>
        </div>

        <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

        {/* View Mode Segmented Controls */}
        <div className="flex items-center bg-black/40 p-0.5 rounded-full border border-white/5">
          <button
            onClick={() => onViewModeChange('2d')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-200 ${
              viewMode === '2d'
                ? 'bg-neutral-800 text-white shadow-sm font-medium border border-white/10'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
            title="2D Force-Directed Canvas Graph"
          >
            <Network className="w-3.5 h-3.5" />
            <span>2D Force</span>
          </button>

          <button
            onClick={() => onViewModeChange('3d')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-200 ${
              viewMode === '3d'
                ? 'bg-neutral-800 text-white shadow-sm font-medium border border-white/10'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
            title="3D WebGL Force Space"
          >
            <Box className="w-3.5 h-3.5 text-cyan-400" />
            <span>3D WebGL</span>
          </button>

          <button
            onClick={() => onViewModeChange('mindmap')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-200 ${
              viewMode === 'mindmap'
                ? 'bg-neutral-800 text-white shadow-sm font-medium border border-white/10'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
            title="Hierarchical Workstream Mindmap"
          >
            <GitFork className="w-3.5 h-3.5 text-purple-400" />
            <span>Mindmap</span>
          </button>
        </div>

        <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

        {/* Instant Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Knoten suchen..."
            className="w-32 sm:w-44 bg-black/40 border border-white/5 rounded-full pl-8 pr-7 py-1 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 text-neutral-400 hover:text-neutral-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Graph neu laden"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Settings Pill Toggle */}
        <button
          onClick={onToggleSettings}
          className={`p-1.5 rounded-full transition-all ${
            isSettingsOpen
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-white hover:bg-white/10'
          }`}
          title="Filter & Physik konfigurieren"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
