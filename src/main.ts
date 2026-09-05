import { App, ItemView, Plugin, WorkspaceLeaf, addIcon } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { GraphApp } from './components/GraphApp';

export const VIEW_TYPE_WORKOS_GRAPH = 'workos-knowledge-graph-view';

// SVG Inner Content for Obsidian's addIcon (Obsidian natively wraps in <svg viewBox="0 0 100 100">)
export const WORKOS_GRAPH_ICON_SVG = `
<circle cx="50" cy="50" r="12" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="6"/>
<circle cx="76" cy="24" r="9" fill="currentColor" stroke="currentColor" stroke-width="6"/>
<circle cx="22" cy="34" r="9" fill="currentColor" stroke="currentColor" stroke-width="6"/>
<circle cx="64" cy="78" r="9" fill="currentColor" stroke="currentColor" stroke-width="6"/>
<line x1="50" y1="50" x2="76" y2="24" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
<line x1="50" y1="50" x2="22" y2="34" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
<line x1="50" y1="50" x2="64" y2="78" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>
<line x1="22" y1="34" x2="64" y2="78" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-dasharray="8 8" stroke-opacity="0.6"/>
`.trim();

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

    // Register custom vector icon safely
    try {
      addIcon('workos-graph-logo', WORKOS_GRAPH_ICON_SVG);
    } catch (err) {
      console.warn('Could not register custom icon workos-graph-logo:', err);
    }

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
