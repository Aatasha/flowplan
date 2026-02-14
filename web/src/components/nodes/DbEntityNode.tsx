import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Database } from 'lucide-react';
import type { FlowPlanNodeData } from '../../types/flowchart';

export function DbEntityNode({ data, selected }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  return (
    <div
      style={{
        background: 'var(--fp-node-db)',
        border: '2px solid var(--fp-node-db-border)',
        borderRadius: '8px 8px 50% 50%',
        padding: '10px 14px 14px',
        minWidth: 120,
        textAlign: 'center',
        boxShadow: selected ? '0 0 0 2px var(--fp-accent, #6366f1)' : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <Database size={14} style={{ color: 'var(--fp-node-db-border)', marginBottom: 2 }} />
      <div style={{ fontWeight: 600, fontSize: 11 }}>{d.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
