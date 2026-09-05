import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { App } from 'obsidian';
import { GraphData, GraphNode, ViewMode, GraphFilterConfig } from '../types';
import { parseGraphData } from '../parser';
import { GraphHeader } from './GraphHeader';
import { ForceGraph2DView } from './ForceGraph2DView';
import { ForceGraph3DView } from './ForceGraph3DView';
import { MindmapView } from './MindmapView';
import { NodeContextMenu } from './NodeContextMenu';
import { SettingsPill } from './SettingsPill';
import { Loader2 } from 'lucide-react';

interface GraphAppProps {
  app: App;
}

const DEFAULT_CONFIG: GraphFilterConfig = {
  showWorkstreams: true,
  showTasks: true,
  showNotes: true,
  showBraindumps: true,
  showTags: false,
  activeWorkstream: null,
  activeTag: null,
  repulsion: -250,
  linkDistance: 65,
  showParticles: true,
  searchQuery: '',
};

export const GraphApp: React.FC<GraphAppProps> = ({ app }) => {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterConfig, setFilterConfig] = useState<GraphFilterConfig>(DEFAULT_CONFIG);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  
  // Selected node and context menu state
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  // Load vault graph data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const graphData = await parseGraphData(app, filterConfig);
      setData(graphData);
    } catch (e) {
      console.error('Error parsing WorkOS graph data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [app, filterConfig]);

  const loadDataRef = React.useRef(loadData);
  loadDataRef.current = loadData;

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let timer: number | null = null;
    const onVaultChange = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        loadDataRef.current();
      }, 250);
    };

    const modifyEvent = app.vault.on('modify', onVaultChange);
    const deleteEvent = app.vault.on('delete', onVaultChange);
    const createEvent = app.vault.on('create', onVaultChange);

    return () => {
      if (timer !== null) window.clearTimeout(timer);
      app.vault.offref(modifyEvent);
      app.vault.offref(deleteEvent);
      app.vault.offref(createEvent);
    };
  }, [app]);

  // Extract unique workstream names for settings filter
  const availableWorkstreams = useMemo(() => {
    const wsSet = new Set<string>();
    data.nodes.forEach((n) => {
      if (n.type === 'workstream') wsSet.add(n.name);
      else if (n.workstream) wsSet.add(n.workstream);
    });
    return Array.from(wsSet);
  }, [data]);

  // Handle Search filtering and node focusing
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) return;

    const match = data.nodes.find((n) =>
      n.name.toLowerCase().includes(query.toLowerCase()) ||
      n.path.toLowerCase().includes(query.toLowerCase())
    );

    if (match) {
      setSelectedNode(match);
      setMenuPosition({ x: window.innerWidth / 2 - 140, y: window.innerHeight / 2 - 100 });
    }
  };

  const handleSelectNode = (node: GraphNode, pos: { x: number; y: number }) => {
    setSelectedNode(node);
    setMenuPosition(pos);
  };

  const handleClearSelection = () => {
    setSelectedNode(null);
    setMenuPosition(null);
  };

  const handleFocusNode = (node: GraphNode) => {
    setSelectedNode(node);
  };

  return (
    <div
      className="relative w-full h-full bg-[#0a0a0e] text-neutral-100 overflow-hidden select-none font-sans"
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      {/* Floating Header Toolbar */}
      <GraphHeader
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          handleClearSelection();
        }}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        isSettingsOpen={isSettingsOpen}
        onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
        onRefresh={loadData}
        nodeCount={data.nodes.length}
        linkCount={data.links.length}
      />

      {/* Floating Settings Pill / Popover */}
      <SettingsPill
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={filterConfig}
        onChange={setFilterConfig}
        availableWorkstreams={availableWorkstreams}
      />

      {/* Floating Node Context Popover */}
      <NodeContextMenu
        node={selectedNode}
        position={menuPosition}
        onClose={handleClearSelection}
        onFocusNode={handleFocusNode}
        app={app}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0a0a0e]/80 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            <span className="text-xs text-neutral-400 tracking-wide">Lade WorkOS Knowledge Graph...</span>
          </div>
        </div>
      )}

      {/* Main View Renderers with Isolated Absolute Viewports */}
      <div className="w-full h-full absolute inset-0" style={{ width: '100%', height: '100%' }}>
        {viewMode === '2d' && (
          <ForceGraph2DView
            data={data}
            filterConfig={filterConfig}
            selectedNode={selectedNode}
            onSelectNode={handleSelectNode}
            onClearSelection={handleClearSelection}
          />
        )}

        {viewMode === '3d' && (
          <ForceGraph3DView
            data={data}
            filterConfig={filterConfig}
            selectedNode={selectedNode}
            onSelectNode={handleSelectNode}
            onClearSelection={handleClearSelection}
          />
        )}

        {viewMode === 'mindmap' && (
          <MindmapView
            data={data}
            app={app}
            onSelectNode={handleSelectNode}
          />
        )}
      </div>
    </div>
  );
};
