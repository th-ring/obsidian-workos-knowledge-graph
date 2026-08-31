export type WorkOSEntityType = 'workstream' | 'task' | 'note' | 'braindump' | 'tag' | 'other';

export type ViewMode = '2d' | '3d' | 'mindmap';

export interface GraphNode {
  id: string; // unique identifier (file.path or tag:xxx)
  name: string; // Display title
  path: string; // Obsidian Vault path
  type: WorkOSEntityType;
  workstream?: string; // Resolved workstream name without [[]]
  status?: 'unprocessed' | 'todo' | 'in_progress' | 'in-progress' | 'review' | 'done' | 'cancelled' | 'active' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  agent_state?: 'idle' | 'processing' | 'waiting' | 'blocked';
  locked_by?: string;
  tags: string[];
  val: number; // Node size / weight
  color?: string;
  linksCount: number;
  subtasksCount?: number;
  subtasksDone?: number;
  // Dynamic positioning for force graph
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

export type LinkType = 'workstream_child' | 'wikilink' | 'tag_link' | 'parent';

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: LinkType;
  label?: string;
  color?: string;
  particles?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphFilterConfig {
  showWorkstreams: boolean;
  showTasks: boolean;
  showNotes: boolean;
  showBraindumps: boolean;
  showTags: boolean;
  activeWorkstream: string | null;
  activeTag: string | null;
  repulsion: number; // -100 to -1000
  linkDistance: number; // 20 to 200
  showParticles: boolean;
  searchQuery: string;
}

export interface MindmapTreeNode {
  id: string;
  name: string;
  type: WorkOSEntityType;
  path: string;
  status?: string;
  priority?: string;
  tags?: string[];
  children?: MindmapTreeNode[];
  collapsed?: boolean;
}
