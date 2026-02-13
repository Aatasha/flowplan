---
name: flowchart-planning
description: Use when entering plan mode, creating implementation plans, or when the user asks for a visual flowchart. Provides schema reference and best practices for generating interactive flowcharts using the FlowPlan MCP tools.
version: 0.1.0
---

# FlowPlan — Visual Flowchart Planning

## Overview

FlowPlan creates interactive flowcharts that open in the browser. Use it whenever:

- The user enters **plan mode** or asks to plan before implementing
- Architecture or system design discussions need a visual overview
- Multi-step workflows, deployment pipelines, or phased projects need mapping out
- The user explicitly asks for a flowchart (`/flowplan`, "create a flowchart", etc.)

Flowcharts are saved as JSON in the project's `.claude/flowplans/` directory and rendered as interactive React Flow diagrams in the browser.

## Quick Start Pattern

Follow this exact order of MCP tool calls:

```
1. create_flowchart(name, description?)    → returns flowchart_id
2. add_node(flowchart_id, type: "start")   → entry point
3. add_node(flowchart_id, type: "phase_group") → create phases to organize work
4. add_node(flowchart_id, type: "task"|"decision"|...) → add items, set parentId to phase_group id
5. add_edge(flowchart_id, source, target, type?) → connect nodes
6. auto_layout(flowchart_id)               → arrange nodes cleanly
7. open_flowchart(flowchart_id)            → open in the browser
```

## Node Type Reference

| Type | Shape | When to Use | Required Metadata | Optional Metadata |
|------|-------|-------------|-------------------|-------------------|
| `start` | Green pill | Entry point of the flowchart. One per chart. Has source handle only. | — | — |
| `end` | Red pill | Exit point of the flowchart. Has target handle only. | — | — |
| `task` | Rounded rect | A work item or action step. Supports status tracking. | — | `status`: `"pending"` \| `"in_progress"` \| `"completed"` \| `"blocked"` |
| `decision` | Diamond | A branch point where the flow splits based on a condition. | — | — |
| `note` | Yellow sticky | Commentary or context. Not part of the flow — no handles. | — | — |
| `phase_group` | Container | Groups related tasks into a phase or section. Other nodes set `parentId` to this node's id. | — | — |
| `milestone` | Star/flag | A key checkpoint or deliverable. | — | — |
| `file_ref` | File icon | References a specific file in the codebase. | `path`: string, `action`: `"create"` \| `"modify"` \| `"delete"` | — |
| `api_endpoint` | Method badge | Represents an API route. | `method`: `"GET"` \| `"POST"` \| `"PUT"` \| `"DELETE"`, `path`: string (e.g. `"/api/users"`) | — |
| `db_entity` | Cylinder | A database table or entity. | `tableName`: string | `columns`: string[] |
| `test_checkpoint` | Checkmark | A point where tests should be written or run. | `testType`: `"unit"` \| `"integration"` \| `"e2e"` | — |
| `mcp_tool` | Plug icon | Represents an MCP tool call. | `serverName`: string, `toolName`: string | `description`: string |
| `human_action` | Person icon | A manual step requiring human intervention. | `instructions`: string | — |
| `parallel_fork` | Horizontal bar | Splits or joins parallel work streams. | `mode`: `"fork"` \| `"join"` | — |
| `annotation_note` | Sticky note | Freeform commentary — not part of the flow, no handles. | — | — |
| `annotation_text` | Floating text | A text label — not part of the flow, no handles. | — | — |

### Example add_node Calls

**Start node:**
```
add_node(flowchart_id, type: "start", label: "Begin")
```

**Task with status:**
```
add_node(flowchart_id, type: "task", label: "Set up database schema", metadata: {status: "pending"}, parentId: "phase-1-id")
```

**Decision:**
```
add_node(flowchart_id, type: "decision", label: "Auth required?")
```

**Phase group:**
```
add_node(flowchart_id, type: "phase_group", label: "Phase 1: Foundation")
```

**File reference:**
```
add_node(flowchart_id, type: "file_ref", label: "schema.prisma", metadata: {path: "prisma/schema.prisma", action: "create"}, parentId: "phase-1-id")
```

**API endpoint:**
```
add_node(flowchart_id, type: "api_endpoint", label: "Create User", metadata: {method: "POST", path: "/api/users"}, parentId: "phase-2-id")
```

**Database entity:**
```
add_node(flowchart_id, type: "db_entity", label: "Users Table", metadata: {tableName: "users", columns: ["id", "email", "name", "created_at"]})
```

**Test checkpoint:**
```
add_node(flowchart_id, type: "test_checkpoint", label: "API integration tests", metadata: {testType: "integration"}, parentId: "phase-3-id")
```

**MCP tool:**
```
add_node(flowchart_id, type: "mcp_tool", label: "Deploy to Supabase", metadata: {serverName: "supabase", toolName: "apply_migration"})
```

**Human action:**
```
add_node(flowchart_id, type: "human_action", label: "Review PR", metadata: {instructions: "Review the PR for security issues and approve if safe"})
```

**Parallel fork/join:**
```
add_node(flowchart_id, type: "parallel_fork", label: "Start parallel work", metadata: {mode: "fork"})
add_node(flowchart_id, type: "parallel_fork", label: "Sync up", metadata: {mode: "join"})
```

**End node:**
```
add_node(flowchart_id, type: "end", label: "Done")
```

## Edge Type Reference

| Type | Appearance | When to Use |
|------|-----------|-------------|
| `default` | Solid gray line | Standard flow between steps |
| `success` | Solid green line | Success path from a decision node |
| `failure` | Dashed red line | Error or failure path from a decision node |
| `conditional` | Dotted orange line | Conditional path — always add a `label` to explain the condition |

### Example add_edge Calls

```
add_edge(flowchart_id, source: "start-id", target: "phase1-id", type: "default")
add_edge(flowchart_id, source: "decision-id", target: "success-path-id", type: "success", label: "Yes")
add_edge(flowchart_id, source: "decision-id", target: "failure-path-id", type: "failure", label: "No")
add_edge(flowchart_id, source: "check-id", target: "next-id", type: "conditional", label: "If config exists")
```

## Best Practices

- **Keep flowcharts under 25 nodes** for readability. If a plan is larger, split into sub-flowcharts for each phase.
- **Always use phase_group nodes** to organize related tasks into logical sections.
- **Use start and end nodes** for clear entry and exit points.
- **Always call auto_layout** after adding all nodes and edges — it arranges everything cleanly.
- **Always call read_flowchart before updating** an existing flowchart — respect any edits the user made in the browser.
- **Use decision nodes for branch points**, not tasks. A decision asks a question; tasks do work.
- **Use engineering nodes** (file_ref, api_endpoint, db_entity, test_checkpoint) only for technical implementation plans where file-level detail is useful.
- **Update node status** as implementation progresses: `pending` -> `in_progress` -> `completed`. Use `update_node` to change status metadata.
- **Label decision edges** — always use `success`/`failure` or `conditional` edge types with descriptive labels so the reader knows which path is which.

## Anti-Patterns

- **Don't create more than 30 nodes** — the flowchart becomes unreadable. Split into multiple charts instead.
- **Don't skip auto_layout** — manually positioned nodes look messy and overlap.
- **Don't ignore user edits** — always `read_flowchart` before making changes to an existing chart.
- **Don't put annotation nodes in the layout flow** — `annotation_note` and `annotation_text` have no handles and should float independently.
- **Don't create edges to/from note or annotation nodes** — they are commentary, not flow participants.
- **Don't use `task` nodes for questions** — use `decision` nodes when the flow branches.

## Templates

### Linear Plan
A simple sequential plan.
```
start → task1 → task2 → task3 → end
```

### Decision Tree
A plan with branching logic.
```
start → decision("Ready?")
  → [success] task_a → end
  → [failure] task_b → decision("Retry?")
    → [success] task_a → end
    → [failure] end_fail
```

### Phased Plan
The most common pattern for implementation plans.
```
start → phase1_group[task1, task2, task3]
      → phase2_group[task4, task5]
      → phase3_group[task6, test_checkpoint]
      → end
```
Connect the start to the first phase group, phases to each other, and the last phase to end. Tasks within a phase use `parentId` to sit inside the group — they don't need edges between them unless order matters.

### Parallel Work
For tasks that can happen simultaneously.
```
start → fork
      → [branch1] task_a → task_b
      → [branch2] task_c → task_d
      → join → end
```
Use `parallel_fork` with `mode: "fork"` to split and `mode: "join"` to converge.
