import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowPlanNodeData } from '../../types/flowchart';

export function ParallelForkNode({ data, selected }: NodeProps) {
  const d = data as unknown as FlowPlanNodeData;
  const mode = (d.metadata?.mode as string) ?? 'fork';
  const isFork = mode === 'fork';

  return (
    <div
      style={{
        background: 'var(--fp-node-fork-border)',
        border: '2px solid var(--fp-node-fork-border)',
        borderRadius: 4,
        width: 120,
        height: 12,
        position: 'relative',
        boxShadow: selected ? '0 0 0 2px var(--fp-accent, #6366f1)' : 'none',
      }}
    >
      {isFork ? (
        <>
          <Handle type="target" position={Position.Top} />
          <Handle type="source" position={Position.Bottom} id="left" style={{ left: '20%' }} />
          <Handle type="source" position={Position.Bottom} id="center" style={{ left: '50%' }} />
          <Handle type="source" position={Position.Bottom} id="right" style={{ left: '80%' }} />
        </>
      ) : (
        <>
          <Handle type="target" position={Position.Top} id="left" style={{ left: '20%' }} />
          <Handle type="target" position={Position.Top} id="center" style={{ left: '50%' }} />
          <Handle type="target" position={Position.Top} id="right" style={{ left: '80%' }} />
          <Handle type="source" position={Position.Bottom} />
        </>
      )}
    </div>
  );
}
