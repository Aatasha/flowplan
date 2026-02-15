# FlowPlan — Visual Flowchart Planning Plugin for Claude Code

## Completed

- [x] Core MCP server with flowchart CRUD operations
- [x] Web viewer with React Flow, all 16 node types, annotations
- [x] ELK auto-layout engine
- [x] Drag-and-drop from palette to canvas
- [x] Properties panel (node/edge editing)
- [x] Edge editing, selection styling, layout improvements
- [x] Failure edge exclusion from ELK layout
- [x] Interactive node management: context menu, keyboard shortcuts, drop-into-groups
- [x] Edge handle polish + connection line styling
- [x] Merged to `main` branch, set as default on GitHub
- [x] **Vitest server tests** (36 tests): FlowchartStore CRUD/events/versioning, layout engine positioning/groups/failure-edge-exclusion
- [x] **Vitest web tests** (37 tests): store actions, undo/redo, annotations, serialization round-trip, history limits, UI state
- [x] **Playwright E2E tests** (8 tests): REST API CRUD + 404, web app rendering, node/edge display, WebSocket live sync
- [x] FLOWPLAN_PORT env var for deterministic port in tests

## Test Commands

```bash
npm test              # All unit tests (server + web)
npm run test:e2e      # Playwright E2E (starts server automatically)
npm run test:all      # Unit + E2E
```

## Known Issues

- **Plugin cache**: Source at `~/.claude/plugins/flowplan/`, cache at `~/.claude/plugins/cache/alistair-local/flowplan/0.1.0/`. After rebuild, sync to both.
- **PUT upsert ID mismatch**: The endpoint creates via `nameToId(name)` which may differ from URL param. Tests use matching names/slugs as workaround.
- **Drag outside parent**: Child nodes can escape phase groups. Workaround: "Arrange" button.
- **Server restart**: Layout engine changes need Claude Code restart.

## Backlog

- [ ] Fix PUT upsert to use URL param as ID (not derived from name)
- [ ] PropertiesPanel: use `removeEdge()` instead of `onEdgesChange` bypass
- [ ] Constrain child node dragging within parent groups
- [ ] Export flowchart as PNG/SVG
- [ ] Node resize handles for phase groups
- [ ] Copy/paste nodes (Cmd+C/V)
- [ ] Multi-select rectangle (drag to select area)
- [ ] Search/filter nodes
- [ ] Minimap click-to-navigate
- [ ] Error handling UI for server connection failures

## Next Step

Pick up backlog items — PUT upsert ID fix is a quick win, then export PNG/SVG or copy/paste.

## Quick Reference

- **Source:** `~/.claude/plugins/flowplan/`
- **GitHub:** `github.com/Aatasha/flowplan` (default branch: `main`)
- **Build + deploy:** `cd web && npx vite build && cp -r dist/ ~/.claude/plugins/cache/alistair-local/flowplan/0.1.0/web/dist/`
