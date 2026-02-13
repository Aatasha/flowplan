import {
  CheckSquare, GitBranch, StickyNote, Box, Play, Square, Flag,
  FileCode, Globe, Database, CheckCircle, Plug, User, GitFork,
} from 'lucide-react';
import { useFlowPlanStore } from '../store/flowplan-store';
import type { NodeType } from '../types/flowchart';

interface PaletteItem {
  type: NodeType;
  label: string;
  Icon: typeof CheckSquare;
}

const planningItems: PaletteItem[] = [
  { type: 'task', label: 'Task', Icon: CheckSquare },
  { type: 'decision', label: 'Decision', Icon: GitBranch },
  { type: 'note', label: 'Note', Icon: StickyNote },
  { type: 'phase_group', label: 'Phase Group', Icon: Box },
  { type: 'start', label: 'Start', Icon: Play },
  { type: 'end', label: 'End', Icon: Square },
  { type: 'milestone', label: 'Milestone', Icon: Flag },
];

const engineeringItems: PaletteItem[] = [
  { type: 'file_ref', label: 'File Ref', Icon: FileCode },
  { type: 'api_endpoint', label: 'API Endpoint', Icon: Globe },
  { type: 'db_entity', label: 'DB Entity', Icon: Database },
  { type: 'test_checkpoint', label: 'Test', Icon: CheckCircle },
  { type: 'mcp_tool', label: 'MCP Tool', Icon: Plug },
  { type: 'human_action', label: 'Human Action', Icon: User },
  { type: 'parallel_fork', label: 'Fork/Join', Icon: GitFork },
];

function PaletteCard({ item }: { item: PaletteItem }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/flowplan-node-type', item.type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 6,
        border: '1px solid var(--fp-border)',
        background: 'var(--fp-bg)',
        cursor: 'grab',
        fontSize: 12,
        userSelect: 'none',
      }}
    >
      <item.Icon size={14} style={{ color: 'var(--fp-text-secondary)', flexShrink: 0 }} />
      <span>{item.label}</span>
    </div>
  );
}

export function NodePalette() {
  const showEngineering = useFlowPlanStore((s) => s.showEngineering);

  return (
    <div
      style={{
        width: 200,
        background: 'var(--fp-bg-secondary)',
        borderRight: '1px solid var(--fp-border)',
        padding: '12px 8px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--fp-text-secondary)', marginBottom: 4 }}>
        Planning
      </div>
      {planningItems.map((item) => (
        <PaletteCard key={item.type} item={item} />
      ))}

      {showEngineering && (
        <>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--fp-text-secondary)',
              marginTop: 12,
              marginBottom: 4,
            }}
          >
            Engineering
          </div>
          {engineeringItems.map((item) => (
            <PaletteCard key={item.type} item={item} />
          ))}
        </>
      )}
    </div>
  );
}
