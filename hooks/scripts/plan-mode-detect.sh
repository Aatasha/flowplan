#!/bin/bash
set -euo pipefail

input=$(cat)
user_prompt=$(echo "$input" | jq -r '.user_prompt // ""')

# Check for plan-mode keywords (case-insensitive)
if echo "$user_prompt" | grep -iqE '(plan mode|/plan|let.s plan|create a plan|implementation plan|flowchart|/flowplan)'; then
  echo '{"systemMessage": "The user wants a visual plan. Use the flowchart-planning skill and FlowPlan MCP tools to create an interactive flowchart alongside your text plan. Call create_flowchart first, then add nodes and edges, run auto_layout, and open_flowchart."}'
else
  # No plan keywords detected, no action needed
  echo '{}'
fi
