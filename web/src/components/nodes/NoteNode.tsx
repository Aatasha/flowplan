import type { NodeProps } from '@xyflow/react';
import type { FlowPlanNodeData } from '../../types/flowchart';

export function NoteNode({ data }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  return (
    <div
      style={{
        background: 'var(--fp-node-note)',
        border: '1px solid var(--fp-node-note-border)',
        borderRadius: 4,
        padding: '8px 12px',
        minWidth: 100,
        maxWidth: 200,
        fontStyle: 'italic',
        opacity: 0.9,
        fontSize: 11,
      }}
    >
      {d.label}
    </div>
  );
}
