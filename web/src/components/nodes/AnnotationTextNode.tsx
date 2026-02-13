import type { NodeProps } from '@xyflow/react';
import type { FlowPlanNodeData } from '../../types/flowchart';

export function AnnotationTextNode({ data }: NodeProps) {
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
      }}
    >
      {d.label}
    </div>
  );
}
