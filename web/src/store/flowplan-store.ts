import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';
import type {
  FlowPlanDocument,
  FlowPlanNode,
  FlowPlanEdge,
  AnnotationStroke,
  AnnotationArrow,
  InteractionMode,
  FlowPlanNodeData,
  EdgeType,
} from '../types/flowchart';

function getEdgeStyle(edgeType: EdgeType): Record<string, string> {
  switch (edgeType) {
    case 'success':
      return { stroke: 'var(--fp-edge-success)' };
    case 'failure':
      return { stroke: 'var(--fp-edge-failure)', strokeDasharray: '5,5' };
    case 'conditional':
      return { stroke: 'var(--fp-edge-conditional)', strokeDasharray: '3,3' };
    default:
      return { stroke: 'var(--fp-edge-default)' };
  }
}

function fpNodeToRFNode(node: FlowPlanNode): Node {
  const style: Record<string, any> = {};
  if (node.type === 'phase_group') {
    style.width = node.data.style?.width ?? 400;
    style.height = node.data.style?.height ?? 250;
  }
  return {
    id: node.id,
    type: node.type,
    position: node.position,
    parentId: node.parentNode ?? undefined,
    data: { ...node.data },
    ...(Object.keys(style).length > 0 ? { style } : {}),
  };
}

function rfNodeToFPNode(node: Node): FlowPlanNode {
  const data = node.data as unknown as FlowPlanNodeData;
  return {
    id: node.id,
    type: (node.type ?? 'task') as FlowPlanNode['type'],
    position: node.position,
    parentNode: (node.parentId as string) ?? null,
    data: {
      label: data.label ?? '',
      description: data.description ?? '',
      status: data.status ?? 'pending',
      metadata: data.metadata ?? {},
      style: data.style ?? {},
    },
  };
}

function fpEdgeToRFEdge(edge: FlowPlanEdge): Edge {
  const edgeType = edge.type ?? 'default';
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'default',
    label: edge.data?.label ?? '',
    animated: edge.data?.animated ?? false,
    style: getEdgeStyle(edgeType),
    data: { edgeType, label: edge.data?.label ?? '', animated: edge.data?.animated ?? false },
  };
}

function rfEdgeToFPEdge(edge: Edge): FlowPlanEdge {
  const edgeType = ((edge.data as any)?.edgeType ?? 'default') as EdgeType;
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edgeType,
    data: {
      label: ((edge.data as any)?.label ?? edge.label ?? '') as string,
      animated: ((edge.data as any)?.animated ?? edge.animated ?? false) as boolean,
    },
  };
}

interface HistoryEntry {
  nodes: Node[];
  edges: Edge[];
  strokes: AnnotationStroke[];
  arrows: AnnotationArrow[];
}

interface FlowPlanStore {
  // Flow slice
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<FlowPlanNodeData>) => void;

  // Annotation slice
  strokes: AnnotationStroke[];
  arrows: AnnotationArrow[];
  addStroke: (stroke: AnnotationStroke) => void;
  removeStroke: (strokeId: string) => void;
  addArrow: (arrow: AnnotationArrow) => void;
  removeArrow: (arrowId: string) => void;

  // UI slice
  interactionMode: InteractionMode;
  setInteractionMode: (mode: InteractionMode) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  selectedEdgeId: string | null;
  setSelectedEdgeId: (id: string | null) => void;
  showEngineering: boolean;
  toggleEngineering: () => void;
  flowchartId: string | null;
  flowchartName: string;
  flowchartDescription: string;

  // History slice
  past: HistoryEntry[];
  future: HistoryEntry[];
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Persistence slice
  isDirty: boolean;
  lastSavedAt: Date | null;
  markDirty: () => void;
  markSaved: () => void;

  // Serialization
  toDocument: () => FlowPlanDocument;
  fromDocument: (doc: FlowPlanDocument) => void;
}

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('fp-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const useFlowPlanStore = create<FlowPlanStore>((set, get) => ({
  // Flow slice
  nodes: [],
  edges: [],
  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
    get().markDirty();
  },
  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
    get().markDirty();
  },
  onConnect: (connection: Connection) => {
    get().pushHistory();
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          style: getEdgeStyle('default'),
          data: { edgeType: 'default', label: '', animated: false },
        },
        state.edges,
      ),
    }));
    get().markDirty();
  },
  addNode: (node) => {
    get().pushHistory();
    set((state) => ({ nodes: [...state.nodes, node] }));
    get().markDirty();
  },
  removeNode: (nodeId) => {
    get().pushHistory();
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    }));
    get().markDirty();
  },
  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
      ),
    }));
    get().markDirty();
  },

  // Annotation slice
  strokes: [],
  arrows: [],
  addStroke: (stroke) => {
    get().pushHistory();
    set((state) => ({ strokes: [...state.strokes, stroke] }));
    get().markDirty();
  },
  removeStroke: (strokeId) => {
    get().pushHistory();
    set((state) => ({ strokes: state.strokes.filter((s) => s.id !== strokeId) }));
    get().markDirty();
  },
  addArrow: (arrow) => {
    get().pushHistory();
    set((state) => ({ arrows: [...state.arrows, arrow] }));
    get().markDirty();
  },
  removeArrow: (arrowId) => {
    get().pushHistory();
    set((state) => ({ arrows: state.arrows.filter((a) => a.id !== arrowId) }));
    get().markDirty();
  },

  // UI slice
  interactionMode: 'select',
  setInteractionMode: (mode) => set({ interactionMode: mode }),
  theme: getInitialTheme(),
  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('fp-theme', next);
      return { theme: next };
    });
  },
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
  selectedEdgeId: null,
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
  showEngineering: false,
  toggleEngineering: () => set((state) => ({ showEngineering: !state.showEngineering })),
  flowchartId: null,
  flowchartName: '',
  flowchartDescription: '',

  // History slice
  past: [],
  future: [],
  pushHistory: () => {
    const { nodes, edges, strokes, arrows, past } = get();
    const entry: HistoryEntry = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      strokes: JSON.parse(JSON.stringify(strokes)),
      arrows: JSON.parse(JSON.stringify(arrows)),
    };
    set({ past: [...past.slice(-49), entry], future: [] });
  },
  undo: () => {
    const { past, nodes, edges, strokes, arrows } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const current: HistoryEntry = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      strokes: JSON.parse(JSON.stringify(strokes)),
      arrows: JSON.parse(JSON.stringify(arrows)),
    };
    set({
      past: past.slice(0, -1),
      future: [...get().future, current],
      nodes: previous.nodes,
      edges: previous.edges,
      strokes: previous.strokes,
      arrows: previous.arrows,
    });
    get().markDirty();
  },
  redo: () => {
    const { future, nodes, edges, strokes, arrows } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    const current: HistoryEntry = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      strokes: JSON.parse(JSON.stringify(strokes)),
      arrows: JSON.parse(JSON.stringify(arrows)),
    };
    set({
      future: future.slice(0, -1),
      past: [...get().past, current],
      nodes: next.nodes,
      edges: next.edges,
      strokes: next.strokes,
      arrows: next.arrows,
    });
    get().markDirty();
  },
  get canUndo() {
    return get().past.length > 0;
  },
  get canRedo() {
    return get().future.length > 0;
  },

  // Persistence slice
  isDirty: false,
  lastSavedAt: null,
  markDirty: () => set({ isDirty: true }),
  markSaved: () => set({ isDirty: false, lastSavedAt: new Date() }),

  // Serialization
  toDocument: (): FlowPlanDocument => {
    const state = get();
    return {
      id: state.flowchartId ?? '',
      name: state.flowchartName,
      description: state.flowchartDescription,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewport: { x: 0, y: 0, zoom: 1 },
      engineeringMode: state.showEngineering,
      nodes: state.nodes.map(rfNodeToFPNode),
      edges: state.edges.map(rfEdgeToFPEdge),
      annotations: {
        strokes: state.strokes,
        arrows: state.arrows,
      },
    };
  },
  fromDocument: (doc: FlowPlanDocument) => {
    set({
      flowchartId: doc.id,
      flowchartName: doc.name,
      flowchartDescription: doc.description,
      showEngineering: doc.engineeringMode ?? false,
      nodes: doc.nodes.map(fpNodeToRFNode),
      edges: doc.edges.map(fpEdgeToRFEdge),
      strokes: doc.annotations?.strokes ?? [],
      arrows: doc.annotations?.arrows ?? [],
      past: [],
      future: [],
      isDirty: false,
    });
  },
}));
