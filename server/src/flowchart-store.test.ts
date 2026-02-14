import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { FlowchartStore } from './flowchart-store.js';

let tmpDir: string;
let store: FlowchartStore;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flowplan-test-'));
  store = new FlowchartStore(tmpDir);
});

afterEach(async () => {
  await store.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('FlowchartStore', () => {
  describe('create', () => {
    it('creates a flowchart and returns its id', () => {
      const id = store.create('My Plan', 'A test plan');
      expect(id).toBe('my-plan');
    });

    it('creates a JSON file on disk', () => {
      const id = store.create('Test Chart');
      const filePath = path.join(tmpDir, '.claude', 'flowplans', `${id}.json`);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('sets correct initial fields', () => {
      const id = store.create('Init Test', 'desc');
      const doc = store.read(id)!;
      expect(doc.name).toBe('Init Test');
      expect(doc.description).toBe('desc');
      expect(doc.version).toBe(1);
      expect(doc.nodes).toEqual([]);
      expect(doc.edges).toEqual([]);
      expect(doc.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    });

    it('creates basic template with start and end nodes', () => {
      const id = store.create('Template Test', '', 'basic');
      const doc = store.read(id)!;
      expect(doc.nodes).toHaveLength(2);
      expect(doc.nodes[0].type).toBe('start');
      expect(doc.nodes[1].type).toBe('end');
    });

    it('converts name to kebab-case id', () => {
      expect(store.create('Hello World 123')).toBe('hello-world-123');
      expect(store.create('  Spaces & Symbols!  ')).toBe('spaces-symbols');
    });
  });

  describe('read', () => {
    it('returns null for non-existent flowchart', () => {
      expect(store.read('does-not-exist')).toBeNull();
    });

    it('reads back what was created', () => {
      const id = store.create('Read Test');
      const doc = store.read(id);
      expect(doc).not.toBeNull();
      expect(doc!.id).toBe(id);
    });
  });

  describe('update', () => {
    it('increments version on update', () => {
      const id = store.create('Update Test');
      const updated = store.update(id, { description: 'new desc' });
      expect(updated.version).toBe(2);
      expect(updated.description).toBe('new desc');
    });

    it('preserves the id even if update tries to change it', () => {
      const id = store.create('Id Lock Test');
      const updated = store.update(id, { id: 'hacked' } as any);
      expect(updated.id).toBe(id);
    });

    it('throws for non-existent flowchart', () => {
      expect(() => store.update('nope', {})).toThrow("Flowchart 'nope' not found");
    });
  });

  describe('addNode', () => {
    it('adds a node to the flowchart', () => {
      const id = store.create('Node Test');
      const nodeId = store.addNode(id, {
        type: 'task',
        data: { label: 'Do something' },
      });
      const doc = store.read(id)!;
      expect(doc.nodes).toHaveLength(1);
      expect(doc.nodes[0].id).toBe(nodeId);
      expect(doc.nodes[0].data.label).toBe('Do something');
    });

    it('generates an id if none provided', () => {
      const id = store.create('Auto ID');
      const nodeId = store.addNode(id, { type: 'decision', data: { label: 'Choice' } });
      expect(nodeId).toMatch(/^decision-/);
    });

    it('uses provided id', () => {
      const id = store.create('Custom ID');
      const nodeId = store.addNode(id, { id: 'my-node', type: 'task', data: { label: 'Named' } });
      expect(nodeId).toBe('my-node');
    });

    it('defaults position to (100, 100)', () => {
      const id = store.create('Pos Test');
      store.addNode(id, { type: 'task', data: { label: 'X' } });
      const doc = store.read(id)!;
      expect(doc.nodes[0].position).toEqual({ x: 100, y: 100 });
    });

    it('defaults status to pending', () => {
      const id = store.create('Status Test');
      store.addNode(id, { type: 'task', data: { label: 'Y' } });
      const doc = store.read(id)!;
      expect(doc.nodes[0].data.status).toBe('pending');
    });
  });

  describe('removeNode', () => {
    it('removes a node and its connected edges', () => {
      const id = store.create('Remove Test');
      store.addNode(id, { id: 'n1', type: 'task', data: { label: 'A' } });
      store.addNode(id, { id: 'n2', type: 'task', data: { label: 'B' } });
      store.addEdge(id, { source: 'n1', target: 'n2' });

      store.removeNode(id, 'n1');
      const doc = store.read(id)!;
      expect(doc.nodes).toHaveLength(1);
      expect(doc.nodes[0].id).toBe('n2');
      expect(doc.edges).toHaveLength(0);
    });
  });

  describe('addEdge', () => {
    it('adds an edge between two nodes', () => {
      const id = store.create('Edge Test');
      store.addNode(id, { id: 'n1', type: 'start', data: { label: 'Start' } });
      store.addNode(id, { id: 'n2', type: 'end', data: { label: 'End' } });
      const edgeId = store.addEdge(id, { source: 'n1', target: 'n2', type: 'success' });

      const doc = store.read(id)!;
      expect(doc.edges).toHaveLength(1);
      expect(doc.edges[0].id).toBe(edgeId);
      expect(doc.edges[0].type).toBe('success');
    });

    it('defaults edge type to default', () => {
      const id = store.create('Default Edge');
      store.addNode(id, { id: 'n1', type: 'task', data: { label: 'A' } });
      store.addNode(id, { id: 'n2', type: 'task', data: { label: 'B' } });
      store.addEdge(id, { source: 'n1', target: 'n2' });

      const doc = store.read(id)!;
      expect(doc.edges[0].type).toBe('default');
    });
  });

  describe('removeEdge', () => {
    it('removes an edge by id', () => {
      const id = store.create('Remove Edge');
      store.addNode(id, { id: 'n1', type: 'task', data: { label: 'A' } });
      store.addNode(id, { id: 'n2', type: 'task', data: { label: 'B' } });
      const edgeId = store.addEdge(id, { source: 'n1', target: 'n2' });

      store.removeEdge(id, edgeId);
      const doc = store.read(id)!;
      expect(doc.edges).toHaveLength(0);
    });
  });

  describe('updateNode', () => {
    it('updates node position', () => {
      const id = store.create('Move Test');
      store.addNode(id, { id: 'n1', type: 'task', data: { label: 'X' } });
      store.updateNode(id, 'n1', { position: { x: 300, y: 400 } });

      const doc = store.read(id)!;
      expect(doc.nodes[0].position).toEqual({ x: 300, y: 400 });
    });

    it('updates node data fields', () => {
      const id = store.create('Data Test');
      store.addNode(id, { id: 'n1', type: 'task', data: { label: 'Old' } });
      store.updateNode(id, 'n1', { data: { label: 'New', status: 'completed' } });

      const doc = store.read(id)!;
      expect(doc.nodes[0].data.label).toBe('New');
      expect(doc.nodes[0].data.status).toBe('completed');
    });

    it('merges metadata without overwriting existing keys', () => {
      const id = store.create('Meta Test');
      store.addNode(id, { id: 'n1', type: 'task', data: { label: 'M' } });
      store.updateNode(id, 'n1', { data: { metadata: { key1: 'val1' } } });
      store.updateNode(id, 'n1', { data: { metadata: { key2: 'val2' } } });

      const doc = store.read(id)!;
      expect(doc.nodes[0].data.metadata).toEqual({ key1: 'val1', key2: 'val2' });
    });

    it('throws for non-existent node', () => {
      const id = store.create('Missing Node');
      expect(() => store.updateNode(id, 'nope', { data: { label: 'X' } })).toThrow(
        "Node 'nope' not found"
      );
    });
  });

  describe('list', () => {
    it('returns empty array when no flowcharts', () => {
      expect(store.list()).toEqual([]);
    });

    it('lists all created flowcharts', () => {
      store.create('First');
      store.create('Second');
      const list = store.list();
      expect(list).toHaveLength(2);
      expect(list.map((f) => f.name).sort()).toEqual(['First', 'Second']);
    });
  });

  describe('events', () => {
    it('emits change event on create', () => {
      let emittedId = '';
      store.on('change', (id: string) => {
        emittedId = id;
      });
      store.create('Event Test');
      expect(emittedId).toBe('event-test');
    });

    it('emits change event on addNode', () => {
      const id = store.create('Event Node');
      let emittedDoc: any = null;
      store.on('change', (_id: string, doc: any) => {
        emittedDoc = doc;
      });
      store.addNode(id, { type: 'task', data: { label: 'Trigger' } });
      expect(emittedDoc).not.toBeNull();
      expect(emittedDoc.nodes).toHaveLength(1);
    });
  });

  describe('version tracking', () => {
    it('increments version on each mutation', () => {
      const id = store.create('Version');
      expect(store.read(id)!.version).toBe(1);

      store.addNode(id, { id: 'n1', type: 'task', data: { label: 'A' } });
      expect(store.read(id)!.version).toBe(2);

      store.addNode(id, { id: 'n2', type: 'task', data: { label: 'B' } });
      expect(store.read(id)!.version).toBe(3);

      store.addEdge(id, { source: 'n1', target: 'n2' });
      expect(store.read(id)!.version).toBe(4);

      store.removeNode(id, 'n1');
      expect(store.read(id)!.version).toBe(5);
    });
  });
});
