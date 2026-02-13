import { useEffect } from 'react';
import { useFlowPlanStore } from '../store/flowplan-store';

export function useAutoSave() {
  const isDirty = useFlowPlanStore((s) => s.isDirty);
  const flowchartId = useFlowPlanStore((s) => s.flowchartId);
  const markSaved = useFlowPlanStore((s) => s.markSaved);
  const toDocument = useFlowPlanStore((s) => s.toDocument);

  useEffect(() => {
    if (!isDirty || !flowchartId) return;
    const timer = setTimeout(async () => {
      try {
        const doc = toDocument();
        await fetch(`/api/flowchart/${flowchartId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doc),
        });
        markSaved();
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [isDirty, flowchartId, markSaved, toDocument]);
}
