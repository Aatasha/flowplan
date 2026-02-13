import ELK from 'elkjs/lib/elk.bundled.js';
import type { FlowPlanDocument, FlowPlanNode } from './flowchart-store.js';

const elk = new ELK();

const ANNOTATION_TYPES = new Set(['annotation_note', 'annotation_text']);

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 60;
const GROUP_PADDING = 40;

interface ElkNode {
  id: string;
  width: number;
  height: number;
  children?: ElkNode[];
  layoutOptions?: Record<string, string>;
}

interface ElkEdge {
  id: string;
  sources: string[];
  targets: string[];
}

interface ElkGraph {
  id: string;
  layoutOptions: Record<string, string>;
  children: ElkNode[];
  edges: ElkEdge[];
}

export async function autoLayout(
  doc: FlowPlanDocument,
  direction: 'TB' | 'LR' = 'TB'
): Promise<FlowPlanDocument> {
  // Separate annotation nodes from layout-eligible nodes
  const layoutNodes = doc.nodes.filter((n) => !ANNOTATION_TYPES.has(n.type));
  const annotationNodes = doc.nodes.filter((n) => ANNOTATION_TYPES.has(n.type));

  // Build group hierarchy: find which nodes are children of phase_groups
  const groups = new Map<string, FlowPlanNode[]>();
  const topLevel: FlowPlanNode[] = [];

  for (const node of layoutNodes) {
    if (node.parentNode) {
      const children = groups.get(node.parentNode) || [];
      children.push(node);
      groups.set(node.parentNode, children);
    } else if (node.type !== 'phase_group') {
      topLevel.push(node);
    }
  }

  // Build ELK nodes
  const elkChildren: ElkNode[] = [];

  // Add phase groups as compound nodes
  for (const node of layoutNodes) {
    if (node.type === 'phase_group') {
      const children = groups.get(node.id) || [];
      elkChildren.push({
        id: node.id,
        width: DEFAULT_NODE_WIDTH * 2,
        height: DEFAULT_NODE_HEIGHT * 2,
        layoutOptions: {
          'elk.padding': `[top=${GROUP_PADDING},left=${GROUP_PADDING},bottom=${GROUP_PADDING},right=${GROUP_PADDING}]`,
        },
        children: children.map((child) => ({
          id: child.id,
          width: DEFAULT_NODE_WIDTH,
          height: DEFAULT_NODE_HEIGHT,
        })),
      });
    }
  }

  // Add top-level non-group nodes
  for (const node of topLevel) {
    elkChildren.push({
      id: node.id,
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT,
    });
  }

  // Build ELK edges (only for layout-eligible nodes)
  const layoutNodeIds = new Set(layoutNodes.map((n) => n.id));
  const elkEdges: ElkEdge[] = doc.edges
    .filter((e) => layoutNodeIds.has(e.source) && layoutNodeIds.has(e.target))
    .map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    }));

  const elkGraph: ElkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction === 'TB' ? 'DOWN' : 'RIGHT',
      'elk.spacing.nodeNode': '50',
      'elk.layered.spacing.nodeNodeBetweenLayers': '80',
    },
    children: elkChildren,
    edges: elkEdges,
  };

  const layout = await elk.layout(elkGraph as any);

  // Map positions back from ELK output
  const positionMap = new Map<string, { x: number; y: number }>();

  function extractPositions(children: any[], offsetX = 0, offsetY = 0): void {
    for (const child of children) {
      const x = (child.x ?? 0) + offsetX;
      const y = (child.y ?? 0) + offsetY;
      positionMap.set(child.id, { x, y });
      if (child.children) {
        extractPositions(child.children, x, y);
      }
    }
  }

  if (layout.children) {
    extractPositions(layout.children);
  }

  // Apply new positions to the document
  const updatedNodes = doc.nodes.map((node) => {
    const newPos = positionMap.get(node.id);
    if (newPos) {
      return { ...node, position: newPos };
    }
    return node;
  });

  return {
    ...doc,
    nodes: updatedNodes,
    version: doc.version + 1,
    updatedAt: new Date().toISOString(),
  };
}
