import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Flag } from 'lucide-react';
import type { FlowPlanNodeData } from '../../types/flowchart';

export function MilestoneNode({ data, selected }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  return (
    <div
      style={{
        background: 'var(--fp-node-milestone)',
        border: '2px solid var(--fp-node-milestone-border)',
        borderRadius: 8,
        padding: '8px 12px',
        minWidth: 120,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        boxShadow: selected ? '0 0 0 2px var(--fp-accent, #6366f1)' : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Flag size={14} style={{ color: 'var(--fp-node-milestone-border)', flexShrink: 0 }} />
      <span style={{ fontWeight: 600, fontSize: 12 }}>{d.label}</span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
