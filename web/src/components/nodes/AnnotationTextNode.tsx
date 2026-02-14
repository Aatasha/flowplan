import type { NodeProps } from '@xyflow/react';
import type { FlowPlanNodeData } from '../../types/flowchart';

export function AnnotationTextNode({ data, selected }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  return (
    <div
      style={{
        background: 'transparent',
        fontSize: 13,
        fontWeight: 500,
        color: 'var(--fp-text)',
        padding: '4px 6px',
        minWidth: 60,
        boxShadow: selected ? '0 0 0 2px var(--fp-accent, #6366f1)' : 'none',
      }}
    >
      {d.label}
    </div>
  );
}
