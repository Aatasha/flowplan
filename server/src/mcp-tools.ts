import { z } from 'zod';
import open from 'open';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { FlowchartStore } from './flowchart-store.js';
import { autoLayout } from './layout-engine.js';

export function registerTools(
  server: McpServer,
  store: FlowchartStore,
  getPort: () => number,
  pluginRoot: string
): void {
  // 1. create_flowchart
  server.tool(
    'create_flowchart',
    'Create a new flowchart/plan document',
    {
      name: z.string().describe('Name for the flowchart'),
      description: z.string().optional().describe('Description of the flowchart'),
    },
    async (args) => {
      try {
        const id = store.create(args.name, args.description);
        const filePath = `${store.getFlowplansDir()}/${id}.json`;
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ id, path: filePath }) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: err.message }) }],
          isError: true,
        };
      }
    }
  );

  // 2. add_node
  server.tool(
    'add_node',
    'Add a node to a flowchart',
    {
      flowchart_id: z.string().describe('ID of the flowchart'),
      type: z
        .enum([
          'task', 'decision', 'note', 'phase_group', 'start', 'end', 'milestone',
          'file_ref', 'api_endpoint', 'db_entity', 'test_checkpoint', 'mcp_tool',
          'human_action', 'parallel_fork', 'annotation_note', 'annotation_text',
        ])
        .describe('Node type'),
      label: z.string().describe('Display label for the node'),
      description: z.string().optional().describe('Node description'),
      position: z
        .object({ x: z.number(), y: z.number() })
        .optional()
        .describe('Position {x, y}'),
      parent_group: z.string().optional().describe('Parent phase_group node ID'),
      metadata: z.record(z.string(), z.any()).optional().describe('Additional metadata'),
    },
    async (args) => {
      try {
        const metadata = args.metadata || {};
        // Extract status from metadata if provided (e.g. metadata: {status: "completed"})
        const validStatuses = ['pending', 'in_progress', 'completed', 'blocked'];
        const status = validStatuses.includes(metadata.status) ? metadata.status : 'pending';
        // Remove status from metadata to avoid duplication
        const { status: _s, ...cleanMetadata } = metadata;
        const nodeId = store.addNode(args.flowchart_id, {
          type: args.type,
          position: args.position,
          parentNode: args.parent_group || null,
          data: {
            label: args.label,
            description: args.description || '',
            status,
            metadata: cleanMetadata,
            style: {},
          },
        });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ node_id: nodeId }) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: err.message }) }],
          isError: true,
        };
      }
    }
  );

  // 3. add_edge
  server.tool(
    'add_edge',
    'Add an edge (connection) between two nodes',
    {
      flowchart_id: z.string().describe('ID of the flowchart'),
      source: z.string().describe('Source node ID'),
      target: z.string().describe('Target node ID'),
      label: z.string().optional().describe('Edge label'),
      type: z
        .enum(['default', 'success', 'failure', 'conditional'])
        .optional()
        .describe('Edge type'),
      animated: z.boolean().optional().describe('Whether the edge is animated'),
    },
    async (args) => {
      try {
        const edgeId = store.addEdge(args.flowchart_id, {
          source: args.source,
          target: args.target,
          type: args.type as any,
          data: {
            label: args.label || '',
            animated: args.animated || false,
          },
        });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ edge_id: edgeId }) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: err.message }) }],
          isError: true,
        };
      }
    }
  );

  // 4. update_node
  server.tool(
    'update_node',
    'Update properties of an existing node',
    {
      flowchart_id: z.string().describe('ID of the flowchart'),
      node_id: z.string().describe('ID of the node to update'),
      label: z.string().optional().describe('New label'),
      description: z.string().optional().describe('New description'),
      status: z
        .enum(['pending', 'in_progress', 'completed', 'blocked'])
        .optional()
        .describe('New status'),
      metadata: z.record(z.string(), z.any()).optional().describe('Metadata to merge'),
    },
    async (args) => {
      try {
        const updates: any = { data: {} };
        if (args.label !== undefined) updates.data.label = args.label;
        if (args.description !== undefined) updates.data.description = args.description;
        if (args.status !== undefined) updates.data.status = args.status;
        if (args.metadata !== undefined) updates.data.metadata = args.metadata;

        store.updateNode(args.flowchart_id, args.node_id, updates);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: true }) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: err.message }) }],
          isError: true,
        };
      }
    }
  );

  // 5. remove_node
  server.tool(
    'remove_node',
    'Remove a node and all its connected edges',
    {
      flowchart_id: z.string().describe('ID of the flowchart'),
      node_id: z.string().describe('ID of the node to remove'),
    },
    async (args) => {
      try {
        store.removeNode(args.flowchart_id, args.node_id);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: true }) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: err.message }) }],
          isError: true,
        };
      }
    }
  );

  // 6. remove_edge
  server.tool(
    'remove_edge',
    'Remove an edge from the flowchart',
    {
      flowchart_id: z.string().describe('ID of the flowchart'),
      edge_id: z.string().describe('ID of the edge to remove'),
    },
    async (args) => {
      try {
        store.removeEdge(args.flowchart_id, args.edge_id);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ success: true }) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: err.message }) }],
          isError: true,
        };
      }
    }
  );

  // 7. read_flowchart
  server.tool(
    'read_flowchart',
    'Read the full flowchart document',
    {
      flowchart_id: z.string().describe('ID of the flowchart to read'),
    },
    async (args) => {
      try {
        const doc = store.read(args.flowchart_id);
        if (!doc) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({ error: `Flowchart '${args.flowchart_id}' not found` }) }],
            isError: true,
          };
        }
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(doc) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: err.message }) }],
          isError: true,
        };
      }
    }
  );

  // 8. open_flowchart
  server.tool(
    'open_flowchart',
    'Open a flowchart in the browser for visual editing',
    {
      flowchart_id: z.string().describe('ID of the flowchart to open'),
    },
    async (args) => {
      try {
        const doc = store.read(args.flowchart_id);
        if (!doc) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({ error: `Flowchart '${args.flowchart_id}' not found` }) }],
            isError: true,
          };
        }
        const port = getPort();
        const url = `http://localhost:${port}/?id=${args.flowchart_id}`;
        await open(url);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ url, opened: true }) }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: err.message }) }],
          isError: true,
        };
      }
    }
  );

  // 9. auto_layout
  server.tool(
    'auto_layout',
    'Automatically arrange nodes using ELK layout algorithm',
    {
      flowchart_id: z.string().describe('ID of the flowchart'),
      direction: z.enum(['TB', 'LR']).optional().describe('Layout direction: TB (top-bottom) or LR (left-right)'),
      algorithm: z.string().optional().describe('ELK algorithm name (default: layered)'),
    },
    async (args) => {
      try {
        const doc = store.read(args.flowchart_id);
        if (!doc) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify({ error: `Flowchart '${args.flowchart_id}' not found` }) }],
            isError: true,
          };
        }
        const laid = await autoLayout(doc, args.direction || 'TB');
        store.update(args.flowchart_id, { nodes: laid.nodes });
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                nodes_positioned: laid.nodes.length,
                direction: args.direction || 'TB',
              }),
            },
          ],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: err.message }) }],
          isError: true,
        };
      }
    }
  );
}
