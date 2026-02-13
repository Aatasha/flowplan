import { useEffect, useRef } from 'react';
import { useFlowPlanStore } from '../store/flowplan-store';

export function useWebSocket() {
  const flowchartId = useFlowPlanStore((s) => s.flowchartId);
  const fromDocument = useFlowPlanStore((s) => s.fromDocument);
  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);

  useEffect(() => {
    let cancelled = false;

    function connect() {
      if (cancelled) return;

      const port = window.location.port;
      const ws = new WebSocket(`ws://localhost:${port}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        retryCount.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'flowchart_update' && msg.id === flowchartId) {
            fromDocument(msg.data);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000);
        retryCount.current++;
        setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, [flowchartId, fromDocument]);
}
