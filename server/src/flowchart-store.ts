import { EventEmitter } from 'node:events';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { FSWatcher } from 'chokidar';

// Types
export interface FlowPlanDocument {
  id: string;
  name: string;
  description: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  viewport: { x: number; y: number; zoom: number };
  engineeringMode: boolean;
  nodes: FlowPlanNode[];
  edges: FlowPlanEdge[];
  annotations: {
    strokes: AnnotationStroke[];
    arrows: AnnotationArrow[];
  };
}

export interface FlowPlanNode {
  id: string;
  type:
    | 'task'
    | 'decision'
    | 'note'
    | 'phase_group'
    | 'start'
    | 'end'
    | 'milestone'
    | 'file_ref'
    | 'api_endpoint'
    | 'db_entity'
    | 'test_checkpoint'
    | 'mcp_tool'
    | 'human_action'
    | 'parallel_fork'
    | 'annotation_note'
    | 'annotation_text';
  position: { x: number; y: number };
  parentNode: string | null;
  data: {
    label: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    metadata: Record<string, any>;
    style: Record<string, any>;
  };
}

export interface FlowPlanEdge {
  id: string;
  source: string;
  target: string;
  type: 'default' | 'success' | 'failure' | 'conditional';
  data: { label: string; animated: boolean };
}

export interface AnnotationStroke {
  id: string;
  points: [number, number, number][];
  color: string;
  width: number;
}

export interface AnnotationArrow {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  color: string;
}

function randomSuffix(len = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function nameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export class FlowchartStore extends EventEmitter {
  private flowplansDir: string;
  private watcher: FSWatcher | null = null;
  private suppressWatch = false;

  constructor(projectDir: string) {
    super();
    this.flowplansDir = path.join(projectDir, '.claude', 'flowplans');
    this.ensureDir();
    this.startWatching();
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.flowplansDir)) {
      fs.mkdirSync(this.flowplansDir, { recursive: true });
    }
  }

  private startWatching(): void {
    this.watcher = new FSWatcher({
      ignoreInitial: true,
      depth: 0,
    });
    this.watcher.add(this.flowplansDir);
    this.watcher.on('change', (filePath: string) => {
      if (this.suppressWatch) return;
      if (typeof filePath === 'string' && filePath.endsWith('.json') && !filePath.endsWith('.port')) {
        const id = path.basename(filePath, '.json');
        try {
          const doc = this.readSync(id);
          if (doc) {
            this.emit('change', id, doc);
          }
        } catch {
          // File may have been deleted or is malformed
        }
      }
    });
  }

  private filePath(id: string): string {
    return path.join(this.flowplansDir, `${id}.json`);
  }

  private readSync(id: string): FlowPlanDocument | null {
    const fp = this.filePath(id);
    if (!fs.existsSync(fp)) return null;
    const raw = fs.readFileSync(fp, 'utf-8');
    return JSON.parse(raw) as FlowPlanDocument;
  }

  private writeSync(id: string, doc: FlowPlanDocument): void {
    const fp = this.filePath(id);
    const tmp = fp + '.tmp.' + process.pid;
    this.suppressWatch = true;
    try {
      fs.writeFileSync(tmp, JSON.stringify(doc, null, 2), 'utf-8');
      fs.renameSync(tmp, fp);
    } finally {
      // Small delay to let the watcher settle before re-enabling
      setTimeout(() => {
        this.suppressWatch = false;
      }, 100);
    }
    this.emit('change', id, doc);
  }

  getFlowplansDir(): string {
    return this.flowplansDir;
  }

  create(name: string, description?: string, template?: string): string {
    this.ensureDir();
    const id = nameToId(name);
    const now = new Date().toISOString();
    const doc: FlowPlanDocument = {
      id,
      name,
      description: description || '',
      version: 1,
      createdAt: now,
      updatedAt: now,
      viewport: { x: 0, y: 0, zoom: 1 },
      engineeringMode: false,
      nodes: [],
      edges: [],
      annotations: { strokes: [], arrows: [] },
    };

    if (template === 'basic') {
      doc.nodes = [
        {
          id: `start-${randomSuffix()}`,
          type: 'start',
          position: { x: 250, y: 50 },
          parentNode: null,
          data: { label: 'Start', description: '', status: 'pending', metadata: {}, style: {} },
        },
        {
          id: `end-${randomSuffix()}`,
          type: 'end',
          position: { x: 250, y: 350 },
          parentNode: null,
          data: { label: 'End', description: '', status: 'pending', metadata: {}, style: {} },
        },
      ];
    }

    this.writeSync(id, doc);
    return id;
  }

  read(id: string): FlowPlanDocument | null {
    return this.readSync(id);
  }

  update(id: string, data: Partial<FlowPlanDocument>): FlowPlanDocument {
    const doc = this.readSync(id);
    if (!doc) throw new Error(`Flowchart '${id}' not found`);

    const updated: FlowPlanDocument = {
      ...doc,
      ...data,
      id: doc.id, // prevent ID change
      version: doc.version + 1,
      updatedAt: new Date().toISOString(),
    };
    this.writeSync(id, updated);
    return updated;
  }

  addNode(id: string, node: Partial<FlowPlanNode> & { type: FlowPlanNode['type']; data: { label: string } }): string {
    const doc = this.readSync(id);
    if (!doc) throw new Error(`Flowchart '${id}' not found`);

    const nodeId = node.id || `${node.type}-${randomSuffix()}`;
    const fullNode: FlowPlanNode = {
      id: nodeId,
      type: node.type,
      position: node.position || { x: 100, y: 100 },
      parentNode: node.parentNode || null,
      data: {
        label: node.data.label,
        description: node.data?.description || '',
        status: node.data?.status || 'pending',
        metadata: node.data?.metadata || {},
        style: node.data?.style || {},
      },
    };

    doc.nodes.push(fullNode);
    doc.version++;
    doc.updatedAt = new Date().toISOString();
    this.writeSync(id, doc);
    return nodeId;
  }

  removeNode(id: string, nodeId: string): void {
    const doc = this.readSync(id);
    if (!doc) throw new Error(`Flowchart '${id}' not found`);

    doc.nodes = doc.nodes.filter((n) => n.id !== nodeId);
    doc.edges = doc.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    doc.version++;
    doc.updatedAt = new Date().toISOString();
    this.writeSync(id, doc);
  }

  addEdge(id: string, edge: Partial<FlowPlanEdge> & { source: string; target: string }): string {
    const doc = this.readSync(id);
    if (!doc) throw new Error(`Flowchart '${id}' not found`);

    const edgeId = edge.id || `edge-${randomSuffix()}`;
    const fullEdge: FlowPlanEdge = {
      id: edgeId,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'default',
      data: {
        label: edge.data?.label || '',
        animated: edge.data?.animated || false,
      },
    };

    doc.edges.push(fullEdge);
    doc.version++;
    doc.updatedAt = new Date().toISOString();
    this.writeSync(id, doc);
    return edgeId;
  }

  removeEdge(id: string, edgeId: string): void {
    const doc = this.readSync(id);
    if (!doc) throw new Error(`Flowchart '${id}' not found`);

    doc.edges = doc.edges.filter((e) => e.id !== edgeId);
    doc.version++;
    doc.updatedAt = new Date().toISOString();
    this.writeSync(id, doc);
  }

  updateNode(id: string, nodeId: string, updates: Partial<Pick<FlowPlanNode, 'position' | 'parentNode'>> & { data?: Partial<FlowPlanNode['data']> }): void {
    const doc = this.readSync(id);
    if (!doc) throw new Error(`Flowchart '${id}' not found`);

    const node = doc.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error(`Node '${nodeId}' not found in flowchart '${id}'`);

    if (updates.position) node.position = updates.position;
    if (updates.parentNode !== undefined) node.parentNode = updates.parentNode;
    if (updates.data) {
      if (updates.data.label !== undefined) node.data.label = updates.data.label;
      if (updates.data.description !== undefined) node.data.description = updates.data.description;
      if (updates.data.status !== undefined) node.data.status = updates.data.status;
      if (updates.data.metadata !== undefined) node.data.metadata = { ...node.data.metadata, ...updates.data.metadata };
      if (updates.data.style !== undefined) node.data.style = { ...node.data.style, ...updates.data.style };
    }

    doc.version++;
    doc.updatedAt = new Date().toISOString();
    this.writeSync(id, doc);
  }

  list(): Array<{ id: string; name: string; description: string; updatedAt: string }> {
    this.ensureDir();
    const files = fs.readdirSync(this.flowplansDir).filter((f) => f.endsWith('.json'));
    const results: Array<{ id: string; name: string; description: string; updatedAt: string }> = [];
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(this.flowplansDir, file), 'utf-8');
        const doc = JSON.parse(raw) as FlowPlanDocument;
        results.push({ id: doc.id, name: doc.name, description: doc.description, updatedAt: doc.updatedAt });
      } catch {
        // skip malformed files
      }
    }
    return results;
  }

  async close(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }
}
