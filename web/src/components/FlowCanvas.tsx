import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  type Node,
} from '@xyflow/react';
import { nodeTypes } from './nodes';
import { AnnotationOverlay } from './AnnotationOverlay';
import { ContextMenu } from './ContextMenu';
import { useFlowPlanStore } from '../store/flowplan-store';
import type { FlowPlanNodeData, NodeType } from '../types/flowchart';

const connectionLineStyle = { stroke: 'var(--fp-accent)', strokeWidth: 2 };

export function FlowCanvas() {
  const nodes = useFlowPlanStore((s) => s.nodes);
  const edges = useFlowPlanStore((s) => s.edges);
  const onNodesChange = useFlowPlanStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowPlanStore((s) => s.onEdgesChange);
  const onConnect = useFlowPlanStore((s) => s.onConnect);
  const interactionMode = useFlowPlanStore((s) => s.interactionMode);
  const setSelectedNodeId = useFlowPlanStore((s) => s.setSelectedNodeId);
  const setSelectedEdgeId = useFlowPlanStore((s) => s.setSelectedEdgeId);
  const setContextMenu = useFlowPlanStore((s) => s.setContextMenu);
  const addNode = useFlowPlanStore((s) => s.addNode);

  const { screenToFlowPosition, getNodes } = useReactFlow();

  const isAnnotating = interactionMode !== 'select';

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Find a phase_group node that contains the given flow-space position
  const findGroupAtPosition = useCallback(
    (flowX: number, flowY: number): Node | null => {
      const allNodes = getNodes();
      for (const n of allNodes) {
        if (n.type !== 'phase_group') continue;
        const w = n.measured?.width ?? (n.style?.width as number) ?? 400;
        const h = n.measured?.height ?? (n.style?.height as number) ?? 250;
        if (
          flowX >= n.position.x &&
          flowX <= n.position.x + w &&
          flowY >= n.position.y &&
          flowY <= n.position.y + h
        ) {
          return n;
        }
      }
      return null;
    },
    [getNodes],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('application/flowplan-node-type') as NodeType;
      if (!type) return;

      const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      let position = flowPos;
      let parentId: string | undefined;

      // Auto-parent into phase groups (but don't nest groups inside groups)
      if (type !== 'phase_group') {
        const group = findGroupAtPosition(flowPos.x, flowPos.y);
        if (group) {
          parentId = group.id;
          position = { x: flowPos.x - group.position.x, y: flowPos.y - group.position.y };
        }
      }

      addNode({
        id: `${type}-${Date.now()}`,
        type,
        position,
        ...(parentId ? { parentId } : {}),
        data: {
          label: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          description: '',
          status: 'pending',
          metadata: {},
          style: {},
        } satisfies FlowPlanNodeData,
        ...(type === 'phase_group' ? { style: { width: 400, height: 250 } } : {}),
      });
    },
    [screenToFlowPosition, addNode, findGroupAtPosition],
  );

  // Context menu handlers
  const onPaneContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, target: { type: 'canvas' } });
    },
    [setContextMenu],
  );

  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: Node) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, target: { type: 'node', nodeId: node.id } });
    },
    [setContextMenu],
  );

  const onEdgeContextMenu = useCallback(
    (e: React.MouseEvent, edge: { id: string }) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, target: { type: 'edge', edgeId: edge.id } });
    },
    [setContextMenu],
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
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        connectionLineStyle={connectionLineStyle}
        fitView
        deleteKeyCode={null}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap
          style={{ background: 'var(--fp-bg-secondary)' }}
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>
      <AnnotationOverlay />
      <ContextMenu />
    </div>
  );
}
