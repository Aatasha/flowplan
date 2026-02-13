import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Plug } from 'lucide-react';
import type { FlowPlanNodeData } from '../../types/flowchart';

export function McpToolNode({ data }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  const serverName = (d.metadata?.serverName as string) ?? '';
  const toolName = (d.metadata?.toolName as string) ?? d.label;
  return (
    <div
      style={{
        background: 'var(--fp-node-mcp)',
        border: '2px solid var(--fp-node-mcp-border)',
        borderRadius: 8,
        padding: '8px 12px',
        minWidth: 140,
        maxWidth: 220,
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Plug size={14} style={{ color: 'var(--fp-node-mcp-border)', flexShrink: 0 }} />
        <div style={{ overflow: 'hidden' }}>
          {serverName && (
            <div style={{ fontSize: 9, color: 'var(--fp-text-secondary)', fontWeight: 600 }}>
              {serverName}
            </div>
          )}
          <div style={{ fontWeight: 600, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {toolName}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
