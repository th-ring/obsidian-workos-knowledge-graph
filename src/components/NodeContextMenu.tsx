import React from 'react';
import { GraphNode } from '../types';
import { ExternalLink, Target, X, CheckSquare, Layers, Lock, Tag, Compass } from 'lucide-react';
import { App } from 'obsidian';

interface NodeContextMenuProps {
  node: GraphNode | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onFocusNode: (node: GraphNode) => void;
  app: App;
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  node,
  position,
  onClose,
  onFocusNode,
  app,
}) => {
  if (!node || !position) return null;

  const handleOpenFile = () => {
    app.workspace.openLinkText(node.path, '', false);
    onClose();
  };

  // Keep popover inside screen bounds
  const x = Math.min(Math.max(16, position.x), window.innerWidth - 320);
  const y = Math.min(Math.max(80, position.y), window.innerHeight - 340);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'workstream':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full text-[10px] font-medium">Workstream</span>;
      case 'task':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full text-[10px] font-medium">Task</span>;
      case 'note':
        return <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full text-[10px] font-medium">Note</span>;
      case 'braindump':
        return <span className="bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full text-[10px] font-medium">Braindump</span>;
      default:
        return <span className="bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full text-[10px]">Dokument</span>;
    }
  };

  return (
    <div
      style={{ left: `${x}px`, top: `${y}px` }}
      className="fixed z-50 w-72 workos-glass-card rounded-2xl p-4 text-xs text-neutral-200 border border-white/15 shadow-2xl animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2.5 pb-2 border-b border-white/10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {getTypeBadge(node.type)}
            {node.status && (
              <span className="text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 capitalize">
                {node.status.replace('_', ' ')}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-neutral-100 truncate" title={node.name}>
            {node.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body Details */}
      <div className="space-y-2 mb-3">
        {node.workstream && (
          <div className="flex items-center gap-2 text-neutral-300">
            <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">
              Workstream: <span className="text-purple-300 font-medium">{node.workstream}</span>
            </span>
          </div>
        )}

        {node.type === 'task' && node.subtasksCount !== undefined && node.subtasksCount > 0 && (
          <div className="flex items-center gap-2 text-neutral-300">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Subtasks: <span className="font-mono text-white">{node.subtasksDone}/{node.subtasksCount}</span> erledigt
            </span>
          </div>
        )}

        {node.locked_by && (
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg text-[11px]">
            <Lock className="w-3 h-3 shrink-0" />
            <span className="truncate">Gesperrt durch: {node.locked_by}</span>
          </div>
        )}

        {node.tags && node.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {node.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[10px] text-neutral-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full"
              >
                <Tag className="w-2.5 h-2.5 text-neutral-500" />
                {tag}
              </span>
            ))}
            {node.tags.length > 4 && (
              <span className="text-[10px] text-neutral-500 px-1 py-0.5">+{node.tags.length - 4}</span>
            )}
          </div>
        )}

        <div className="text-[10px] text-neutral-500 font-mono truncate pt-1">
          {node.path}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
        <button
          onClick={handleOpenFile}
          className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition-colors shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>In Obsidian öffnen</span>
        </button>

        <button
          onClick={() => onFocusNode(node)}
          className="flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 text-neutral-200 py-1.5 px-2.5 rounded-lg text-xs transition-colors"
          title="Im Graph fokussieren"
        >
          <Target className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
