import {
  MousePointer2,
  Pencil,
  StickyNote,
  Type,
  ArrowRight,
  Eraser,
  Undo2,
  Redo2,
  LayoutGrid,
  Wrench,
  Sun,
  Moon,
} from 'lucide-react';
import { useFlowPlanStore } from '../store/flowplan-store';
import { useAutoLayout } from '../hooks/useAutoLayout';
import type { InteractionMode } from '../types/flowchart';

const modeButtons: { mode: InteractionMode; Icon: typeof MousePointer2; label: string }[] = [
  { mode: 'select', Icon: MousePointer2, label: 'Select' },
  { mode: 'pen', Icon: Pencil, label: 'Pen' },
  { mode: 'sticky', Icon: StickyNote, label: 'Sticky' },
  { mode: 'text', Icon: Type, label: 'Text' },
  { mode: 'arrow', Icon: ArrowRight, label: 'Arrow' },
  { mode: 'eraser', Icon: Eraser, label: 'Eraser' },
];

export function Toolbar() {
  const interactionMode = useFlowPlanStore((s) => s.interactionMode);
  const setInteractionMode = useFlowPlanStore((s) => s.setInteractionMode);
  const undo = useFlowPlanStore((s) => s.undo);
  const redo = useFlowPlanStore((s) => s.redo);
  const past = useFlowPlanStore((s) => s.past);
  const future = useFlowPlanStore((s) => s.future);
  const showEngineering = useFlowPlanStore((s) => s.showEngineering);
  const toggleEngineering = useFlowPlanStore((s) => s.toggleEngineering);
  const theme = useFlowPlanStore((s) => s.theme);
  const toggleTheme = useFlowPlanStore((s) => s.toggleTheme);
  const isDirty = useFlowPlanStore((s) => s.isDirty);
  const flowchartName = useFlowPlanStore((s) => s.flowchartName);
  const triggerLayout = useAutoLayout();

  const btnStyle = (active: boolean) => ({
    background: active ? 'var(--fp-accent)' : 'transparent',
    color: active ? '#fff' : 'var(--fp-text)',
    border: '1px solid var(--fp-border)',
    borderRadius: 6,
    padding: '4px 8px',
    cursor: 'pointer',
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 4,
    fontSize: 11,
  });

  return (
    <div
      style={{
        background: 'var(--fp-bg-secondary)',
        borderBottom: '1px solid var(--fp-border)',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 14, marginRight: 12 }}>
        {flowchartName || 'FlowPlan'}
      </span>

      <div style={{ display: 'flex', gap: 2, borderRight: '1px solid var(--fp-border)', paddingRight: 8 }}>
        {modeButtons.map(({ mode, Icon, label }) => (
          <button
            key={mode}
            style={btnStyle(interactionMode === mode)}
            onClick={() => setInteractionMode(mode)}
            title={label}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 2, borderRight: '1px solid var(--fp-border)', paddingRight: 8 }}>
        <button
          style={{ ...btnStyle(false), opacity: past.length === 0 ? 0.4 : 1 }}
          onClick={undo}
          disabled={past.length === 0}
          title="Undo"
        >
          <Undo2 size={14} />
        </button>
        <button
          style={{ ...btnStyle(false), opacity: future.length === 0 ? 0.4 : 1 }}
          onClick={redo}
          disabled={future.length === 0}
          title="Redo"
        >
          <Redo2 size={14} />
        </button>
      </div>

      <button style={btnStyle(false)} onClick={triggerLayout} title="Auto-arrange">
        <LayoutGrid size={14} />
        <span>Arrange</span>
      </button>

      <button
        style={btnStyle(showEngineering)}
        onClick={toggleEngineering}
        title="Toggle engineering nodes"
      >
        <Wrench size={14} />
      </button>

      <div style={{ flex: 1 }} />

      <span
        style={{
          fontSize: 11,
          color: isDirty ? '#c62828' : '#2e7d32',
          fontWeight: 600,
        }}
      >
        {isDirty ? 'Unsaved' : 'Saved'}
      </span>

      <button style={btnStyle(false)} onClick={toggleTheme} title="Toggle theme">
        {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
      </button>
    </div>
  );
}
