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

    it('updates edge label', () => {
      useFlowPlanStore.setState({
        edges: [makeEdge('e1', 'n1', 'n2')],
      });
      useFlowPlanStore.getState().updateEdgeData('e1', { label: 'yes' });
      const edge = useFlowPlanStore.getState().edges[0];
      expect((edge.data as any).label).toBe('yes');
    });

    it('pushes history', () => {
      useFlowPlanStore.setState({
        edges: [makeEdge('e1', 'n1', 'n2')],
      });
      useFlowPlanStore.getState().updateEdgeData('e1', { edgeType: 'failure' });
      expect(useFlowPlanStore.getState().past).toHaveLength(1);
    });
  });

  describe('updateNodeData', () => {
    it('updates node label', () => {
      useFlowPlanStore.setState({ nodes: [makeNode('n1')] });
      useFlowPlanStore.getState().updateNodeData('n1', { label: 'New Label' });
      const node = useFlowPlanStore.getState().nodes[0];
      expect((node.data as any).label).toBe('New Label');
    });

    it('updates node status', () => {
      useFlowPlanStore.setState({ nodes: [makeNode('n1')] });
      useFlowPlanStore.getState().updateNodeData('n1', { status: 'completed' });
      const node = useFlowPlanStore.getState().nodes[0];
      expect((node.data as any).status).toBe('completed');
    });

    it('pushes history and marks dirty', () => {
      useFlowPlanStore.setState({ nodes: [makeNode('n1')] });
      useFlowPlanStore.getState().updateNodeData('n1', { label: 'Updated' });
      expect(useFlowPlanStore.getState().past).toHaveLength(1);
      expect(useFlowPlanStore.getState().isDirty).toBe(true);
    });
  });

  describe('annotations', () => {
    it('adds and removes strokes', () => {
      const stroke = { id: 's1', points: [[0, 0, 0.5] as [number, number, number]], color: '#ff0000', width: 3 };
      useFlowPlanStore.getState().addStroke(stroke);
      expect(useFlowPlanStore.getState().strokes).toHaveLength(1);
      expect(useFlowPlanStore.getState().past).toHaveLength(1);

      useFlowPlanStore.getState().removeStroke('s1');
      expect(useFlowPlanStore.getState().strokes).toHaveLength(0);
      expect(useFlowPlanStore.getState().past).toHaveLength(2);
    });

    it('adds and removes arrows', () => {
      const arrow = { id: 'a1', start: { x: 0, y: 0 }, end: { x: 100, y: 100 }, color: '#0000ff' };
      useFlowPlanStore.getState().addArrow(arrow);
      expect(useFlowPlanStore.getState().arrows).toHaveLength(1);

      useFlowPlanStore.getState().removeArrow('a1');
      expect(useFlowPlanStore.getState().arrows).toHaveLength(0);
    });

    it('stroke operations are undoable', () => {
      const stroke = { id: 's1', points: [[10, 20, 0.5] as [number, number, number]], color: '#000', width: 2 };
      useFlowPlanStore.getState().addStroke(stroke);
      useFlowPlanStore.getState().undo();
      expect(useFlowPlanStore.getState().strokes).toHaveLength(0);
    });
  });

  describe('history limits', () => {
    it('caps undo history at 50 entries', () => {
      for (let i = 0; i < 55; i++) {
        useFlowPlanStore.getState().addNode(makeNode(`n${i}`));
      }
      // 55 addNode calls = 55 history pushes, capped at 50
      expect(useFlowPlanStore.getState().past.length).toBeLessThanOrEqual(50);
    });

    it('clears future on new action after undo', () => {
      useFlowPlanStore.getState().addNode(makeNode('n1'));
      useFlowPlanStore.getState().addNode(makeNode('n2'));
      useFlowPlanStore.getState().undo();
      expect(useFlowPlanStore.getState().future).toHaveLength(1);

      // New action should clear future
      useFlowPlanStore.getState().addNode(makeNode('n3'));
      expect(useFlowPlanStore.getState().future).toHaveLength(0);
    });
  });

  describe('serialization (toDocument / fromDocument)', () => {
    it('round-trips nodes and edges', () => {
      useFlowPlanStore.setState({
        flowchartId: 'test-flow',
        flowchartName: 'Test Flow',
        flowchartDescription: 'A test',
        nodes: [makeNode('n1'), makeNode('n2')],
        edges: [makeEdge('e1', 'n1', 'n2')],
      });

      const doc = useFlowPlanStore.getState().toDocument();
      expect(doc.id).toBe('test-flow');
      expect(doc.name).toBe('Test Flow');
      expect(doc.nodes).toHaveLength(2);
      expect(doc.edges).toHaveLength(1);

      // Reset and load back
      resetStore();
      useFlowPlanStore.getState().fromDocument(doc);

      const state = useFlowPlanStore.getState();
      expect(state.flowchartId).toBe('test-flow');
      expect(state.nodes).toHaveLength(2);
      expect(state.edges).toHaveLength(1);
    });

    it('fromDocument resets history', () => {
      useFlowPlanStore.getState().addNode(makeNode('n1'));
      expect(useFlowPlanStore.getState().past).toHaveLength(1);

      useFlowPlanStore.getState().fromDocument({
        id: 'fresh',
        name: 'Fresh',
        description: '',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewport: { x: 0, y: 0, zoom: 1 },
        engineeringMode: false,
        nodes: [],
        edges: [],
        annotations: { strokes: [], arrows: [] },
      });

      expect(useFlowPlanStore.getState().past).toHaveLength(0);
      expect(useFlowPlanStore.getState().future).toHaveLength(0);
      expect(useFlowPlanStore.getState().isDirty).toBe(false);
    });

    it('round-trips annotations', () => {
      const stroke = { id: 's1', points: [[1, 2, 0.5] as [number, number, number]], color: '#f00', width: 2 };
      const arrow = { id: 'a1', start: { x: 0, y: 0 }, end: { x: 50, y: 50 }, color: '#00f' };

      useFlowPlanStore.getState().addStroke(stroke);
      useFlowPlanStore.getState().addArrow(arrow);

      const doc = useFlowPlanStore.getState().toDocument();
      expect(doc.annotations.strokes).toHaveLength(1);
      expect(doc.annotations.arrows).toHaveLength(1);

      resetStore();
      useFlowPlanStore.getState().fromDocument(doc);
      expect(useFlowPlanStore.getState().strokes).toHaveLength(1);
      expect(useFlowPlanStore.getState().arrows).toHaveLength(1);
    });
  });

  describe('UI state', () => {
    it('setSelectedNodeId clears selectedEdgeId', () => {
      useFlowPlanStore.setState({ selectedEdgeId: 'e1' });
      useFlowPlanStore.getState().setSelectedNodeId('n1');
      const state = useFlowPlanStore.getState();
      expect(state.selectedNodeId).toBe('n1');
      expect(state.selectedEdgeId).toBeNull();
    });

    it('setSelectedEdgeId clears selectedNodeId', () => {
      useFlowPlanStore.setState({ selectedNodeId: 'n1' });
      useFlowPlanStore.getState().setSelectedEdgeId('e1');
      const state = useFlowPlanStore.getState();
      expect(state.selectedEdgeId).toBe('e1');
      expect(state.selectedNodeId).toBeNull();
    });

    it('toggleEngineering flips the flag', () => {
      expect(useFlowPlanStore.getState().showEngineering).toBe(false);
      useFlowPlanStore.getState().toggleEngineering();
      expect(useFlowPlanStore.getState().showEngineering).toBe(true);
      useFlowPlanStore.getState().toggleEngineering();
      expect(useFlowPlanStore.getState().showEngineering).toBe(false);
    });

    it('setInteractionMode changes mode', () => {
      useFlowPlanStore.getState().setInteractionMode('pen');
      expect(useFlowPlanStore.getState().interactionMode).toBe('pen');
      useFlowPlanStore.getState().setInteractionMode('select');
      expect(useFlowPlanStore.getState().interactionMode).toBe('select');
    });

    it('markDirty / markSaved toggle persistence state', () => {
      expect(useFlowPlanStore.getState().isDirty).toBe(false);
      useFlowPlanStore.getState().markDirty();
      expect(useFlowPlanStore.getState().isDirty).toBe(true);
      useFlowPlanStore.getState().markSaved();
      expect(useFlowPlanStore.getState().isDirty).toBe(false);
      expect(useFlowPlanStore.getState().lastSavedAt).not.toBeNull();
    });
  });
});
