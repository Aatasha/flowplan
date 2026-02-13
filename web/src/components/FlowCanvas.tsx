import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import { nodeTypes } from './nodes';
import { AnnotationOverlay } from './AnnotationOverlay';
import { useFlowPlanStore } from '../store/flowplan-store';
import type { FlowPlanNodeData, NodeType } from '../types/flowchart';

export function FlowCanvas() {
  const nodes = useFlowPlanStore((s) => s.nodes);
  const edges = useFlowPlanStore((s) => s.edges);
  const onNodesChange = useFlowPlanStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowPlanStore((s) => s.onEdgesChange);
  const onConnect = useFlowPlanStore((s) => s.onConnect);
  const interactionMode = useFlowPlanStore((s) => s.interactionMode);
  const setSelectedNodeId = useFlowPlanStore((s) => s.setSelectedNodeId);
  const setSelectedEdgeId = useFlowPlanStore((s) => s.setSelectedEdgeId);
  const addNode = useFlowPlanStore((s) => s.addNode);

  const { screenToFlowPosition } = useReactFlow();

  const isAnnotating = interactionMode !== 'select';

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/flowplan-node-type') as NodeType;
      if (!type) return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          description: '',
          status: 'pending',
          metadata: {},
          style: {},
        } satisfies FlowPlanNodeData,
        ...(type === 'phase_group' ? { style: { width: 400, height: 250 } } : {}),
      };
      addNode(newNode);
    },
    [screenToFlowPosition, addNode],
  );

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        panOnDrag={!isAnnotating}
        nodesDraggable={!isAnnotating}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onEdgeClick={(_, edge) => setSelectedEdgeId(edge.id)}
        onPaneClick={() => {
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
        }}
        fitView
        deleteKeyCode="Delete"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap
          style={{ background: 'var(--fp-bg-secondary)' }}
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>
      <AnnotationOverlay />
    </div>
  );
}
