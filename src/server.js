import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { createDatabaseService } from './services/databaseService.js';
import { createOrderService } from './services/orderService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');

const TEMPLATE_URI = 'ui://widget/database-marketplace.html';
const WIDGET_ID = 'database-marketplace';
const WIDGET_TITLE = 'Database Marketplace Console';

function readWidgetHtml() {
  const assetPath = path.join(ASSETS_DIR, `${WIDGET_ID}.html`);
  if (!fs.existsSync(assetPath)) {
    throw new Error(`Widget HTML not found at ${assetPath}. Build or copy the component markup before starting the server.`);
  }
  return fs.readFileSync(assetPath, 'utf8');
}

function widgetMeta() {
  return {
    'openai/outputTemplate': TEMPLATE_URI,
    'openai/toolInvocation/invoking': 'Preparing the database marketplace…',
    'openai/toolInvocation/invoked': 'Marketplace ready.',
    'openai/widgetAccessible': true,
    'openai/resultCanProduceWidget': true,
    'openai/widgetDescription':
      'Interactive marketplace for evaluating sandbox databases, reviewing schemas, and inspecting query output.',
    'openai/widgetCSP': {
      connect_domains: [],
      resource_domains: []
    }
  } as const;
}

function serializePlan(plan, { includeContext = false } = {}) {
  if (!plan) {
    return null;
  }

  const summary = {
    id: plan.id,
    name: plan.name,
    headline: plan.headline,
    priceUsd: plan.priceUsd,
    capacity: plan.capacity,
    features: plan.features
  };

  if (includeContext) {
    return {
      ...summary,
      description: plan.description,
      pitch: plan.pitch,
      context: plan.context,
      sampleQueries: plan.sampleQueries
    };
  }

  return summary;
}

function buildCatalogPayload(databaseService) {
  const plans = databaseService.listPlans().map((plan) => serializePlan(plan, { includeContext: false }));
  return {
    view: 'catalog',
    generatedAt: new Date().toISOString(),
    plans
  };
}

function buildPlanPayload(plan) {
  return {
    view: 'plan-details',
    generatedAt: new Date().toISOString(),
    plan: serializePlan(plan, { includeContext: true })
  };
}

function buildOrderPayload(order) {
  return {
    view: 'order',
    generatedAt: new Date().toISOString(),
    order: {
      id: order.id,
      status: order.status,
      planId: order.planId,
      totalDueUsd: order.totalDueUsd,
      createdAt: order.createdAt,
      buyer: order.buyer,
      notes: order.notes
    },
    plan: order.planSnapshot
  };
}

function buildQueryPayload(planId, sql, result, { explain, error } = {}) {
  const MAX_ROWS = 50;
  const rows = result?.rows ?? [];
  const truncated = rows.length > MAX_ROWS;
  return {
    view: 'query',
    generatedAt: new Date().toISOString(),
    planId,
    sql,
    explain: Boolean(explain),
    columns: result?.columns ?? [],
    rows: truncated ? rows.slice(0, MAX_ROWS) : rows,
    rowCount: rows.length,
    truncated,
    error: error ?? null
  };
}

async function createMarketplaceServer() {
  const databaseService = await createDatabaseService();
  const orderService = createOrderService(databaseService);
  const widgetHtml = readWidgetHtml();
  const widgetMetadata = widgetMeta();

  const server = new McpServer(
    {
      name: 'database-marketplace',
      version: '0.2.0'
    },
    {
      capabilities: {
        resources: {},
        tools: {}
      }
    }
  );

  const resources = [
    {
      uri: TEMPLATE_URI,
      name: WIDGET_TITLE,
      description: 'Database marketplace component markup.',
      mimeType: 'text/html+skybridge',
      _meta: widgetMetadata
    }
  ];

  const resourceTemplates = [
    {
      uriTemplate: TEMPLATE_URI,
      name: WIDGET_TITLE,
      description: 'Database marketplace component markup.',
      mimeType: 'text/html+skybridge',
      _meta: widgetMetadata
    }
  ];

  const catalogToolInputSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {}
  } as const;

  const planDetailsParser = z.object({
    planId: z.string().min(1)
  });

  const purchaseParser = z.object({
    planId: z.string().min(1),
    buyerName: z.string().min(1),
    buyerEmail: z.string().email(),
    buyerCompany: z.string().min(1).optional(),
    notes: z.string().max(1000).optional()
  });

  const queryParser = z.object({
    planId: z.string().min(1),
    sql: z.string().min(1),
    explain: z.boolean().optional()
  });

  const tools = [
    {
      name: 'list_database_plans',
      title: 'List available database plans',
      description: 'Summarize the available sandbox database plans and pricing.',
      inputSchema: catalogToolInputSchema,
      securitySchemes: [{ type: 'noauth' }],
      annotations: {
        readOnlyHint: true
      },
      _meta: widgetMetadata
    },
    {
      name: 'describe_database_plan',
      title: 'Describe a specific database plan',
      description: 'Review schema context, sample queries, and data coverage for a selected plan.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['planId'],
        properties: {
          planId: {
            type: 'string',
            description: 'Identifier of the plan to describe.'
          }
        }
      },
      securitySchemes: [{ type: 'noauth' }],
      annotations: {
        readOnlyHint: true
      },
      _meta: widgetMetadata
    },
    {
      name: 'purchase_database_plan',
      title: 'Purchase a database plan',
      description: 'Capture buyer details and create an order for the requested plan.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['planId', 'buyerName', 'buyerEmail'],
        properties: {
          planId: {
            type: 'string',
            description: 'Identifier of the plan to purchase.'
          },
          buyerName: {
            type: 'string',
            description: 'Full name of the buyer.'
          },
          buyerEmail: {
            type: 'string',
            description: 'Contact email for provisioning updates.'
          },
          buyerCompany: {
            type: 'string',
            description: 'Optional company or team name.'
          },
          notes: {
            type: 'string',
            description: 'Optional implementation notes for the provisioning team.'
          }
        }
      },
      securitySchemes: [{ type: 'noauth' }],
      annotations: {
        destructiveHint: false,
        readOnlyHint: false
      },
      _meta: widgetMetadata
    },
    {
      name: 'run_database_query',
      title: 'Run a read-only SQL query',
      description: 'Execute a SELECT statement against the sandbox plan.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['planId', 'sql'],
        properties: {
          planId: {
            type: 'string',
            description: 'Identifier of the plan to query.'
          },
          sql: {
            type: 'string',
            description: 'Read-only SQL statement to execute (SELECT only).'
          },
          explain: {
            type: 'boolean',
            description: 'If true, return the query plan instead of results.'
          }
        }
      },
      securitySchemes: [{ type: 'noauth' }],
      annotations: {
        readOnlyHint: true
      },
      _meta: widgetMetadata
    }
  ];

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources
  }));

  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
    resourceTemplates
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    if (request.params.uri !== TEMPLATE_URI) {
      throw new Error(`Unknown resource: ${request.params.uri}`);
    }

    return {
      contents: [
        {
          uri: TEMPLATE_URI,
          mimeType: 'text/html+skybridge',
          text: widgetHtml,
          _meta: widgetMetadata
        }
      ]
    };
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;
    const args = request.params.arguments ?? {};

    switch (name) {
      case 'list_database_plans': {
        const payload = buildCatalogPayload(databaseService);
        const planNames = payload.plans.map((plan) => `${plan.name} ($${plan.priceUsd}/mo)`);
        const summaryText =
          planNames.length > 0
            ? `Available plans: ${planNames.join(', ')}.`
            : 'No database plans are currently available.';
        return {
          content: [
            {
              type: 'text',
              text: summaryText
            }
          ],
          structuredContent: payload,
          _meta: {
            ...widgetMetadata,
            catalogSize: payload.plans.length
          }
        };
      }
      case 'describe_database_plan': {
        const parsed = planDetailsParser.parse(args);
        const plan = databaseService.getPlan(parsed.planId);
        if (!plan) {
          throw new Error(`Unknown database plan: ${parsed.planId}`);
        }
        const payload = buildPlanPayload(plan);
        return {
          content: [
            {
              type: 'text',
              text: `${plan.name}: ${plan.headline}`
            }
          ],
          structuredContent: payload,
          _meta: {
            ...widgetMetadata,
            planId: plan.id
          }
        };
      }
      case 'purchase_database_plan': {
        const parsed = purchaseParser.parse(args);
        const order = orderService.createOrder({
          planId: parsed.planId,
          buyer: {
            name: parsed.buyerName,
            email: parsed.buyerEmail,
            company: parsed.buyerCompany ?? null
          },
          notes: parsed.notes ?? null
        });
        const payload = buildOrderPayload(order);
        return {
          content: [
            {
              type: 'text',
              text: `Created order ${order.id} for ${order.planSnapshot.name}.`
            }
          ],
          structuredContent: payload,
          _meta: {
            ...widgetMetadata,
            orderId: order.id
          }
        };
      }
      case 'run_database_query': {
        const parsed = queryParser.parse(args);
        const plan = databaseService.getPlan(parsed.planId);
        if (!plan) {
          throw new Error(`Unknown database plan: ${parsed.planId}`);
        }

        try {
          const result = databaseService.runReadOnlyQuery(parsed.planId, parsed.sql, {
            explain: parsed.explain ?? false
          });
          const payload = buildQueryPayload(parsed.planId, parsed.sql, result, {
            explain: parsed.explain
          });
          const explanation = parsed.explain ? 'query plan' : `${payload.rowCount} rows`;
          return {
            content: [
              {
                type: 'text',
                text: `Returned ${explanation} from ${plan.name}.`
              }
            ],
            structuredContent: payload,
            _meta: {
              ...widgetMetadata,
              planId: plan.id
            }
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to execute query.';
          const payload = buildQueryPayload(parsed.planId, parsed.sql, null, {
            explain: parsed.explain,
            error: message
          });
          return {
            content: [
              {
                type: 'text',
                text: `Query failed: ${message}`
              }
            ],
            structuredContent: payload,
            _meta: {
              ...widgetMetadata,
              planId: parsed.planId,
              error: message
            }
          };
        }
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  return server;
}

const sessions = new Map();

const SSE_PATH = '/mcp';
const POST_PATH = '/mcp/messages';

async function handleSseRequest(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const server = await createMarketplaceServer();
  const transport = new SSEServerTransport(POST_PATH, res);
  const sessionId = transport.sessionId;

  sessions.set(sessionId, { server, transport });

  transport.onclose = async () => {
    sessions.delete(sessionId);
    await server.close();
  };

  transport.onerror = (error) => {
    console.error('SSE transport error', error);
  };

  try {
    await server.connect(transport);
  } catch (error) {
    sessions.delete(sessionId);
    console.error('Failed to start SSE session', error);
    if (!res.headersSent) {
      res.writeHead(500).end('Failed to establish SSE connection');
    }
  }
}

async function handlePostMessage(req, res, url) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    res.writeHead(400).end('Missing sessionId query parameter');
    return;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    res.writeHead(404).end('Unknown session');
    return;
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch (error) {
    console.error('Failed to process message', error);
    if (!res.headersSent) {
      res.writeHead(500).end('Failed to process message');
    }
  }
}

const portEnv = Number(process.env.PORT ?? 8000);
const PORT = Number.isFinite(portEnv) ? portEnv : 8000;

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end('Missing URL');
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

  if (req.method === 'OPTIONS' && (url.pathname === SSE_PATH || url.pathname === POST_PATH)) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type'
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && url.pathname === SSE_PATH) {
    await handleSseRequest(res);
    return;
  }

  if (req.method === 'POST' && url.pathname === POST_PATH) {
    await handlePostMessage(req, res, url);
    return;
  }

  res.writeHead(404).end('Not Found');
});

httpServer.on('clientError', (err, socket) => {
  console.error('HTTP client error', err);
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

httpServer.listen(PORT, () => {
  console.log(`Database marketplace MCP server listening on http://localhost:${PORT}`);
  console.log(`  SSE stream: GET http://localhost:${PORT}${SSE_PATH}`);
  console.log(`  Message post endpoint: POST http://localhost:${PORT}${POST_PATH}?sessionId=...`);
});
