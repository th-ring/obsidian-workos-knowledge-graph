import { App, TFile } from 'obsidian';
import { GraphData, GraphNode, GraphLink, WorkOSEntityType, GraphFilterConfig, MindmapTreeNode } from './types';

// Color map for WorkOS entities
export const ENTITY_COLORS = {
  workstream: '#a855f7', // Purple Glow
  note: '#38bdf8',       // Sky Blue
  braindump: '#f97316',   // Orange
  task: {
    unprocessed: '#94a3b8',
    todo: '#64748b',
    in_progress: '#3b82f6',
    'in-progress': '#3b82f6',
    review: '#f59e0b',
    done: '#10b981',
    cancelled: '#ef4444',
  },
  tag: '#ec4899',        // Pink
  other: '#6b7280',      // Neutral gray
};

export function getNodeColor(type: WorkOSEntityType, status?: string): string {
  if (type === 'task') {
    const s = (status || 'todo').toLowerCase();
    return (ENTITY_COLORS.task as any)[s] || '#64748b';
  }
  return (ENTITY_COLORS as any)[type] || ENTITY_COLORS.other;
}

export async function parseGraphData(app: App, filterConfig?: GraphFilterConfig): Promise<GraphData> {
  const files = app.vault.getMarkdownFiles();
  const nodeMap = new Map<string, GraphNode>();
  const fileBasenameMap = new Map<string, string>(); // basename -> path
  const links: GraphLink[] = [];
  const linkSet = new Set<string>(); // avoid duplicate links

  // First pass: Index files and create Nodes
  for (const file of files) {
    if (
      file.path.startsWith('.') ||
      file.path.startsWith('_templates') ||
      file.path.startsWith('.schemas') ||
      file.path.startsWith('node_modules') ||
      file.name.toUpperCase() === 'AGENTS.MD'
    ) {
      continue;
    }

    fileBasenameMap.set(file.basename.toLowerCase(), file.path);
    fileBasenameMap.set(file.path.toLowerCase(), file.path);

    const cache = app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter || {};

    let itemType: WorkOSEntityType = (fm.type as WorkOSEntityType) || 'other';
    if (!fm.type) {
      if (file.path.startsWith('10_Tasks/') || file.path.includes('/Tasks/')) itemType = 'task';
      else if (file.path.startsWith('00_Inbox/')) itemType = 'braindump';
      else if (file.path.startsWith('20_Workstreams/') || file.path.startsWith('20_Projects/')) {
        if (file.name === 'README.md' || file.parent?.path === '20_Workstreams') {
          itemType = 'workstream';
        } else if (file.path.includes('/Notes/')) {
          itemType = 'note';
        } else if (file.path.includes('/Tasks/')) {
          itemType = 'task';
        }
      } else if (file.path.startsWith('30_Notes/') || file.path.includes('/Notes/')) {
        itemType = 'note';
      }
    }

    // Support legacy project type
    if ((itemType as string) === 'project') itemType = 'workstream';

    const title = fm.title || (file.name === 'README.md' && file.parent ? file.parent.name : file.basename);
    const rawTags = Array.isArray(fm.tags) ? fm.tags : fm.tags ? [fm.tags] : [];
    const tags = rawTags.map((t: any) => String(t).replace(/^#/, ''));

    // Extract Workstream reference
    let workstreamRef: string | undefined = fm.workstream || fm.project || undefined;
    if (!workstreamRef && file.path.startsWith('20_Workstreams/')) {
      const parts = file.path.split('/');
      if (parts.length > 2) {
        workstreamRef = parts[1];
      }
    } else if (workstreamRef) {
      workstreamRef = workstreamRef.replace(/\[\[|\]\]/g, '').trim();
    }

    // Subtasks count
    let subtaskTotal = 0;
    let subtaskDone = 0;
    try {
      const content = await app.vault.cachedRead(file);
      const matches = content.match(/^[\s]*-\s*\[([ xX])\]\s+(.+)$/gm);
      if (matches) {
        subtaskTotal = matches.length;
        subtaskDone = matches.filter((m) => /-\s*\[[xX]\]/.test(m)).length;
      }
    } catch (e) {
      // ignore
    }

    let nodeVal = 5;
    if (itemType === 'workstream') nodeVal = 14;
    else if (itemType === 'note') nodeVal = 7;
    else if (itemType === 'task') nodeVal = 5;
    else if (itemType === 'braindump') nodeVal = 4;

    const nodeColor = getNodeColor(itemType, fm.status);

    const node: GraphNode = {
      id: file.path,
      name: title,
      path: file.path,
      type: itemType,
      workstream: workstreamRef,
      status: fm.status,
      priority: fm.priority,
      agent_state: fm.agent_state,
      locked_by: fm.locked_by,
      tags,
      val: nodeVal,
      color: nodeColor,
      linksCount: 0,
      subtasksCount: subtaskTotal,
      subtasksDone: subtaskDone,
    };

    nodeMap.set(file.path, node);
  }

  // Second pass: Extract Wikilinks and Workstream Hierarchy links
  for (const [filePath, node] of nodeMap.entries()) {
    const file = app.vault.getAbstractFileByPath(filePath) as TFile;
    if (!file) continue;

    const cache = app.metadataCache.getFileCache(file);

    // 1. Link to Workstream Hub if applicable
    if (node.workstream) {
      const cleanWs = node.workstream.toLowerCase();
      // Find matching workstream node
      for (const [wsPath, wsNode] of nodeMap.entries()) {
        if (wsNode.type === 'workstream') {
          const wsBasename = wsNode.path.split('/')[1] || '';
          if (
            wsNode.name.toLowerCase() === cleanWs ||
            wsBasename.toLowerCase() === cleanWs ||
            wsNode.path.toLowerCase().includes(`/${cleanWs}/`)
          ) {
            if (wsNode.id !== node.id) {
              const linkKey = `${node.id}->${wsNode.id}`;
              if (!linkSet.has(linkKey)) {
                linkSet.add(linkKey);
                links.push({
                  source: node.id,
                  target: wsNode.id,
                  type: 'workstream_child',
                  color: 'rgba(168, 85, 247, 0.4)',
                  particles: 2,
                });
                node.linksCount++;
                wsNode.linksCount++;
              }
            }
            break;
          }
        }
      }
    }

    // 2. Extract outgoing Wikilinks
    const outgoingLinks = cache?.links || [];
    for (const linkItem of outgoingLinks) {
      const linkText = linkItem.link.split('#')[0].split('|')[0].trim();
      if (!linkText) continue;

      let targetPath = fileBasenameMap.get(linkText.toLowerCase());
      if (!targetPath) {
        const dest = app.metadataCache.getFirstLinkpathDest(linkText, file.path);
        if (dest) targetPath = dest.path;
      }

      if (targetPath && nodeMap.has(targetPath) && targetPath !== node.id) {
        const targetNode = nodeMap.get(targetPath)!;
        const linkKey = `${node.id}->${targetPath}`;
        if (!linkSet.has(linkKey)) {
          linkSet.add(linkKey);
          links.push({
            source: node.id,
            target: targetPath,
            type: 'wikilink',
            color: 'rgba(56, 189, 248, 0.35)',
            particles: 1,
          });
          node.linksCount++;
          targetNode.linksCount++;
        }
      }
    }
  }

  let nodesArray = Array.from(nodeMap.values());

  // Apply filters if provided
  if (filterConfig) {
    nodesArray = nodesArray.filter((node) => {
      if (!filterConfig.showWorkstreams && node.type === 'workstream') return false;
      if (!filterConfig.showTasks && node.type === 'task') return false;
      if (!filterConfig.showNotes && node.type === 'note') return false;
      if (!filterConfig.showBraindumps && node.type === 'braindump') return false;
      if (filterConfig.activeWorkstream && node.workstream !== filterConfig.activeWorkstream && node.name !== filterConfig.activeWorkstream) {
        return false;
      }
      return true;
    });

    const activeNodeIds = new Set(nodesArray.map((n) => n.id));
    const filteredLinks = links.filter((l) => {
      const s = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
      const t = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
      return activeNodeIds.has(s) && activeNodeIds.has(t);
    });

    return { nodes: nodesArray, links: filteredLinks };
  }

  return { nodes: nodesArray, links };
}

// Build hierarchical tree for Mindmap view
export function buildMindmapTree(graphData: GraphData): MindmapTreeNode {
  const root: MindmapTreeNode = {
    id: 'root-workos',
    name: 'Obsidian WorkOS',
    type: 'other',
    path: '',
    children: [],
  };

  const workstreams = graphData.nodes.filter((n) => n.type === 'workstream');
  const globalTasks = graphData.nodes.filter((n) => n.type === 'task' && !n.workstream);
  const globalNotes = graphData.nodes.filter((n) => n.type === 'note' && !n.workstream);
  const braindumps = graphData.nodes.filter((n) => n.type === 'braindump');

  // Add workstreams as branches
  for (const ws of workstreams) {
    const wsNode: MindmapTreeNode = {
      id: ws.id,
      name: ws.name,
      type: 'workstream',
      path: ws.path,
      status: ws.status,
      priority: ws.priority,
      tags: ws.tags,
      children: [],
    };

    // Find children linked to this workstream
    const childNodes = graphData.nodes.filter(
      (n) => n.workstream && (n.workstream.toLowerCase() === ws.name.toLowerCase() || ws.path.toLowerCase().includes(`/${n.workstream.toLowerCase()}/`))
    );

    for (const child of childNodes) {
      wsNode.children!.push({
        id: child.id,
        name: child.name,
        type: child.type,
        path: child.path,
        status: child.status,
        priority: child.priority,
        tags: child.tags,
      });
    }

    root.children!.push(wsNode);
  }

  // Add Global Tasks group if any
  if (globalTasks.length > 0) {
    root.children!.push({
      id: 'group-global-tasks',
      name: 'Globale Tasks (10_Tasks)',
      type: 'task',
      path: '10_Tasks',
      children: globalTasks.map((t) => ({
        id: t.id,
        name: t.name,
        type: 'task',
        path: t.path,
        status: t.status,
        priority: t.priority,
        tags: t.tags,
      })),
    });
  }

  // Add Global Notes group if any
  if (globalNotes.length > 0) {
    root.children!.push({
      id: 'group-global-notes',
      name: 'Globale Notizen (30_Notes)',
      type: 'note',
      path: '30_Notes',
      children: globalNotes.map((n) => ({
        id: n.id,
        name: n.name,
        type: 'note',
        path: n.path,
        tags: n.tags,
      })),
    });
  }

  // Add Inbox Braindumps group if any
  if (braindumps.length > 0) {
    root.children!.push({
      id: 'group-braindumps',
      name: 'Inbox Braindumps (00_Inbox)',
      type: 'braindump',
      path: '00_Inbox',
      children: braindumps.map((b) => ({
        id: b.id,
        name: b.name,
        type: 'braindump',
        path: b.path,
        tags: b.tags,
      })),
    });
  }

  return root;
}
