import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowPlanNodeData } from '../../types/flowchart';

export function DecisionNode({ data, selected }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  return (
    <div
      style={{
        width: 120,
        height: 120,
        transform: 'rotate(45deg)',
        background: 'var(--fp-node-decision)',
        border: '2px solid var(--fp-node-decision-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: selected ? '0 0 0 2px var(--fp-accent, #6366f1)' : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ top: -4, left: '50%' }} />
      <div
        style={{
          transform: 'rotate(-45deg)',
          textAlign: 'center',
          fontSize: 11,
          fontWeight: 600,
          padding: 8,
          maxWidth: 100,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {d.label}
      </div>
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ bottom: -4, left: '50%' }} />
      <Handle type="source" position={Position.Left} id="left" style={{ bottom: '50%', left: -4 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ bottom: '50%', right: -4 }} />
    </div>
  );
}
