import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowPlanNodeData } from '../../types/flowchart';

const methodColors: Record<string, string> = {
  GET: '#2e7d32',
  POST: '#1976d2',
  PUT: '#f57c00',
  DELETE: '#c62828',
  PATCH: '#7b1fa2',
};

export function ApiEndpointNode({ data, selected }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  const method = (d.metadata?.method as string) ?? 'GET';
  const path = (d.metadata?.path as string) ?? d.label;
  return (
    <div
      style={{
        background: 'var(--fp-node-api)',
        border: '2px solid var(--fp-node-api-border)',
        borderRadius: 8,
        padding: '8px 12px',
        minWidth: 140,
        maxWidth: 240,
        boxShadow: selected ? '0 0 0 2px var(--fp-accent, #6366f1)' : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: '#fff',
            background: methodColors[method] ?? '#757575',
            borderRadius: 4,
            padding: '1px 5px',
            flexShrink: 0,
          }}
        >
          {method}
        </span>
        <span style={{ fontSize: 11, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {path}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
