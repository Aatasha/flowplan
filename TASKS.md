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
- [x] **Vitest server tests** (37 tests): FlowchartStore CRUD/events/versioning/explicitId, layout engine
- [x] **Vitest web tests** (37 tests): store actions, undo/redo, annotations, serialization, UI state
- [x] **Playwright E2E tests** (9 tests): REST API CRUD + 404 + upsert regression, web app, WebSocket sync, export buttons
- [x] FLOWPLAN_PORT env var for deterministic port in tests
- [x] **Fix: PUT upsert ID mismatch** — `create()` now accepts `explicitId`, PUT uses URL param
- [x] **Fix: PropertiesPanel edge delete** — uses `removeEdge()` (undoable) instead of `onEdgesChange` bypass
- [x] **Export flowchart as PNG/SVG** — `useExport` hook + toolbar buttons, uses `html-to-image`

## Test Commands

```bash
npm test              # All unit tests (server + web): 74 tests
npm run test:e2e      # Playwright E2E (starts server): 9 tests
npm run test:all      # Everything: 83 tests
```

## Known Issues

- **Plugin cache**: Source at `~/.claude/plugins/flowplan/`, cache at `~/.claude/plugins/cache/alistair-local/flowplan/0.1.0/`. After rebuild, sync to both.
- **Drag outside parent**: Child nodes can escape phase groups. Workaround: "Arrange" button.
- **Server restart**: Layout/server changes need Claude Code restart (MCP runs from bundled JS).

## Backlog

- [ ] Constrain child node dragging within parent groups
- [ ] Node resize handles for phase groups
- [ ] Copy/paste nodes (Cmd+C/V)
- [ ] Multi-select rectangle (drag to select area)
- [ ] Search/filter nodes
- [ ] Minimap click-to-navigate
- [ ] Error handling UI for server connection failures

## Next Step

Pick up backlog items — constrain child dragging or copy/paste are the highest-impact UX improvements.

## Quick Reference

- **Source:** `~/.claude/plugins/flowplan/`
- **GitHub:** `github.com/Aatasha/flowplan` (default branch: `main`)
- **Build + deploy:**
  ```bash
  cd server && npm run build && cp dist/index.js ~/.claude/plugins/cache/alistair-local/flowplan/0.1.0/server/dist/index.js
  cd web && npx vite build && cp -r dist/ ~/.claude/plugins/cache/alistair-local/flowplan/0.1.0/web/dist/
  ```
