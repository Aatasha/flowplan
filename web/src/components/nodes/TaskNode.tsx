import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowPlanNodeData } from '../../types/flowchart';

const statusColors: Record<string, string> = {
  pending: 'var(--fp-status-pending)',
  in_progress: 'var(--fp-status-progress)',
  completed: 'var(--fp-status-completed)',
  blocked: 'var(--fp-status-blocked)',
};

export function TaskNode({ data, selected }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  return (
    <div
      style={{
        background: 'var(--fp-node-task)',
        border: `2px solid var(--fp-node-task-border)`,
        borderRadius: 8,
        padding: '8px 12px',
        minWidth: 140,
        maxWidth: 220,
        boxShadow: selected ? '0 0 0 2px var(--fp-accent, #6366f1)' : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: statusColors[d.status] ?? statusColors.pending,
            flexShrink: 0,
          }}
        />
        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {d.label}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
