export type NodeType =
  | 'task' | 'decision' | 'note' | 'phase_group' | 'start' | 'end' | 'milestone'
  | 'file_ref' | 'api_endpoint' | 'db_entity' | 'test_checkpoint' | 'mcp_tool'
  | 'human_action' | 'parallel_fork' | 'annotation_note' | 'annotation_text';

export type EdgeType = 'default' | 'success' | 'failure' | 'conditional';
export type NodeStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type InteractionMode = 'select' | 'pen' | 'sticky' | 'text' | 'arrow' | 'eraser';

export interface FlowPlanNodeData {
  label: string;
  description: string;
  status: NodeStatus;
  metadata: Record<string, any>;
  style: Record<string, any>;
}

export interface FlowPlanNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  parentNode: string | null;
  data: FlowPlanNodeData;
}

export interface FlowPlanEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
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

export const ENGINEERING_NODE_TYPES: NodeType[] = [
  'file_ref', 'api_endpoint', 'db_entity', 'test_checkpoint',
  'mcp_tool', 'human_action', 'parallel_fork',
];

export const PLANNING_NODE_TYPES: NodeType[] = [
  'task', 'decision', 'note', 'phase_group', 'start', 'end', 'milestone',
];
