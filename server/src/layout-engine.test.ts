import { describe, it, expect } from 'vitest';
import { autoLayout } from './layout-engine.js';
import type { FlowPlanDocument } from './flowchart-store.js';

function makeDoc(
  nodes: FlowPlanDocument['nodes'],
  edges: FlowPlanDocument['edges'] = []
): FlowPlanDocument {
  return {
    id: 'test',
    name: 'Test',
    description: '',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewport: { x: 0, y: 0, zoom: 1 },
    engineeringMode: false,
    nodes,
    edges,
    annotations: { strokes: [], arrows: [] },
  };
}

function makeNode(id: string, type: string, parentNode: string | null = null) {
  return {
    id,
    type: type as any,
    position: { x: 0, y: 0 },
    parentNode,
    data: { label: id, description: '', status: 'pending' as const, metadata: {}, style: {} },
  };
}

describe('autoLayout', () => {
  it('positions a simple linear chain top-to-bottom', async () => {
    const doc = makeDoc(
      [makeNode('start', 'start'), makeNode('task1', 'task'), makeNode('end', 'end')],
      [
        { id: 'e1', source: 'start', target: 'task1', type: 'default', data: { label: '', animated: false } },
        { id: 'e2', source: 'task1', target: 'end', type: 'default', data: { label: '', animated: false } },
      ]
    );

    const result = await autoLayout(doc, 'TB');

    // Nodes should be positioned with start at top, task in middle, end at bottom
    const startNode = result.nodes.find((n) => n.id === 'start')!;
    const taskNode = result.nodes.find((n) => n.id === 'task1')!;
    const endNode = result.nodes.find((n) => n.id === 'end')!;

    expect(startNode.position.y).toBeLessThan(taskNode.position.y);
    expect(taskNode.position.y).toBeLessThan(endNode.position.y);
  });

  it('positions nodes left-to-right when direction is LR', async () => {
    const doc = makeDoc(
      [makeNode('a', 'task'), makeNode('b', 'task')],
      [{ id: 'e1', source: 'a', target: 'b', type: 'default', data: { label: '', animated: false } }]
    );

    const result = await autoLayout(doc, 'LR');
    const a = result.nodes.find((n) => n.id === 'a')!;
    const b = result.nodes.find((n) => n.id === 'b')!;

    expect(a.position.x).toBeLessThan(b.position.x);
  });

  it('excludes failure edges from layout (prevents cycle-breaking issues)', async () => {
    // Decision -> Task (success) and Task -> Decision (failure/retry)
    // Without excluding failure edges, ELK would try to break the cycle
    const doc = makeDoc(
      [makeNode('decision', 'decision'), makeNode('task', 'task')],
      [
        { id: 'e1', source: 'decision', target: 'task', type: 'success', data: { label: 'yes', animated: false } },
        { id: 'e2', source: 'task', target: 'decision', type: 'failure', data: { label: 'retry', animated: false } },
      ]
    );

    const result = await autoLayout(doc, 'TB');
    const decision = result.nodes.find((n) => n.id === 'decision')!;
    const task = result.nodes.find((n) => n.id === 'task')!;

    // Decision should be above task (success edge is forward)
    expect(decision.position.y).toBeLessThan(task.position.y);
  });

  it('skips annotation nodes from layout', async () => {
    const doc = makeDoc([
      makeNode('task1', 'task'),
      makeNode('note1', 'annotation_note'),
      makeNode('text1', 'annotation_text'),
    ]);

    const result = await autoLayout(doc);

    // Annotation nodes should keep their original position (0,0)
    const note = result.nodes.find((n) => n.id === 'note1')!;
    const text = result.nodes.find((n) => n.id === 'text1')!;
    expect(note.position).toEqual({ x: 0, y: 0 });
    expect(text.position).toEqual({ x: 0, y: 0 });

    // Task node should get a position from ELK
    const task = result.nodes.find((n) => n.id === 'task1')!;
    expect(task.position).toBeDefined();
  });

  it('handles phase groups with children', async () => {
    const doc = makeDoc(
      [
        makeNode('group1', 'phase_group'),
        makeNode('t1', 'task', 'group1'),
        makeNode('t2', 'task', 'group1'),
      ],
      [{ id: 'e1', source: 't1', target: 't2', type: 'default', data: { label: '', animated: false } }]
    );

    const result = await autoLayout(doc, 'TB');
    const group = result.nodes.find((n) => n.id === 'group1')!;
    const t1 = result.nodes.find((n) => n.id === 't1')!;
    const t2 = result.nodes.find((n) => n.id === 't2')!;

    // Group should have computed dimensions stored in data.style
    expect(group.data.style.width).toBeGreaterThan(0);
    expect(group.data.style.height).toBeGreaterThan(0);

    // Children should be positioned relative to the group (small coords)
    // and t1 should be above t2
    expect(t1.position.y).toBeLessThan(t2.position.y);
  });

  it('increments version and updates timestamp', async () => {
    const doc = makeDoc([makeNode('t1', 'task')]);
    const originalUpdatedAt = doc.updatedAt;

    // Small delay to ensure different timestamp
    await new Promise((r) => setTimeout(r, 10));
    const result = await autoLayout(doc);

    expect(result.version).toBe(2);
    expect(result.updatedAt).not.toBe(originalUpdatedAt);
  });

  it('handles empty document gracefully', async () => {
    const doc = makeDoc([], []);
    const result = await autoLayout(doc);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('handles disconnected nodes', async () => {
    const doc = makeDoc([
      makeNode('a', 'task'),
      makeNode('b', 'task'),
      makeNode('c', 'task'),
    ]);

    const result = await autoLayout(doc);
    // All three should get positions (no crash)
    for (const id of ['a', 'b', 'c']) {
      const node = result.nodes.find((n) => n.id === id)!;
      expect(node.position).toBeDefined();
    }
  });
});
