# 🌐 Obsidian WorkOS Knowledge Graph

[![Obsidian Plugin](https://img.shields.io/badge/Obsidian-Plugin-purple?logo=obsidian)](https://obsidian.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-cyan?logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Interactive **2D Canvas Force-Directed Graph**, **3D WebGL Space**, and **2-Way Radiating Workstream Mindmap** with an ultra-minimalist OpenAI / Linear design for **Obsidian WorkOS**.

---

## ✨ Features

- **Segmented View-Switcher**:
  - **2D Force Graph**: Hardware-accelerated HTML5 Canvas with custom glowing halos for Workstreams, status-coded task rings, Wikilink particle streams, and Level-of-Detail (LOD) label rendering.
  - **3D WebGL Space**: Full 3D spatial vault navigation powered by Three.js with orbit camera controls, directional particle beams, and smooth focus flights upon clicking nodes.
  - **2-Way Radiating Mindmap**: Visual tree/mindmap with smooth cubic SVG Bezier curves, infinite canvas pan & zoom, expandable/collapsible branch toggles (`+`/`-`), and subtask progress trackers.
- **OpenAI-Minimalist Floating UI**:
  - **Floating Header Pill**: Frosted glassmorphism (`backdrop-blur-md`) with view toggles, real-time node & link counters, and instant omnisearch.
  - **Floating Context Popover**: Minimalist detail card on clicked nodes with entity badges, workstream relations, tags, agent concurrency locks, and a 1-click jump to the Obsidian file.
  - **Floating Settings & Filters Pill**: Entity filters (Workstreams, Tasks, Notes, Braindumps), dynamic Workstream isolator, and interactive physics sliders (charge repulsion, link distance, flowing particles).

---

## 🏛️ WorkOS Architecture

Part of the **Obsidian WorkOS** modular ecosystem:
1. **🏛️ Obsidian WorkOS**: Vault repository containing structured schemas and markdown content.
2. **📊 WorkOS Dashboard** (`obsidian-workos-dashboard`): Kanban swimlanes, agent hub, and omnibar.
3. **🛡️ Agent Lock Guard** (`obsidian-agent-lock-guard`): Agent concurrency and edit lock guard.
4. **🌐 WorkOS Knowledge Graph** (`obsidian-workos-knowledge-graph`): Interactive 2D/3D topological exploration and Workstream mindmap.

---

## 📦 Installation

### Manual Installation
1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [GitHub Release](https://github.com/th-ring/obsidian-workos-knowledge-graph/releases).
2. Create a folder named `workos-knowledge-graph` in your vault's `.obsidian/plugins/` directory:
   `<Vault>/.obsidian/plugins/workos-knowledge-graph/`
3. Copy `main.js`, `manifest.json`, and `styles.css` into that directory.
4. Open Obsidian -> Settings -> Community Plugins -> Reload, and enable **WorkOS Knowledge Graph**.

---

## 🛠️ Development & Building

```bash
# Clone repository
git clone https://github.com/th-ring/obsidian-workos-knowledge-graph.git
cd obsidian-workos-knowledge-graph

# Install dependencies
npm install

# Live watch mode (compiles directly into ../Obsidian WorkOS/.obsidian/plugins/workos-knowledge-graph)
npm run dev

# Production build
npm run build
```

---

## 📄 License

MIT License © 2026 Obsidian WorkOS Team
