import { Handle, Position, type NodeProps } from '@xyflow/react';
import { CheckCircle } from 'lucide-react';
import type { FlowPlanNodeData } from '../../types/flowchart';

export function TestCheckpointNode({ data, selected }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  return (
    <div
      style={{
        background: 'var(--fp-node-test)',
        border: '2px solid var(--fp-node-test-border)',
        borderRadius: 8,
        padding: '8px 12px',
        minWidth: 130,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        boxShadow: selected ? '0 0 0 2px var(--fp-accent, #6366f1)' : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <CheckCircle size={14} style={{ color: 'var(--fp-node-test-border)', flexShrink: 0 }} />
      <span style={{ fontWeight: 600, fontSize: 11 }}>{d.label}</span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
