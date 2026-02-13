import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileCode } from 'lucide-react';
import type { FlowPlanNodeData } from '../../types/flowchart';

const actionColors: Record<string, string> = {
  create: '#2e7d32',
  modify: '#1976d2',
  delete: '#c62828',
};

export function FileRefNode({ data }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  const action = (d.metadata?.action as string) ?? 'modify';
  return (
    <div
      style={{
        background: 'var(--fp-node-file)',
        border: '2px solid var(--fp-node-file-border)',
        borderRadius: 8,
        padding: '8px 12px',
        minWidth: 140,
        maxWidth: 220,
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <FileCode size={14} style={{ color: 'var(--fp-node-file-border)', flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {d.label}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: '#fff',
            background: actionColors[action] ?? '#757575',
            borderRadius: 4,
            padding: '1px 4px',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          {action}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
