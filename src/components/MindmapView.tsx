import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { GraphData, GraphNode, WorkOSEntityType } from '../types';
import { getNodeColor } from '../parser';
import { Layers, FileText, CheckSquare, Sparkles, ExternalLink, Plus, Minus, Maximize2, RotateCcw, ZoomIn, ZoomOut, Hash } from 'lucide-react';
import { App } from 'obsidian';

interface MindmapViewProps {
  data: GraphData;
  app: App;
  onSelectNode: (node: GraphNode, pos: { x: number; y: number }) => void;
}

interface MindmapLayoutNode {
  id: string;
  name: string;
  type: WorkOSEntityType;
  path: string;
  status?: string;
  priority?: string;
  subtasksCount?: number;
  subtasksDone?: number;
  tags?: string[];
  side: 'root' | 'left' | 'right';
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  children: MindmapLayoutNode[];
  collapsed: boolean;
  color: string;
}

export const MindmapView: React.FC<MindmapViewProps> = ({ data, app, onSelectNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});
  
  // Pan & Zoom state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Center view on mount
  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setPan({ x: clientWidth / 2, y: clientHeight / 2 });
      setZoom(0.9);
    }
  }, []);

  const toggleCollapse = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCollapsedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenDoc = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (path) {
      app.workspace.openLinkText(path, '', false);
    }
  };

  const handleNodeClick = (node: MindmapLayoutNode, e: React.MouseEvent) => {
    e.stopPropagation();
    const fullNode = data.nodes.find((n) => n.id === node.id);
    if (fullNode) {
      onSelectNode(fullNode, { x: e.clientX, y: e.clientY });
    }
  };

  // Build Mindmap 2-way Radiating Tree Layout
  const layout = useMemo(() => {
    const workstreams = data.nodes.filter((n) => n.type === 'workstream');
    const globalTasks = data.nodes.filter((n) => n.type === 'task' && !n.workstream);
    const globalNotes = data.nodes.filter((n) => n.type === 'note' && !n.workstream);
    const braindumps = data.nodes.filter((n) => n.type === 'braindump');

    // Create root node
    const root: MindmapLayoutNode = {
      id: 'root-workos',
      name: 'Obsidian WorkOS',
      type: 'other',
      path: '',
      side: 'root',
      depth: 0,
      x: 0,
      y: 0,
      width: 180,
      height: 48,
      children: [],
      collapsed: false,
      color: '#a855f7',
    };

    // Primary branches to distribute Left & Right
    interface RawBranch {
      id: string;
      name: string;
      type: WorkOSEntityType;
      path: string;
      status?: string;
      priority?: string;
      tags?: string[];
      children: GraphNode[];
    }

    const rawBranches: RawBranch[] = [];

    // 1. Workstream Branches
    workstreams.forEach((ws) => {
      const childNodes = data.nodes.filter(
        (n) => n.id !== ws.id && n.workstream && (
          n.workstream.toLowerCase() === ws.name.toLowerCase() ||
          ws.path.toLowerCase().includes(`/${n.workstream.toLowerCase()}/`) ||
          n.path.toLowerCase().includes(`/${ws.name.toLowerCase()}/`)
        )
      );

      rawBranches.push({
        id: ws.id,
        name: ws.name,
        type: 'workstream',
        path: ws.path,
        status: ws.status,
        priority: ws.priority,
        tags: ws.tags,
        children: childNodes,
      });
    });

    // 2. Global Tasks
    if (globalTasks.length > 0) {
      rawBranches.push({
        id: 'branch-global-tasks',
        name: 'Globale Tasks',
        type: 'task',
        path: '10_Tasks',
        children: globalTasks,
      });
    }

    // 3. Global Notes
    if (globalNotes.length > 0) {
      rawBranches.push({
        id: 'branch-global-notes',
        name: 'Wissensnotizen',
        type: 'note',
        path: '30_Notes',
        children: globalNotes,
      });
    }

    // 4. Braindumps
    if (braindumps.length > 0) {
      rawBranches.push({
        id: 'branch-braindumps',
        name: 'Inbox Braindumps',
        type: 'braindump',
        path: '00_Inbox',
        children: braindumps,
      });
    }

    // Split branches evenly: Right side and Left side
    const rightBranches: RawBranch[] = [];
    const leftBranches: RawBranch[] = [];

    rawBranches.forEach((b, idx) => {
      if (idx % 2 === 0) rightBranches.push(b);
      else leftBranches.push(b);
    });

    // Layout function for a subtree on one side
    const layoutSide = (branches: RawBranch[], side: 'left' | 'right'): MindmapLayoutNode[] => {
      const xOffset = side === 'right' ? 260 : -260;
      const childXOffset = side === 'right' ? 560 : -560;
      const nodeWidth = 200;
      const childWidth = 220;
      const nodeHeight = 44;
      const childHeight = 38;
      const vGap = 16;

      // Calculate total height of each branch including children
      const branchHeights: number[] = branches.map((b) => {
        const isCollapsed = collapsedMap[b.id] ?? false;
        if (isCollapsed || b.children.length === 0) {
          return nodeHeight + vGap;
        }
        return Math.max(nodeHeight, b.children.length * (childHeight + vGap));
      });

      const totalSideHeight = branchHeights.reduce((acc, h) => acc + h, 0);
      let currentY = -totalSideHeight / 2;

      return branches.map((b, bIdx) => {
        const bHeight = branchHeights[bIdx];
        const branchY = currentY + bHeight / 2 - nodeHeight / 2;
        const isCollapsed = collapsedMap[b.id] ?? false;

        const layoutNode: MindmapLayoutNode = {
          id: b.id,
          name: b.name,
          type: b.type,
          path: b.path,
          status: b.status,
          priority: b.priority,
          tags: b.tags,
          side,
          depth: 1,
          x: side === 'right' ? xOffset : xOffset - nodeWidth,
          y: branchY,
          width: nodeWidth,
          height: nodeHeight,
          children: [],
          collapsed: isCollapsed,
          color: getNodeColor(b.type, b.status),
        };

        // Layout child items if not collapsed
        if (!isCollapsed && b.children.length > 0) {
          const totalChildrenHeight = b.children.length * (childHeight + vGap);
          let childYStart = branchY + nodeHeight / 2 - totalChildrenHeight / 2;

          layoutNode.children = b.children.map((child, cIdx) => {
            const cY = childYStart + cIdx * (childHeight + vGap);
            return {
              id: child.id,
              name: child.name,
              type: child.type,
              path: child.path,
              status: child.status,
              priority: child.priority,
              subtasksCount: child.subtasksCount,
              subtasksDone: child.subtasksDone,
              tags: child.tags,
              side,
              depth: 2,
              x: side === 'right' ? childXOffset : childXOffset - childWidth,
              y: cY,
              width: childWidth,
              height: childHeight,
              children: [],
              collapsed: false,
              color: getNodeColor(child.type, child.status),
            };
          });
        }

        currentY += bHeight;
        return layoutNode;
      });
    };

    const rightNodes = layoutSide(rightBranches, 'right');
    const leftNodes = layoutSide(leftBranches, 'left');

    root.children = [...rightNodes, ...leftNodes];
    return root;
  }, [data, collapsedMap]);

  // Pan & Zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(0.3, zoom * zoomFactor), 3);
    setZoom(newZoom);
  };

  const handleResetZoom = () => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setPan({ x: clientWidth / 2, y: clientHeight / 2 });
      setZoom(0.9);
    }
  };

  // Generate cubic bezier curve path string
  const renderCurve = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string
  ) => {
    const dx = Math.abs(toX - fromX) * 0.5;
    const pathD = `M ${fromX} ${fromY} C ${fromX + (toX > fromX ? dx : -dx)} ${fromY}, ${toX - (toX > fromX ? dx : -dx)} ${toY}, ${toX} ${toY}`;

    return (
      <path
        key={`${fromX}-${fromY}->${toX}-${toY}`}
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />
    );
  };

  const getEntityIcon = (type: WorkOSEntityType) => {
    switch (type) {
      case 'workstream':
        return <Layers className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      case 'task':
        return <CheckSquare className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
      case 'note':
        return <FileText className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'braindump':
        return <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />;
      default:
        return <Hash className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
    }
  };

  // Collect all links to render in SVG
  const curves: React.ReactNode[] = [];

  // Root to branches
  layout.children.forEach((branch) => {
    const isRight = branch.side === 'right';
    const fromX = isRight ? layout.width / 2 : -layout.width / 2;
    const fromY = 0;
    const toX = isRight ? branch.x : branch.x + branch.width;
    const toY = branch.y + branch.height / 2;

    curves.push(renderCurve(fromX, fromY, toX, toY, branch.color));

    // Branch to children
    if (!branch.collapsed && branch.children.length > 0) {
      const bFromX = isRight ? branch.x + branch.width : branch.x;
      const bFromY = branch.y + branch.height / 2;

      branch.children.forEach((child) => {
        const cToX = isRight ? child.x : child.x + child.width;
        const cToY = child.y + child.height / 2;
        curves.push(renderCurve(bFromX, bFromY, cToX, cToY, child.color));
      });
    }
  });

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className={`w-full h-full relative overflow-hidden bg-[#0a0a0e] select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Floating Canvas Controls (Bottom Right) */}
      <div className="absolute bottom-6 right-6 z-30 flex items-center gap-1.5 workos-glass-pill p-1.5 rounded-full border border-white/10 shadow-2xl">
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.15, 3))}
          className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10"
          title="Vergrößern"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z * 0.85, 0.3))}
          className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10"
          title="Verkleinern"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />
        <button
          onClick={handleResetZoom}
          className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10"
          title="Zentrieren & Zurücksetzen"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono text-neutral-400 px-2">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Mindmap Interactive Canvas */}
      <div
        className="absolute origin-top-left transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: '0px',
          height: '0px',
        }}
      >
        {/* SVG Bezier Connection Lines Layer */}
        <svg
          className="absolute overflow-visible pointer-events-none"
          style={{ left: 0, top: 0, width: '1px', height: '1px' }}
        >
          {curves}
        </svg>

        {/* Central Root Node */}
        <div
          style={{
            transform: `translate(-${layout.width / 2}px, -${layout.height / 2}px)`,
            width: `${layout.width}px`,
            height: `${layout.height}px`,
          }}
          className="absolute z-20 flex items-center justify-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-900/90 to-cyan-900/90 border border-purple-500/50 shadow-2xl backdrop-blur-xl text-white font-semibold text-xs tracking-wide"
        >
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shadow-inner">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <span>{layout.name}</span>
        </div>

        {/* Level 1 & Level 2 Nodes */}
        {layout.children.map((branch) => {
          const isRight = branch.side === 'right';

          return (
            <React.Fragment key={branch.id}>
              {/* Branch Node (Workstream / Group) */}
              <div
                style={{
                  transform: `translate(${branch.x}px, ${branch.y}px)`,
                  width: `${branch.width}px`,
                  height: `${branch.height}px`,
                }}
                onClick={(e) => handleNodeClick(branch, e)}
                className="absolute z-10 flex items-center justify-between px-3 py-1.5 rounded-xl workos-glass-card border border-white/15 hover:border-purple-400/50 shadow-lg cursor-pointer group transition-all"
              >
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <div className="w-5 h-5 rounded-md bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                    {getEntityIcon(branch.type)}
                  </div>
                  <span className="text-xs font-semibold text-neutral-100 group-hover:text-purple-300 truncate transition-colors">
                    {branch.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {branch.path && (
                    <button
                      onClick={(e) => handleOpenDoc(branch.path, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-white hover:bg-white/10 rounded transition-all"
                      title="In Obsidian öffnen"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                  {/* Collapse Toggle */}
                  <button
                    onClick={(e) => toggleCollapse(branch.id, e)}
                    className="p-1 text-neutral-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                  >
                    {branch.collapsed ? (
                      <Plus className="w-3 h-3 text-purple-400" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Child Nodes (Tasks / Notes) */}
              {!branch.collapsed &&
                branch.children.map((child) => (
                  <div
                    key={child.id}
                    style={{
                      transform: `translate(${child.x}px, ${child.y}px)`,
                      width: `${child.width}px`,
                      height: `${child.height}px`,
                    }}
                    onClick={(e) => handleNodeClick(child, e)}
                    className="absolute z-10 flex items-center justify-between px-2.5 py-1 rounded-lg bg-black/60 border border-white/10 hover:border-white/25 shadow-md cursor-pointer group/child transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      {getEntityIcon(child.type)}
                      <span className="text-[11px] font-medium text-neutral-300 group-hover/child:text-white truncate">
                        {child.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {child.status && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-neutral-400 capitalize font-mono">
                          {child.status.replace('_', ' ')}
                        </span>
                      )}
                      {child.subtasksCount !== undefined && child.subtasksCount > 0 && (
                        <span className="text-[9px] text-emerald-400 font-mono">
                          {child.subtasksDone}/{child.subtasksCount}
                        </span>
                      )}
                      <button
                        onClick={(e) => handleOpenDoc(child.path, e)}
                        className="opacity-0 group-hover/child:opacity-100 p-0.5 text-neutral-400 hover:text-white rounded"
                        title="In Obsidian öffnen"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
