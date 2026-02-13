#!/bin/bash
set -euo pipefail

flowplan_dir="${CLAUDE_PROJECT_DIR:-.}/.claude/flowplans"

if [ -d "$flowplan_dir" ]; then
  count=$(ls -1 "$flowplan_dir"/*.json 2>/dev/null | wc -l | tr -d ' ')
  if [ "$count" -gt 0 ]; then
    names=$(ls -1 "$flowplan_dir"/*.json 2>/dev/null | xargs -I{} basename {} .json | tr '\n' ', ' | sed 's/,$//')
    echo "{\"systemMessage\": \"FlowPlan: Found $count existing flowchart(s) in this project: $names. Use read_flowchart to view them or create_flowchart to make a new one.\"}"
  else
    echo '{}'
  fi
else
  echo '{}'
fi
