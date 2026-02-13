import { useFlowPlanStore } from '../store/flowplan-store';
import type { NodeStatus, EdgeType } from '../types/flowchart';

export function PropertiesPanel() {
  const selectedNodeId = useFlowPlanStore((s) => s.selectedNodeId);
  const selectedEdgeId = useFlowPlanStore((s) => s.selectedEdgeId);
  const nodes = useFlowPlanStore((s) => s.nodes);
  const edges = useFlowPlanStore((s) => s.edges);
  const updateNodeData = useFlowPlanStore((s) => s.updateNodeData);
  const flowchartName = useFlowPlanStore((s) => s.flowchartName);
  const flowchartDescription = useFlowPlanStore((s) => s.flowchartDescription);

  const selectedNode = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;
  const selectedEdge = selectedEdgeId ? edges.find((e) => e.id === selectedEdgeId) : null;

  const labelStyle = {
    fontSize: 10,
    fontWeight: 700 as const,
    textTransform: 'uppercase' as const,
    color: 'var(--fp-text-secondary)',
    marginBottom: 4,
    marginTop: 12,
  };

  const inputStyle = {
    width: '100%',
    padding: '6px 8px',
    borderRadius: 4,
    border: '1px solid var(--fp-border)',
    background: 'var(--fp-bg)',
    color: 'var(--fp-text)',
    fontSize: 12,
    boxSizing: 'border-box' as const,
  };

  return (
    <div
      style={{
        width: 280,
        background: 'var(--fp-bg-secondary)',
        borderLeft: '1px solid var(--fp-border)',
        padding: '12px',
        overflowY: 'auto',
      }}
    >
      {selectedNode ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Node Properties</div>
          <div style={{ fontSize: 10, color: 'var(--fp-text-secondary)', marginBottom: 8 }}>
            {selectedNode.type?.replace(/_/g, ' ')} - {selectedNode.id}
          </div>

          <div style={labelStyle}>Label</div>
          <input
            style={inputStyle}
            value={(selectedNode.data as any).label ?? ''}
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
          />

          <div style={labelStyle}>Description</div>
          <textarea
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
            value={(selectedNode.data as any).description ?? ''}
            onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
          />

          <div style={labelStyle}>Status</div>
          <select
            style={inputStyle}
            value={(selectedNode.data as any).status ?? 'pending'}
            onChange={(e) => updateNodeData(selectedNode.id, { status: e.target.value as NodeStatus })}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>

          {/* Type-specific metadata */}
          {selectedNode.type === 'file_ref' && (
            <>
              <div style={labelStyle}>Action</div>
              <select
                style={inputStyle}
                value={(selectedNode.data as any).metadata?.action ?? 'modify'}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, {
                    metadata: { ...(selectedNode.data as any).metadata, action: e.target.value },
                  })
                }
              >
                <option value="create">Create</option>
                <option value="modify">Modify</option>
                <option value="delete">Delete</option>
              </select>
            </>
          )}

          {selectedNode.type === 'api_endpoint' && (
            <>
              <div style={labelStyle}>Method</div>
              <select
                style={inputStyle}
                value={(selectedNode.data as any).metadata?.method ?? 'GET'}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, {
                    metadata: { ...(selectedNode.data as any).metadata, method: e.target.value },
                  })
                }
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
              <div style={labelStyle}>Path</div>
              <input
                style={inputStyle}
                value={(selectedNode.data as any).metadata?.path ?? ''}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, {
                    metadata: { ...(selectedNode.data as any).metadata, path: e.target.value },
                  })
                }
              />
            </>
          )}

          {selectedNode.type === 'mcp_tool' && (
            <>
              <div style={labelStyle}>Server Name</div>
              <input
                style={inputStyle}
                value={(selectedNode.data as any).metadata?.serverName ?? ''}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, {
                    metadata: { ...(selectedNode.data as any).metadata, serverName: e.target.value },
                  })
                }
              />
              <div style={labelStyle}>Tool Name</div>
              <input
                style={inputStyle}
                value={(selectedNode.data as any).metadata?.toolName ?? ''}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, {
                    metadata: { ...(selectedNode.data as any).metadata, toolName: e.target.value },
                  })
                }
              />
            </>
          )}

          {selectedNode.type === 'parallel_fork' && (
            <>
              <div style={labelStyle}>Mode</div>
              <select
                style={inputStyle}
                value={(selectedNode.data as any).metadata?.mode ?? 'fork'}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, {
                    metadata: { ...(selectedNode.data as any).metadata, mode: e.target.value },
                  })
                }
              >
                <option value="fork">Fork</option>
                <option value="join">Join</option>
              </select>
            </>
          )}
        </>
      ) : selectedEdge ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Edge Properties</div>

          <div style={labelStyle}>Label</div>
          <input
            style={inputStyle}
            value={(selectedEdge.data as any)?.label ?? ''}
            readOnly
          />

          <div style={labelStyle}>Type</div>
          <select
            style={inputStyle}
            value={(selectedEdge.data as any)?.edgeType ?? 'default'}
            disabled
          >
            <option value="default">Default</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="conditional">Conditional</option>
          </select>
        </>
      ) : (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Flowchart</div>
          <div style={{ fontSize: 14, marginBottom: 8 }}>{flowchartName || 'Untitled'}</div>
          {flowchartDescription && (
            <div style={{ fontSize: 12, color: 'var(--fp-text-secondary)' }}>
              {flowchartDescription}
            </div>
          )}
          <div style={{ ...labelStyle, marginTop: 24 }}>Tip</div>
          <div style={{ fontSize: 11, color: 'var(--fp-text-secondary)' }}>
            Drag nodes from the left palette onto the canvas. Click a node to see its properties here.
          </div>
        </>
      )}
    </div>
  );
}
