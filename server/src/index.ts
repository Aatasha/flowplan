import { fileURLToPath } from 'node:url';
import * as path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { FlowchartStore } from './flowchart-store.js';
import { getPort } from './port-manager.js';
import { registerTools } from './mcp-tools.js';

// Derive paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Go up from server/dist/index.js to the plugin root (3 levels)
const pluginRoot = path.resolve(__dirname, '..', '..');
const projectDir = process.cwd();

// Redirect console.log to stderr so stdout stays clean for MCP protocol
const originalLog = console.log;
console.log = (...args: any[]) => {
  console.error(...args);
};

async function main() {
  console.error('[flowplan] Starting MCP server...');
  console.error(`[flowplan] Project dir: ${projectDir}`);
  console.error(`[flowplan] Plugin root: ${pluginRoot}`);

  // Initialize store
  const store = new FlowchartStore(projectDir);

  // Get a port for the HTTP/WS server
  const port = await getPort(projectDir);
  let currentPort = port;
  console.error(`[flowplan] HTTP server port: ${port}`);

  // Set up Express HTTP server
  const app = express();
  app.use(express.json());

  // REST API endpoints
  app.get('/api/flowcharts', (_req, res) => {
    try {
      const list = store.list();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/flowchart/:id', (req, res) => {
    try {
      const doc = store.read(req.params.id);
      if (!doc) {
        res.status(404).json({ error: 'Flowchart not found' });
        return;
      }
      res.json(doc);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/flowchart/:id', (req, res) => {
    try {
      const existing = store.read(req.params.id);
      if (!existing) {
        // Create using the URL param as the ID (not derived from name)
        store.create(req.body.name || req.params.id, req.body.description, undefined, req.params.id);
        const doc = store.update(req.params.id, req.body);
        res.json(doc);
      } else {
        const doc = store.update(req.params.id, req.body);
        res.json(doc);
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Serve static web app files
  const webDistPath = path.join(pluginRoot, 'web', 'dist');
  app.use(express.static(webDistPath));

  // Start HTTP server
  const httpServer = app.listen(port, '127.0.0.1', () => {
    console.error(`[flowplan] HTTP server listening on http://127.0.0.1:${port}`);
  });

  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.error('[flowplan] WebSocket client connected');
    ws.on('error', (err) => {
      console.error('[flowplan] WebSocket error:', err.message);
    });
  });

  // Broadcast flowchart changes to all WebSocket clients
  store.on('change', (id: string, doc: any) => {
    const message = JSON.stringify({ type: 'flowchart_update', id, data: doc });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Set up MCP server on stdio
  const mcpServer = new McpServer(
    {
      name: 'flowplan',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register all tools
  registerTools(mcpServer, store, () => currentPort, pluginRoot);

  // Connect MCP server to stdio transport
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error('[flowplan] MCP server connected via stdio');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.error('[flowplan] Shutting down...');
    await store.close();
    httpServer.close();
    wss.close();
    await mcpServer.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('[flowplan] Shutting down...');
    await store.close();
    httpServer.close();
    wss.close();
    await mcpServer.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[flowplan] Fatal error:', err);
  process.exit(1);
});
