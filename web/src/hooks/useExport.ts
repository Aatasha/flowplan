import { useCallback } from 'react';
import { useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { toPng, toSvg } from 'html-to-image';
import { useFlowPlanStore } from '../store/flowplan-store';

const PADDING = 50;
const MIN_SIZE = 100;

function getFlowElement(): HTMLElement | null {
  return document.querySelector('.react-flow__viewport');
}

function download(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function useExport() {
  const { getNodes } = useReactFlow();
  const flowchartName = useFlowPlanStore((s) => s.flowchartName);

  const getExportDimensions = useCallback(() => {
    const nodes = getNodes();
    if (nodes.length === 0) return null;

    const bounds = getNodesBounds(nodes);
    const width = Math.max(bounds.width + PADDING * 2, MIN_SIZE);
    const height = Math.max(bounds.height + PADDING * 2, MIN_SIZE);
    const viewport = getViewportForBounds(bounds, width, height, 0.5, 2, PADDING);

    return { width, height, viewport };
  }, [getNodes]);

  const baseName = flowchartName?.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'flowchart';

  const exportPng = useCallback(() => {
    const el = getFlowElement();
    const dims = getExportDimensions();
    if (!el || !dims) return;

    toPng(el, {
      width: dims.width,
      height: dims.height,
      style: {
        width: `${dims.width}px`,
        height: `${dims.height}px`,
        transform: `translate(${dims.viewport.x}px, ${dims.viewport.y}px) scale(${dims.viewport.zoom})`,
      },
    }).then((dataUrl) => {
      download(dataUrl, `${baseName}.png`);
    });
  }, [getExportDimensions, baseName]);

  const exportSvg = useCallback(() => {
    const el = getFlowElement();
    const dims = getExportDimensions();
    if (!el || !dims) return;

    toSvg(el, {
      width: dims.width,
      height: dims.height,
      style: {
        width: `${dims.width}px`,
        height: `${dims.height}px`,
        transform: `translate(${dims.viewport.x}px, ${dims.viewport.y}px) scale(${dims.viewport.zoom})`,
      },
    }).then((dataUrl) => {
      download(dataUrl, `${baseName}.svg`);
    });
  }, [getExportDimensions, baseName]);

  return { exportPng, exportSvg };
}
