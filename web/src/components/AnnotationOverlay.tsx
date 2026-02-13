import { useCallback, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import getStroke from 'perfect-freehand';
import { useFlowPlanStore } from '../store/flowplan-store';

function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return '';
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q'] as (string | number)[],
  );
  d.push('Z');
  return d.join(' ');
}

export function AnnotationOverlay() {
  const { getViewport } = useReactFlow();
  const interactionMode = useFlowPlanStore((s) => s.interactionMode);
  const strokes = useFlowPlanStore((s) => s.strokes);
  const arrows = useFlowPlanStore((s) => s.arrows);
  const addStroke = useFlowPlanStore((s) => s.addStroke);
  const addArrow = useFlowPlanStore((s) => s.addArrow);
  const removeStroke = useFlowPlanStore((s) => s.removeStroke);
  const removeArrow = useFlowPlanStore((s) => s.removeArrow);

  const currentPoints = useRef<[number, number, number][]>([]);
  const arrowStart = useRef<{ x: number; y: number } | null>(null);
  const isDrawing = useRef(false);

  const screenToFlow = useCallback(
    (clientX: number, clientY: number) => {
      const vp = getViewport();
      const svg = document.getElementById('annotation-svg');
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: (clientX - rect.left - vp.x) / vp.zoom,
        y: (clientY - rect.top - vp.y) / vp.zoom,
      };
    },
    [getViewport],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (interactionMode === 'select') return;
      const pt = screenToFlow(e.clientX, e.clientY);

      if (interactionMode === 'pen') {
        isDrawing.current = true;
        currentPoints.current = [[pt.x, pt.y, e.pressure]];
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } else if (interactionMode === 'arrow') {
        isDrawing.current = true;
        arrowStart.current = pt;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } else if (interactionMode === 'eraser') {
        // Check proximity to strokes/arrows and remove
        const threshold = 10;
        for (const stroke of strokes) {
          for (const [px, py] of stroke.points) {
            if (Math.abs(px - pt.x) < threshold && Math.abs(py - pt.y) < threshold) {
              removeStroke(stroke.id);
              return;
            }
          }
        }
        for (const arrow of arrows) {
          const midX = (arrow.start.x + arrow.end.x) / 2;
          const midY = (arrow.start.y + arrow.end.y) / 2;
          if (Math.abs(midX - pt.x) < threshold && Math.abs(midY - pt.y) < threshold) {
            removeArrow(arrow.id);
            return;
          }
        }
      }
    },
    [interactionMode, screenToFlow, strokes, arrows, removeStroke, removeArrow],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing.current) return;
      if (interactionMode === 'pen') {
        const pt = screenToFlow(e.clientX, e.clientY);
        currentPoints.current.push([pt.x, pt.y, e.pressure]);
      }
    },
    [interactionMode, screenToFlow],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (interactionMode === 'pen' && currentPoints.current.length > 1) {
      addStroke({
        id: `stroke-${Date.now()}`,
        points: [...currentPoints.current],
        color: 'var(--fp-annotation-pen)',
        width: 3,
      });
      currentPoints.current = [];
    } else if (interactionMode === 'arrow' && arrowStart.current) {
      // Arrow end is wherever we stopped - but we need a reference. Use last move.
      // Since we don't track move in arrow mode, we'll skip if no movement detected.
      arrowStart.current = null;
    }
  }, [interactionMode, addStroke]);

  const handlePointerUpArrow = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing.current || interactionMode !== 'arrow') {
        handlePointerUp();
        return;
      }
      isDrawing.current = false;
      if (arrowStart.current) {
        const pt = screenToFlow(e.clientX, e.clientY);
        const dx = pt.x - arrowStart.current.x;
        const dy = pt.y - arrowStart.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          addArrow({
            id: `arrow-${Date.now()}`,
            start: arrowStart.current,
            end: pt,
            color: 'var(--fp-annotation-arrow)',
          });
        }
        arrowStart.current = null;
      }
    },
    [interactionMode, screenToFlow, addArrow, handlePointerUp],
  );

  const viewport = getViewport();
  const isActive = interactionMode !== 'select';

  return (
    <svg
      id="annotation-svg"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: isActive ? 'auto' : 'none',
        zIndex: isActive ? 10 : 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={interactionMode === 'arrow' ? handlePointerUpArrow : handlePointerUp}
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="var(--fp-annotation-arrow)" />
        </marker>
      </defs>
      <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
        {strokes.map((stroke) => {
          const outline = getStroke(stroke.points, {
            size: stroke.width * 2,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
          });
          return (
            <path
              key={stroke.id}
              d={getSvgPathFromStroke(outline)}
              fill={stroke.color}
              stroke="none"
            />
          );
        })}
        {arrows.map((arrow) => (
          <line
            key={arrow.id}
            x1={arrow.start.x}
            y1={arrow.start.y}
            x2={arrow.end.x}
            y2={arrow.end.y}
            stroke={arrow.color}
            strokeWidth={2}
            markerEnd="url(#arrowhead)"
          />
        ))}
      </g>
    </svg>
  );
}
