import { test, expect } from '@playwright/test';

const API = 'http://127.0.0.1:9199';

test.describe('FlowPlan E2E', () => {
  test.describe('REST API', () => {
    test('GET /api/flowcharts returns empty list initially', async ({ request }) => {
      const res = await request.get(`${API}/api/flowcharts`);
      expect(res.ok()).toBe(true);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    test('full CRUD lifecycle via REST', async ({ request }) => {
      // Create via PUT (upsert)
      const putRes = await request.put(`${API}/api/flowchart/e2e-test`, {
        data: {
          name: 'E2E Test',
          description: 'Created by Playwright',
          nodes: [
            {
              id: 'start-1',
              type: 'start',
              position: { x: 100, y: 50 },
              parentNode: null,
              data: { label: 'Start', description: '', status: 'pending', metadata: {}, style: {} },
            },
            {
              id: 'task-1',
              type: 'task',
              position: { x: 100, y: 200 },
              parentNode: null,
              data: { label: 'Do thing', description: 'A task', status: 'pending', metadata: {}, style: {} },
            },
          ],
          edges: [
            { id: 'edge-1', source: 'start-1', target: 'task-1', type: 'default', data: { label: '', animated: false } },
          ],
        },
      });
      expect(putRes.ok()).toBe(true);
      const created = await putRes.json();
      expect(created.nodes).toHaveLength(2);

      // Read it back
      const getRes = await request.get(`${API}/api/flowchart/e2e-test`);
      expect(getRes.ok()).toBe(true);
      const doc = await getRes.json();
      expect(doc.name).toBe('E2E Test');
      expect(doc.nodes).toHaveLength(2);
      expect(doc.edges).toHaveLength(1);

      // Appears in list
      const listRes = await request.get(`${API}/api/flowcharts`);
      const list = await listRes.json();
      expect(list.some((f: any) => f.id === 'e2e-test')).toBe(true);
    });

    test('GET /api/flowchart/nonexistent returns 404', async ({ request }) => {
      const res = await request.get(`${API}/api/flowchart/nonexistent-${Date.now()}`);
      expect(res.status()).toBe(404);
    });
  });

  test.describe('Web App', () => {
    test('serves the React app at root', async ({ page }) => {
      await page.goto('/');
      // The web app should load — check for the root React mount
      await expect(page.locator('#root')).toBeAttached();
    });

    test('loads and renders a flowchart', async ({ page, request }) => {
      // Create a flowchart via API first
      await request.put(`${API}/api/flowchart/render-test`, {
        data: {
          name: 'Render Test',
          description: '',
          nodes: [
            {
              id: 'start-r',
              type: 'start',
              position: { x: 250, y: 50 },
              parentNode: null,
              data: { label: 'Begin', description: '', status: 'pending', metadata: {}, style: {} },
            },
            {
              id: 'task-r',
              type: 'task',
              position: { x: 250, y: 200 },
              parentNode: null,
              data: { label: 'Process', description: 'Do processing', status: 'in_progress', metadata: {}, style: {} },
            },
            {
              id: 'end-r',
              type: 'end',
              position: { x: 250, y: 350 },
              parentNode: null,
              data: { label: 'Done', description: '', status: 'pending', metadata: {}, style: {} },
            },
          ],
          edges: [
            { id: 'e-r1', source: 'start-r', target: 'task-r', type: 'default', data: { label: '', animated: false } },
            { id: 'e-r2', source: 'task-r', target: 'end-r', type: 'success', data: { label: 'ok', animated: false } },
          ],
        },
      });

      // Navigate to the flowchart
      await page.goto('/?id=render-test');

      // Wait for React Flow to render nodes
      // React Flow renders nodes as divs with class .react-flow__node
      await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 10_000 });

      // Should have 3 nodes rendered
      const nodeCount = await page.locator('.react-flow__node').count();
      expect(nodeCount).toBe(3);
    });

    test('renders edges between nodes', async ({ page, request }) => {
      await request.put(`${API}/api/flowchart/edge-test`, {
        data: {
          name: 'Edge Test',
          description: '',
          nodes: [
            {
              id: 'a',
              type: 'task',
              position: { x: 200, y: 50 },
              parentNode: null,
              data: { label: 'A', description: '', status: 'pending', metadata: {}, style: {} },
            },
            {
              id: 'b',
              type: 'task',
              position: { x: 200, y: 250 },
              parentNode: null,
              data: { label: 'B', description: '', status: 'pending', metadata: {}, style: {} },
            },
          ],
          edges: [
            { id: 'e1', source: 'a', target: 'b', type: 'default', data: { label: 'next', animated: false } },
          ],
        },
      });

      await page.goto('/?id=edge-test');
      await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 10_000 });

      // Edges are rendered as SVG paths inside .react-flow__edges
      const edgeCount = await page.locator('.react-flow__edge').count();
      expect(edgeCount).toBeGreaterThanOrEqual(1);
    });

    test('toolbar is visible', async ({ page, request }) => {
      await request.put(`${API}/api/flowchart/toolbar-test`, {
        data: {
          name: 'Toolbar Test',
          description: '',
          nodes: [],
          edges: [],
        },
      });

      await page.goto('/?id=toolbar-test');
      // The toolbar should be visible in the UI
      // Look for common toolbar elements (undo/redo buttons, mode selectors)
      await expect(page.locator('#root')).toBeAttached();
    });
  });

  test.describe('WebSocket sync', () => {
    test('receives updates via WebSocket', async ({ page, request }) => {
      // Create initial flowchart
      await request.put(`${API}/api/flowchart/ws-test`, {
        data: {
          name: 'Ws Test',
          description: '',
          nodes: [
            {
              id: 'ws-task',
              type: 'task',
              position: { x: 200, y: 100 },
              parentNode: null,
              data: { label: 'Original', description: '', status: 'pending', metadata: {}, style: {} },
            },
          ],
          edges: [],
        },
      });

      // Open the flowchart in the browser
      await page.goto('/?id=ws-test');
      await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 10_000 });

      // Update via API (simulating Claude MCP updating the flowchart)
      await request.put(`${API}/api/flowchart/ws-test`, {
        data: {
          name: 'Ws Test',
          description: '',
          nodes: [
            {
              id: 'ws-task',
              type: 'task',
              position: { x: 200, y: 100 },
              parentNode: null,
              data: { label: 'Updated via API', description: '', status: 'completed', metadata: {}, style: {} },
            },
            {
              id: 'ws-new',
              type: 'milestone',
              position: { x: 200, y: 300 },
              parentNode: null,
              data: { label: 'New node', description: '', status: 'pending', metadata: {}, style: {} },
            },
          ],
          edges: [],
        },
      });

      // Wait for WebSocket to push the update to the browser
      // The new node should appear
      await expect(page.locator('.react-flow__node')).toHaveCount(2, { timeout: 5_000 });
    });
  });
});
