import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowPlanNodeData } from '../../types/flowchart';

export function StartNode({ data, selected }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  return (
    <div
      style={{
        background: 'var(--fp-node-start)',
        border: '2px solid var(--fp-node-start-border)',
        borderRadius: 50,
        padding: '8px 24px',
        fontWeight: 600,
        textAlign: 'center',
        minWidth: 80,
        boxShadow: selected ? '0 0 0 2px var(--fp-accent, #6366f1)' : 'none',
      }}
    >
      {d.label || 'Start'}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export function EndNode({ data, selected }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  return (
    <div
      style={{
        background: 'var(--fp-node-end)',
        border: '2px solid var(--fp-node-end-border)',
        borderRadius: 50,
        padding: '8px 24px',
        fontWeight: 600,
        textAlign: 'center',
        minWidth: 80,
        boxShadow: selected ? '0 0 0 2px var(--fp-accent, #6366f1)' : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} />
      {d.label || 'End'}
    </div>
  );
}
