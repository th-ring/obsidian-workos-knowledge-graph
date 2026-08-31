import React, { useEffect, useRef } from 'react';
import ForceGraph3D from '3d-force-graph';
import { GraphData, GraphNode, GraphFilterConfig } from '../types';

interface ForceGraph3DViewProps {
  data: GraphData;
  filterConfig: GraphFilterConfig;
  selectedNode: GraphNode | null;
  onSelectNode: (node: GraphNode, pos: { x: number; y: number }) => void;
  onClearSelection: () => void;
}

// Clean clone helper to prevent D3 mutation conflicts between 2D & 3D
function cloneDataFor3D(data: GraphData) {
  return {
    nodes: data.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      path: n.path,
      type: n.type,
      workstream: n.workstream,
      status: n.status,
      priority: n.priority,
      tags: Array.isArray(n.tags) ? [...n.tags] : [],
      val: n.val || 5,
      color: n.color || '#a855f7',
      linksCount: n.linksCount,
      subtasksCount: n.subtasksCount,
      subtasksDone: n.subtasksDone,
    })),
    links: data.links.map((l) => ({
      source: typeof l.source === 'object' && l.source !== null ? (l.source as any).id : l.source,
      target: typeof l.target === 'object' && l.target !== null ? (l.target as any).id : l.target,
      type: l.type,
      color: l.color || 'rgba(168, 85, 247, 0.4)',
      particles: l.particles || 1,
    })),
  };
}

export const ForceGraph3DView: React.FC<ForceGraph3DViewProps> = ({
  data,
  filterConfig,
  selectedNode,
  onSelectNode,
  onClearSelection,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ForceGraph3DFactory = typeof ForceGraph3D === 'function' ? ForceGraph3D : (ForceGraph3D as any).default;
    if (!ForceGraph3DFactory) {
      console.error('ForceGraph3D factory not available');
      return;
    }

    // Clean container before creating WebGL canvas
    containerRef.current.innerHTML = '';

    const initialWidth = containerRef.current.clientWidth || window.innerWidth || 800;
    const initialHeight = containerRef.current.clientHeight || window.innerHeight || 600;
    const cleanData = cloneDataFor3D(data);

    // Initialize 3D Force Graph instance with WebGL renderer
    const fg = ForceGraph3DFactory()(containerRef.current)
      .width(initialWidth)
      .height(initialHeight)
      .graphData(cleanData)
      .backgroundColor('#0a0a0e')
      .showNavInfo(false)
      .nodeId('id')
      .nodeVal('val')
      .nodeRelSize(5)
      .nodeResolution(24)
      .nodeColor((n: any) => n.color || '#a855f7')
      .nodeOpacity(0.95)
      .nodeLabel((n: any) => `<div style="background:rgba(10,10,14,0.92);padding:5px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);font-family:sans-serif;font-size:12px;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.5);"><b>${n.name}</b> <span style="opacity:0.6;font-size:10px;">[${n.type.toUpperCase()}]</span></div>`)
      .linkOpacity(0.4)
      .linkColor((link: any) => link.color || 'rgba(255, 255, 255, 0.25)')
      .linkWidth((link: any) => (link.type === 'workstream_child' ? 2.5 : 1.2))
      .linkDirectionalParticles(filterConfig.showParticles ? (link: any) => link.particles || 1 : 0)
      .linkDirectionalParticleSpeed(0.006)
      .linkDirectionalParticleWidth(3)
      .linkDirectionalParticleColor((link: any) => (link.type === 'workstream_child' ? '#c084fc' : '#38bdf8'))
      .onNodeClick((node: any, event: MouseEvent) => {
        const distance = 120;
        const distRatio = 1 + distance / Math.hypot(node.x || 1, node.y || 1, node.z || 1);

        if (typeof fg.cameraPosition === 'function') {
          fg.cameraPosition(
            { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
            { x: node.x || 0, y: node.y || 0, z: node.z || 0 },
            1000
          );
        }

        const originalNode = data.nodes.find((n) => n.id === node.id) || node;
        onSelectNode(originalNode, {
          x: event.clientX || window.innerWidth / 2,
          y: event.clientY || window.innerHeight / 2,
        });
      })
      .onBackgroundClick(() => {
        onClearSelection();
      });

    // Configure 3D physics forces
    const chargeForce = fg.d3Force('charge');
    if (chargeForce && typeof chargeForce.strength === 'function') {
      chargeForce.strength(filterConfig.repulsion || -250);
    }
    const linkForce = fg.d3Force('link');
    if (linkForce && typeof linkForce.distance === 'function') {
      linkForce.distance(filterConfig.linkDistance || 70);
    }

    fgRef.current = fg;

    // Responsive Canvas Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && fgRef.current) {
          fgRef.current.width(width);
          fgRef.current.height(height);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (fgRef.current) {
        try {
          fgRef.current.pauseAnimation?.();
          fgRef.current._destructor?.();
        } catch (e) {
          // ignore
        }
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  // Update data when data changes
  useEffect(() => {
    if (fgRef.current && data.nodes.length > 0) {
      const cleanData = cloneDataFor3D(data);
      fgRef.current.graphData(cleanData);
      fgRef.current.d3ReheatSimulation?.();
    }
  }, [data]);

  // Update physics forces when filter config changes
  useEffect(() => {
    if (fgRef.current) {
      const chargeForce = fgRef.current.d3Force('charge');
      if (chargeForce && typeof chargeForce.strength === 'function') {
        chargeForce.strength(filterConfig.repulsion || -250);
      }
      const linkForce = fgRef.current.d3Force('link');
      if (linkForce && typeof linkForce.distance === 'function') {
        linkForce.distance(filterConfig.linkDistance || 70);
      }
      fgRef.current.linkDirectionalParticles(filterConfig.showParticles ? (link: any) => link.particles || 1 : 0);
      fgRef.current.d3ReheatSimulation?.();
    }
  }, [filterConfig]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing bg-[#0a0a0e]"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    />
  );
};
