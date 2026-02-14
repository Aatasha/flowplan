import type { NodeProps } from '@xyflow/react';
import type { FlowPlanNodeData } from '../../types/flowchart';

export function PhaseGroupNode({ data, selected }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  return (
    <div
      style={{
        background: 'var(--fp-node-phase)',
        border: '2px solid var(--fp-node-phase-border)',
        borderRadius: 8,
        width: '100%',
        height: '100%',
        boxShadow: selected ? '0 0 0 2px var(--fp-accent, #6366f1)' : 'none',
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
