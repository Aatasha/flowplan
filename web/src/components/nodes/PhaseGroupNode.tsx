import type { NodeProps } from '@xyflow/react';
import type { FlowPlanNodeData } from '../../types/flowchart';

export function PhaseGroupNode({ data }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  return (
    <div
      style={{
        background: 'var(--fp-node-phase)',
        border: '2px solid var(--fp-node-phase-border)',
        borderRadius: 8,
        minWidth: 300,
        minHeight: 200,
        width: '100%',
        height: '100%',
      }}
    >
      <div
        style={{
          background: 'var(--fp-node-phase-border)',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '6px 6px 0 0',
          fontWeight: 600,
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{d.label}</span>
      </div>
    </div>
  );
}
