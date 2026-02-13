import { useCallback } from 'react';
import ELK from 'elkjs/lib/elk.bundled.js';
import { useFlowPlanStore } from '../store/flowplan-store';

const elk = new ELK();

export function useAutoLayout() {
  const nodes = useFlowPlanStore((s) => s.nodes);
  const edges = useFlowPlanStore((s) => s.edges);

  return useCallback(async () => {
    const store = useFlowPlanStore.getState();
    store.pushHistory();

    const elkGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.spacing.nodeNode': '50',
        'elk.layered.spacing.nodeNodeBetweenLayers': '80',
      },
      children: nodes.map((node) => ({
        id: node.id,
        width: node.type === 'phase_group' ? 400 : node.type === 'parallel_fork' ? 120 : 160,
        height: node.type === 'phase_group' ? 250 : node.type === 'decision' ? 120 : node.type === 'parallel_fork' ? 12 : 50,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
    };

    try {
      const layout = await elk.layout(elkGraph);
      if (layout.children) {
        const updatedNodes = store.nodes.map((node) => {
          const layoutNode = layout.children!.find((n) => n.id === node.id);
          if (layoutNode && layoutNode.x !== undefined && layoutNode.y !== undefined) {
            return { ...node, position: { x: layoutNode.x, y: layoutNode.y } };
          }
          return node;
        });
        useFlowPlanStore.setState({ nodes: updatedNodes });
        store.markDirty();
      }
    } catch (err) {
      console.error('Auto-layout failed:', err);
    }
  }, [nodes, edges]);
}
