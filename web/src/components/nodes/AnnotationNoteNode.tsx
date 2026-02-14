import type { NodeProps } from '@xyflow/react';
import type { FlowPlanNodeData } from '../../types/flowchart';

export function AnnotationNoteNode({ data, selected }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  return (
    <div
      style={{
        background: 'var(--fp-annotation-sticky)',
        border: '1px solid var(--fp-node-note-border)',
        borderRadius: 2,
        padding: '8px 10px',
        minWidth: 100,
        maxWidth: 200,
        fontSize: 11,
        boxShadow: selected ? '0 0 0 2px var(--fp-accent, #6366f1), 2px 2px 6px rgba(0,0,0,0.1)' : '2px 2px 6px rgba(0,0,0,0.1)',
      }}
    >
      {d.label}
    </div>
  );
}
