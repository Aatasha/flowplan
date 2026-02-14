import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useFlowPlanStore } from './store/flowplan-store';
import { FlowCanvas } from './components/FlowCanvas';
import { Toolbar } from './components/Toolbar';
import { NodePalette } from './components/NodePalette';
import { PropertiesPanel } from './components/PropertiesPanel';
import { useAutoSave } from './hooks/useAutoSave';
import { useWebSocket } from './hooks/useWebSocket';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  const theme = useFlowPlanStore((s) => s.theme);
  const fromDocument = useFlowPlanStore((s) => s.fromDocument);

  // Apply theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Load flowchart on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    async function load() {
      try {
        if (id) {
          const res = await fetch(`/api/flowchart/${id}`);
          if (res.ok) {
            const doc = await res.json();
            fromDocument(doc);
            return;
          }
        }
        // Fallback: load first available
        const res = await fetch('/api/flowcharts');
        if (res.ok) {
          const list = await res.json();
          if (list.length > 0) {
            const first = await fetch(`/api/flowchart/${list[0].id}`);
            if (first.ok) {
              fromDocument(await first.json());
            }
          }
        }
      } catch (err) {
        console.error('Failed to load flowchart:', err);
      }
    }

    load();
  }, [fromDocument]);

  return (
    <ReactFlowProvider>
      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Toolbar />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <NodePalette />
          <FlowCanvas />
          <PropertiesPanel />
        </div>
      </div>
      <AutoSaveAndSocket />
    </ReactFlowProvider>
  );
}

function AutoSaveAndSocket() {
  useAutoSave();
  useWebSocket();
  useKeyboardShortcuts();
  return null;
}
