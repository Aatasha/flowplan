---
name: flowplan
description: Create a visual flowchart plan in the browser
allowed-tools:
  - mcp__plugin_flowplan_flowplan__create_flowchart
  - mcp__plugin_flowplan_flowplan__add_node
  - mcp__plugin_flowplan_flowplan__add_edge
  - mcp__plugin_flowplan_flowplan__update_node
  - mcp__plugin_flowplan_flowplan__remove_node
  - mcp__plugin_flowplan_flowplan__remove_edge
  - mcp__plugin_flowplan_flowplan__read_flowchart
  - mcp__plugin_flowplan_flowplan__open_flowchart
  - mcp__plugin_flowplan_flowplan__auto_layout
  - Skill
---

Use the flowchart-planning skill to create a visual flowchart.

If the user provided a topic after /flowplan, create a flowchart for that topic.
If no topic was provided, ask the user what they'd like to plan.

Follow the Quick Start Pattern from the skill:
1. create_flowchart with a descriptive name
2. Add start node
3. Add phase groups for major sections
4. Add task/decision/milestone nodes within phases
5. Connect with edges (use appropriate edge types for decisions)
6. Run auto_layout
7. Open in browser with open_flowchart

Keep the flowchart focused and under 25 nodes. Use phase_group nodes to organize.
