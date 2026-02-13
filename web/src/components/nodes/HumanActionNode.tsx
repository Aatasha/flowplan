import { Handle, Position, type NodeProps } from '@xyflow/react';
import { User } from 'lucide-react';
import type { FlowPlanNodeData } from '../../types/flowchart';

export function HumanActionNode({ data }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  return (
    <div
      style={{
        background: 'var(--fp-node-human)',
        border: '2px solid var(--fp-node-human-border)',
        borderRadius: 8,
        padding: '8px 12px',
        minWidth: 140,
        maxWidth: 220,
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <User size={14} style={{ color: 'var(--fp-node-human-border)', flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: 11 }}>{d.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
