import { useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useFlowPlanStore } from '../store/flowplan-store';
import type { NodeType, NodeStatus, EdgeType } from '../types/flowchart';
import type { FlowPlanNodeData } from '../types/flowchart';
import { PLANNING_NODE_TYPES, ENGINEERING_NODE_TYPES } from '../types/flowchart';

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  task: 'Task',
  decision: 'Decision',
  note: 'Note',
  phase_group: 'Phase Group',
  start: 'Start',
  end: 'End',
  milestone: 'Milestone',
  file_ref: 'File Ref',
  api_endpoint: 'API Endpoint',
  db_entity: 'DB Entity',
  test_checkpoint: 'Test',
  mcp_tool: 'MCP Tool',
  human_action: 'Human Action',
  parallel_fork: 'Fork/Join',
  annotation_note: 'Annotation Note',
  annotation_text: 'Annotation Text',
};

const STATUS_OPTIONS: { value: NodeStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' },
];

const EDGE_TYPE_OPTIONS: { value: EdgeType; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' },
  { value: 'conditional', label: 'Conditional' },
];

const menuStyle: React.CSSProperties = {
  position: 'fixed',
  zIndex: 1000,
  background: 'var(--fp-bg)',
  border: '1px solid var(--fp-border)',
  borderRadius: 8,
  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  padding: '4px 0',
  minWidth: 180,
  fontSize: 12,
};

const itemStyle: React.CSSProperties = {
  padding: '6px 12px',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const dangerStyle: React.CSSProperties = {
  ...itemStyle,
  color: 'var(--fp-status-blocked)',
};

const subMenuStyle: React.CSSProperties = {
  position: 'absolute',
  left: '100%',
  top: 0,
  background: 'var(--fp-bg)',
  border: '1px solid var(--fp-border)',
  borderRadius: 8,
  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  padding: '4px 0',
  minWidth: 160,
};

const separatorStyle: React.CSSProperties = {
  height: 1,
  background: 'var(--fp-border)',
  margin: '4px 0',
};

function MenuItem({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick?: () => void;
  danger?: boolean;
  children?: React.ReactNode;
}) {
  const hasSubmenu = !!children;
  return (
    <div style={{ position: 'relative' }} className="fp-ctx-item">
      <div
        style={danger ? dangerStyle : itemStyle}
        onClick={(e) => {
          if (!hasSubmenu && onClick) {
            e.stopPropagation();
            onClick();
          }
        }}
      >
        <span>{label}</span>
        {hasSubmenu && <span style={{ fontSize: 10, opacity: 0.6 }}>▸</span>}
      </div>
      {hasSubmenu && <div className="fp-ctx-submenu" style={subMenuStyle}>{children}</div>}
    </div>
  );
}

export function ContextMenu() {
  const contextMenu = useFlowPlanStore((s) => s.contextMenu);
  const setContextMenu = useFlowPlanStore((s) => s.setContextMenu);
  const nodes = useFlowPlanStore((s) => s.nodes);
  const addNode = useFlowPlanStore((s) => s.addNode);
  const removeNode = useFlowPlanStore((s) => s.removeNode);
  const removeEdge = useFlowPlanStore((s) => s.removeEdge);
  const moveNode = useFlowPlanStore((s) => s.moveNode);
  const updateNodeData = useFlowPlanStore((s) => s.updateNodeData);
  const updateEdgeData = useFlowPlanStore((s) => s.updateEdgeData);
  const setSelectedNodeId = useFlowPlanStore((s) => s.setSelectedNodeId);
  const setSelectedEdgeId = useFlowPlanStore((s) => s.setSelectedEdgeId);
  const showEngineering = useFlowPlanStore((s) => s.showEngineering);
  const { screenToFlowPosition, getNodes } = useReactFlow();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!contextMenu) return;
    function handleClick() {
      setContextMenu(null);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu, setContextMenu]);

  if (!contextMenu) return null;

  const close = () => setContextMenu(null);

  // Detect which phase_group a flow-space position falls inside
  function findGroupAtPosition(flowX: number, flowY: number): string | null {
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
        return n.id;
      }
    }
    return null;
  }

  function handleAddNode(type: NodeType) {
    const flowPos = screenToFlowPosition({ x: contextMenu!.x, y: contextMenu!.y });
    let parentId: string | undefined;
    let position = flowPos;

    if (type !== 'phase_group') {
      const groupId = findGroupAtPosition(flowPos.x, flowPos.y);
      if (groupId) {
        const group = getNodes().find((n) => n.id === groupId);
        if (group) {
          parentId = groupId;
          position = { x: flowPos.x - group.position.x, y: flowPos.y - group.position.y };
        }
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
    close();
  }

  // Canvas right-click: "Add Node" submenu
  if (contextMenu.target.type === 'canvas') {
    const availableTypes = showEngineering
      ? [...PLANNING_NODE_TYPES, ...ENGINEERING_NODE_TYPES]
      : PLANNING_NODE_TYPES;

    return (
      <div ref={ref} style={{ ...menuStyle, left: contextMenu.x, top: contextMenu.y }}>
        <MenuItem label="Add Node">
          {availableTypes.map((t) => (
            <div
              key={t}
              style={itemStyle}
              onClick={(e) => {
                e.stopPropagation();
                handleAddNode(t);
              }}
            >
              {NODE_TYPE_LABELS[t] ?? t}
            </div>
          ))}
        </MenuItem>
      </div>
    );
  }

  // Node right-click
  if (contextMenu.target.type === 'node') {
    const nodeId = contextMenu.target.nodeId;
    const node = nodes.find((n) => n.id === nodeId);
    const currentStatus = (node?.data as any)?.status ?? 'pending';
    const phaseGroups = nodes.filter((n) => n.type === 'phase_group' && n.id !== nodeId);

    return (
      <div ref={ref} style={{ ...menuStyle, left: contextMenu.x, top: contextMenu.y }}>
        <MenuItem
          label="Delete Node"
          danger
          onClick={() => {
            removeNode(nodeId);
            setSelectedNodeId(null);
            close();
          }}
        />
        <div style={separatorStyle} />
        <MenuItem label={`Status: ${currentStatus.replace(/_/g, ' ')}`}>
          {STATUS_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              style={{
                ...itemStyle,
                fontWeight: opt.value === currentStatus ? 700 : 400,
              }}
              onClick={(e) => {
                e.stopPropagation();
                updateNodeData(nodeId, { status: opt.value });
                close();
              }}
            >
              {opt.label}
            </div>
          ))}
        </MenuItem>
        <MenuItem label="Move to Group">
          {phaseGroups.map((g) => (
            <div
              key={g.id}
              style={{
                ...itemStyle,
                fontWeight: node?.parentId === g.id ? 700 : 400,
              }}
              onClick={(e) => {
                e.stopPropagation();
                moveNode(nodeId, g.id);
                close();
              }}
            >
              {(g.data as any).label || g.id}
            </div>
          ))}
          <div style={separatorStyle} />
          <div
            style={itemStyle}
            onClick={(e) => {
              e.stopPropagation();
              moveNode(nodeId, null);
              close();
            }}
          >
            Remove from group
          </div>
        </MenuItem>
      </div>
    );
  }

  // Edge right-click
  if (contextMenu.target.type === 'edge') {
    const edgeId = contextMenu.target.edgeId;
    const edge = useFlowPlanStore.getState().edges.find((e) => e.id === edgeId);
    const currentType = ((edge?.data as any)?.edgeType ?? 'default') as EdgeType;

    return (
      <div ref={ref} style={{ ...menuStyle, left: contextMenu.x, top: contextMenu.y }}>
        <MenuItem
          label="Delete Edge"
          danger
          onClick={() => {
            removeEdge(edgeId);
            setSelectedEdgeId(null);
            close();
          }}
        />
        <div style={separatorStyle} />
        <MenuItem label={`Type: ${currentType}`}>
          {EDGE_TYPE_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              style={{
                ...itemStyle,
                fontWeight: opt.value === currentType ? 700 : 400,
              }}
              onClick={(e) => {
                e.stopPropagation();
                updateEdgeData(edgeId, { edgeType: opt.value });
                close();
              }}
            >
              {opt.label}
            </div>
          ))}
        </MenuItem>
      </div>
    );
  }

  return null;
}
