import React, { useEffect, useRef } from 'react';
import ForceGraph from 'force-graph';
import { GraphData, GraphNode, GraphFilterConfig } from '../types';

interface ForceGraph2DViewProps {
  data: GraphData;
  filterConfig: GraphFilterConfig;
  selectedNode: GraphNode | null;
  onSelectNode: (node: GraphNode, pos: { x: number; y: number }) => void;
  onClearSelection: () => void;
}

function cloneDataFor2D(data: GraphData) {
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
      color: n.color || '#64748b',
      linksCount: n.linksCount,
      subtasksCount: n.subtasksCount,
      subtasksDone: n.subtasksDone,
    })),
    links: data.links.map((l) => ({
      source: typeof l.source === 'object' && l.source !== null ? (l.source as any).id : l.source,
      target: typeof l.target === 'object' && l.target !== null ? (l.target as any).id : l.target,
      type: l.type,
      color: l.color,
      particles: l.particles,
    })),
  };
}

export const ForceGraph2DView: React.FC<ForceGraph2DViewProps> = ({
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

    const ForceGraphFactory = typeof ForceGraph === 'function' ? ForceGraph : (ForceGraph as any).default;
    if (!ForceGraphFactory) {
      console.error('ForceGraph2D factory not available');
      return;
    }

    containerRef.current.innerHTML = '';

    const initialWidth = containerRef.current.clientWidth || window.innerWidth || 800;
    const initialHeight = containerRef.current.clientHeight || window.innerHeight || 600;
    const cleanData = cloneDataFor2D(data);

    // Initialize 2D Force Graph instance
    const fg = ForceGraphFactory()(containerRef.current)
      .width(initialWidth)
      .height(initialHeight)
      .graphData(cleanData)
      .backgroundColor('#0a0a0e')
      .nodeId('id')
      .nodeVal('val')
      .nodeLabel((n: GraphNode) => `${n.name} (${n.type})`)
      .nodeCanvasObject((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const isSelected = selectedNode?.id === node.id;
        const isWorkstream = node.type === 'workstream';
        const radius = Math.max(3, Math.sqrt(node.val || 5) * 2.5);

        // 1. Draw glowing outer halo for Workstreams or selected nodes
        if (isWorkstream || isSelected) {
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, radius + (isSelected ? 6 : 4), 0, 2 * Math.PI, false);
          ctx.fillStyle = isSelected ? 'rgba(236, 72, 153, 0.4)' : 'rgba(168, 85, 247, 0.3)';
          ctx.fill();
        }

        // 2. Core Circle
        ctx.beginPath();
        ctx.arc(node.x || 0, node.y || 0, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = node.color || '#64748b';
        ctx.fill();
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();

        // 3. Render Node Label
        const showLabel = globalScale > 0.8 || isWorkstream || isSelected;
        if (showLabel) {
          const label = node.name || 'Dokument';
          const fontSize = Math.max(10 / globalScale, isWorkstream ? 13 / globalScale : 10 / globalScale);
          ctx.font = `${isWorkstream || isSelected ? '600' : '400'} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth + 8 / globalScale, fontSize + 5 / globalScale];

          // Label background pill
          ctx.fillStyle = 'rgba(10, 10, 14, 0.88)';
          ctx.beginPath();
          ctx.roundRect(
            (node.x || 0) - bckgDimensions[0] / 2,
            (node.y || 0) + radius + 3 / globalScale,
            bckgDimensions[0],
            bckgDimensions[1],
            4 / globalScale
          );
          ctx.fill();

          // Border on label
          ctx.lineWidth = 1 / globalScale;
          ctx.strokeStyle = isWorkstream ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.1)';
          ctx.stroke();

          // Label text
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isSelected ? '#ffffff' : isWorkstream ? '#e9d5ff' : '#d4d4d8';
          ctx.fillText(label, node.x || 0, (node.y || 0) + radius + 3 / globalScale + bckgDimensions[1] / 2);
        }
      })
      .nodeCanvasObjectMode(() => 'after')
      .linkColor((link: any) => link.color || 'rgba(255, 255, 255, 0.18)')
      .linkWidth((link: any) => (link.type === 'workstream_child' ? 1.8 : 1))
      .linkDirectionalParticles(filterConfig.showParticles ? (link: any) => link.particles || 1 : 0)
      .linkDirectionalParticleSpeed(0.005)
      .linkDirectionalParticleWidth(2)
      .linkDirectionalParticleColor((link: any) => (link.type === 'workstream_child' ? '#c084fc' : '#38bdf8'))
      .onNodeClick((node: any, event: MouseEvent) => {
        const originalNode = data.nodes.find((n) => n.id === node.id) || node;
        onSelectNode(originalNode, { x: event.clientX, y: event.clientY });
      })
      .onBackgroundClick(() => {
        onClearSelection();
      });

    // Configure physics forces safely
    const chargeForce = fg.d3Force('charge');
    if (chargeForce && typeof chargeForce.strength === 'function') {
      chargeForce.strength(filterConfig.repulsion || -250);
    }
    const linkForce = fg.d3Force('link');
    if (linkForce && typeof linkForce.distance === 'function') {
      linkForce.distance(filterConfig.linkDistance || 60);
    }

    fgRef.current = fg;

    // Use ResizeObserver for responsive canvas scaling
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

  // Update graph data when data changes
  useEffect(() => {
    if (fgRef.current && data.nodes.length > 0) {
      const cleanData = cloneDataFor2D(data);
      fgRef.current.graphData(cleanData);
      setTimeout(() => {
        fgRef.current?.zoomToFit?.(400, 40);
      }, 150);
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
        linkForce.distance(filterConfig.linkDistance || 60);
      }
      fgRef.current.linkDirectionalParticles(filterConfig.showParticles ? (link: any) => link.particles || 1 : 0);
      fgRef.current.d3ReheatSimulation?.();
    }
  }, [filterConfig]);

  // Focus selected node or search match
  useEffect(() => {
    if (selectedNode && fgRef.current && selectedNode.x !== undefined && selectedNode.y !== undefined) {
      fgRef.current.centerAt(selectedNode.x, selectedNode.y, 800);
      fgRef.current.zoom(2.0, 800);
    }
  }, [selectedNode]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing bg-[#0a0a0e]"
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    />
  );
};
