import { describe, it, expect, beforeEach } from 'vitest';
import { useFlowPlanStore } from './flowplan-store';

// Helper to reset store between tests
function resetStore() {
  useFlowPlanStore.setState({
    nodes: [],
    edges: [],
    strokes: [],
    arrows: [],
    past: [],
    future: [],
    isDirty: false,
    selectedNodeId: null,
    selectedEdgeId: null,
    contextMenu: null,
  });
}

function makeNode(id: string, opts?: { parentId?: string; type?: string; x?: number; y?: number; selected?: boolean }) {
  return {
    id,
    type: opts?.type ?? 'task',
    position: { x: opts?.x ?? 0, y: opts?.y ?? 0 },
    ...(opts?.parentId ? { parentId: opts.parentId } : {}),
    ...(opts?.selected ? { selected: true } : {}),
    data: { label: id, description: '', status: 'pending', metadata: {}, style: {} },
  };
}

function makeEdge(id: string, source: string, target: string, opts?: { selected?: boolean }) {
  return {
    id,
    source,
    target,
    type: 'default',
    style: {},
    data: { edgeType: 'default', label: '', animated: false },
    ...(opts?.selected ? { selected: true } : {}),
  };
}

describe('flowplan-store', () => {
  beforeEach(resetStore);

  describe('addNode', () => {
    it('adds a node and marks dirty', () => {
      const store = useFlowPlanStore.getState();
      store.addNode(makeNode('n1'));
      const state = useFlowPlanStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.nodes[0].id).toBe('n1');
      expect(state.isDirty).toBe(true);
    });

    it('pushes history before adding', () => {
      const store = useFlowPlanStore.getState();
      store.addNode(makeNode('n1'));
      expect(useFlowPlanStore.getState().past).toHaveLength(1);
    });
  });

  describe('removeNode', () => {
    it('removes the node and connected edges', () => {
      useFlowPlanStore.setState({
        nodes: [makeNode('n1'), makeNode('n2'), makeNode('n3')],
        edges: [makeEdge('e1', 'n1', 'n2'), makeEdge('e2', 'n2', 'n3')],
      });
      useFlowPlanStore.getState().removeNode('n2');
      const state = useFlowPlanStore.getState();
      expect(state.nodes).toHaveLength(2);
      expect(state.edges).toHaveLength(0); // both edges connected to n2
    });
  });

  describe('moveNode', () => {
    it('moves a root node into a group, adjusting position', () => {
      useFlowPlanStore.setState({
        nodes: [
          makeNode('group1', { type: 'phase_group', x: 100, y: 100 }),
          makeNode('n1', { x: 150, y: 200 }),
        ],
      });
      useFlowPlanStore.getState().moveNode('n1', 'group1');
      const state = useFlowPlanStore.getState();
      const moved = state.nodes.find((n) => n.id === 'n1')!;
      expect(moved.parentId).toBe('group1');
      // 150 - 100 = 50, 200 - 100 = 100
      expect(moved.position.x).toBe(50);
      expect(moved.position.y).toBe(100);
    });

    it('moves a node out of a group to root', () => {
      useFlowPlanStore.setState({
        nodes: [
          makeNode('group1', { type: 'phase_group', x: 100, y: 100 }),
          makeNode('n1', { parentId: 'group1', x: 50, y: 50 }),
        ],
      });
      useFlowPlanStore.getState().moveNode('n1', null);
      const state = useFlowPlanStore.getState();
      const moved = state.nodes.find((n) => n.id === 'n1')!;
      expect(moved.parentId).toBeUndefined();
      // 50 + 100 = 150, 50 + 100 = 150
      expect(moved.position.x).toBe(150);
      expect(moved.position.y).toBe(150);
    });

    it('pushes history', () => {
      useFlowPlanStore.setState({ nodes: [makeNode('n1')] });
      useFlowPlanStore.getState().moveNode('n1', null);
      expect(useFlowPlanStore.getState().past).toHaveLength(1);
    });
  });

  describe('removeEdge', () => {
    it('removes an edge with history tracking', () => {
      useFlowPlanStore.setState({
        nodes: [makeNode('n1'), makeNode('n2')],
        edges: [makeEdge('e1', 'n1', 'n2')],
      });
      useFlowPlanStore.getState().removeEdge('e1');
      const state = useFlowPlanStore.getState();
      expect(state.edges).toHaveLength(0);
      expect(state.past).toHaveLength(1);
      expect(state.isDirty).toBe(true);
    });
  });

  describe('removeSelected', () => {
    it('removes all selected nodes and their connected edges', () => {
      useFlowPlanStore.setState({
        nodes: [makeNode('n1', { selected: true }), makeNode('n2'), makeNode('n3', { selected: true })],
        edges: [makeEdge('e1', 'n1', 'n2'), makeEdge('e2', 'n2', 'n3'), makeEdge('e3', 'n2', 'n2')],
      });
      useFlowPlanStore.getState().removeSelected();
      const state = useFlowPlanStore.getState();
      expect(state.nodes).toHaveLength(1);
      expect(state.nodes[0].id).toBe('n2');
      // e1 (connected to n1) and e2 (connected to n3) should be removed, e3 stays
      expect(state.edges).toHaveLength(1);
      expect(state.edges[0].id).toBe('e3');
    });

    it('removes selected edges', () => {
      useFlowPlanStore.setState({
        nodes: [makeNode('n1'), makeNode('n2')],
        edges: [makeEdge('e1', 'n1', 'n2', { selected: true })],
      });
      useFlowPlanStore.getState().removeSelected();
      const state = useFlowPlanStore.getState();
      expect(state.nodes).toHaveLength(2); // nodes untouched
      expect(state.edges).toHaveLength(0);
    });

    it('does nothing if nothing is selected (no history push)', () => {
      useFlowPlanStore.setState({
        nodes: [makeNode('n1')],
        edges: [],
      });
      useFlowPlanStore.getState().removeSelected();
      expect(useFlowPlanStore.getState().past).toHaveLength(0);
    });

    it('clears selection state', () => {
      useFlowPlanStore.setState({
        nodes: [makeNode('n1', { selected: true })],
        selectedNodeId: 'n1',
      });
      useFlowPlanStore.getState().removeSelected();
      const state = useFlowPlanStore.getState();
      expect(state.selectedNodeId).toBeNull();
      expect(state.selectedEdgeId).toBeNull();
    });
  });

  describe('deselectAll', () => {
    it('clears selectedNodeId, selectedEdgeId, and contextMenu', () => {
      useFlowPlanStore.setState({
        selectedNodeId: 'n1',
        selectedEdgeId: 'e1',
        contextMenu: { x: 100, y: 100, target: { type: 'canvas' } },
      });
      useFlowPlanStore.getState().deselectAll();
      const state = useFlowPlanStore.getState();
      expect(state.selectedNodeId).toBeNull();
      expect(state.selectedEdgeId).toBeNull();
      expect(state.contextMenu).toBeNull();
    });
  });

  describe('undo / redo', () => {
    it('undoes the last action', () => {
      useFlowPlanStore.getState().addNode(makeNode('n1'));
      expect(useFlowPlanStore.getState().nodes).toHaveLength(1);

      useFlowPlanStore.getState().undo();
      expect(useFlowPlanStore.getState().nodes).toHaveLength(0);
    });

    it('redoes after undo', () => {
      useFlowPlanStore.getState().addNode(makeNode('n1'));
      useFlowPlanStore.getState().undo();
      useFlowPlanStore.getState().redo();
      expect(useFlowPlanStore.getState().nodes).toHaveLength(1);
    });

    it('undo does nothing when no history', () => {
      useFlowPlanStore.getState().undo();
      expect(useFlowPlanStore.getState().nodes).toHaveLength(0);
    });

    it('redo does nothing when no future', () => {
      useFlowPlanStore.getState().redo();
      expect(useFlowPlanStore.getState().nodes).toHaveLength(0);
    });

    it('removeEdge is undoable (fixes the old bypass bug)', () => {
      useFlowPlanStore.setState({
        nodes: [makeNode('n1'), makeNode('n2')],
        edges: [makeEdge('e1', 'n1', 'n2')],
      });
      useFlowPlanStore.getState().removeEdge('e1');
      expect(useFlowPlanStore.getState().edges).toHaveLength(0);

      useFlowPlanStore.getState().undo();
      expect(useFlowPlanStore.getState().edges).toHaveLength(1);
      expect(useFlowPlanStore.getState().edges[0].id).toBe('e1');
    });
  });

  describe('contextMenu state', () => {
    it('sets and clears context menu', () => {
      useFlowPlanStore.getState().setContextMenu({
        x: 200,
        y: 300,
        target: { type: 'node', nodeId: 'n1' },
      });
      expect(useFlowPlanStore.getState().contextMenu).toEqual({
        x: 200,
        y: 300,
        target: { type: 'node', nodeId: 'n1' },
      });

      useFlowPlanStore.getState().setContextMenu(null);
      expect(useFlowPlanStore.getState().contextMenu).toBeNull();
    });
  });

  describe('updateEdgeData', () => {
    it('updates edge type and style', () => {
      useFlowPlanStore.setState({
        edges: [makeEdge('e1', 'n1', 'n2')],
      });
      useFlowPlanStore.getState().updateEdgeData('e1', { edgeType: 'success' });
      const edge = useFlowPlanStore.getState().edges[0];
      expect((edge.data as any).edgeType).toBe('success');
    });
  });
});
