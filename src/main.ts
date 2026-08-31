import { App, ItemView, Plugin, WorkspaceLeaf, addIcon } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { GraphApp } from './components/GraphApp';

export const VIEW_TYPE_WORKOS_GRAPH = 'workos-knowledge-graph-view';

// SVG Icon for Ribbon: Modern Orbit / Network Graph Icon
export const WORKOS_GRAPH_ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="3" fill="currentColor" fill-opacity="0.2"/>
  <circle cx="19" cy="5" r="2"/>
  <circle cx="5" cy="19" r="2"/>
  <circle cx="5" cy="5" r="2"/>
  <circle cx="19" cy="19" r="2"/>
  <path d="M12 9V5"/>
  <path d="M12 15v4"/>
  <path d="M9 12H5"/>
  <path d="M15 12h4"/>
  <path d="M14.1 9.9l3.5-3.5"/>
  <path d="M9.9 14.1l-3.5 3.5"/>
  <path d="M9.9 9.9L6.4 6.4"/>
  <path d="M14.1 14.1l3.5 3.5"/>
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
