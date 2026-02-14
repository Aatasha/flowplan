import { useEffect } from 'react';
import { useFlowPlanStore } from '../store/flowplan-store';

function isEditingText(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      // Escape always works — deselect and close context menu
      if (e.key === 'Escape') {
        useFlowPlanStore.getState().deselectAll();
        return;
      }

      // All other shortcuts are blocked when editing text
      if (isEditingText()) return;

      // Cmd/Ctrl+Z — undo, Cmd/Ctrl+Shift+Z — redo
      if (mod && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useFlowPlanStore.getState().redo();
        } else {
          useFlowPlanStore.getState().undo();
        }
        return;
      }

      // Delete / Backspace — remove selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        useFlowPlanStore.getState().removeSelected();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
