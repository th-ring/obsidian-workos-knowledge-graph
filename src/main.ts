import { App, ItemView, Plugin, WorkspaceLeaf, addIcon } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { GraphApp } from './components/GraphApp';

export const VIEW_TYPE_WORKOS_GRAPH = 'workos-knowledge-graph-view';

// SVG Icon for Ribbon & Tabs: Clean Constellation Network Icon (No X-collision)
export const WORKOS_GRAPH_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="2.5" fill="currentColor" fill-opacity="0.2"/>
  <circle cx="18" cy="6" r="2"/>
  <circle cx="5" cy="8" r="2"/>
  <circle cx="15" cy="19" r="2"/>
  <line x1="12" y1="12" x2="18" y2="6"/>
  <line x1="12" y1="12" x2="5" y2="8"/>
  <line x1="12" y1="12" x2="15" y2="19"/>
  <line x1="5" y1="8" x2="15" y2="19" stroke-dasharray="2 2" stroke-opacity="0.6"/>
</svg>`;

export class WorkOSKnowledgeGraphView extends ItemView {
  private root: Root | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_WORKOS_GRAPH;
  }

  getDisplayText(): string {
    return 'WorkOS Knowledge Graph';
  }

  getIcon(): string {
    return 'workos-graph-logo';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.classList.add('workos-graph-view-content');
    container.style.height = '100%';
    container.style.width = '100%';
    container.style.overflow = 'hidden';
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    // Create root for React 18
    this.root = createRoot(container);
    this.root.render(React.createElement(GraphApp, { app: this.app }));
  }

  async onClose(): Promise<void> {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}

export default class WorkOSKnowledgeGraphPlugin extends Plugin {
  async onload(): Promise<void> {
    console.log('Loading Obsidian WorkOS Knowledge Graph Plugin...');

    // Register custom vector icon
    addIcon('workos-graph-logo', WORKOS_GRAPH_ICON_SVG);

    // Register custom ItemView
    this.registerView(
      VIEW_TYPE_WORKOS_GRAPH,
      (leaf) => new WorkOSKnowledgeGraphView(leaf)
    );

    // Add ribbon icon on left sidebar
    this.addRibbonIcon('workos-graph-logo', 'WorkOS Knowledge Graph öffnen', () => {
      this.activateView();
    });

    // Add command palette entry
    this.addCommand({
      id: 'open-workos-knowledge-graph',
      name: 'WorkOS Knowledge Graph öffnen',
      callback: () => {
        this.activateView();
      },
    });
  }

  async onunload(): Promise<void> {
    console.log('Unloading Obsidian WorkOS Knowledge Graph Plugin...');
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_WORKOS_GRAPH);
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_WORKOS_GRAPH);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getLeaf(false);
      await leaf.setViewState({
        type: VIEW_TYPE_WORKOS_GRAPH,
        active: true,
      });
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
}
