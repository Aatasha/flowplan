# FlowPlan Plugin — Tasks

## Completed

- [x] Core MCP server with flowchart CRUD operations
- [x] Web viewer with React Flow, all 16 node types, annotations
- [x] ELK auto-layout engine
- [x] Drag-and-drop from palette to canvas
- [x] Properties panel (node/edge editing)
- [x] Edge editing, selection styling, layout improvements
- [x] Failure edge exclusion from ELK layout
- [x] **Interactive node management overhaul** (this session):
  - [x] Store: moveNode, removeEdge (with undo), removeSelected, deselectAll, contextMenu state
  - [x] Keyboard shortcuts: Cmd+Z undo, Cmd+Shift+Z redo, Delete/Backspace remove, Escape deselect
  - [x] Context menu: canvas (add node), node (delete/status/move to group), edge (delete/change type)
  - [x] Drop-into-groups: dragging a node onto a phase group auto-parents it
  - [x] Edge handle polish: larger handles on hover with accent glow
  - [x] Connection line styling
- [x] Vitest test infrastructure + 19 store unit tests

## Backlog

- [ ] PropertiesPanel edge delete should use `removeEdge()` instead of `onEdgesChange` bypass (now that it exists)
- [ ] Playwright E2E tests for critical browser flows (drag-drop, context menu, group parenting)
- [ ] Node resize handles for phase groups
- [ ] Copy/paste nodes (Cmd+C/V)
- [ ] Multi-select rectangle (drag to select area)
- [ ] Export flowchart as PNG/SVG
- [ ] Search/filter nodes
- [ ] Minimap click-to-navigate

## Needs Manual Testing

The interactive node management features (context menu, keyboard shortcuts, drop-into-groups) were built and unit-tested but **not yet browser-tested**. Open a flowchart and verify before moving on.

## Next Step

1. Browser-test the new features (see testing checklist in previous session notes)
2. Fix PropertiesPanel to use the new `removeEdge()` action (one-line change, `web/src/components/PropertiesPanel.tsx` ~line 221)
3. Then consider Playwright E2E setup for the most breakage-prone flows

## Quick Reference

- **Source:** `~/.claude/plugins/flowplan/web/src/`
- **Tests:** `cd ~/.claude/plugins/flowplan/web && npx vitest run`
- **Build + deploy:** `cd ~/.claude/plugins/flowplan/web && npx vite build && cp -r dist/ ~/.claude/plugins/cache/alistair-local/flowplan/0.1.0/web/dist/`
- **GitHub:** `github.com/Aatasha/flowplan` branch `phase-1/mcp-server`
