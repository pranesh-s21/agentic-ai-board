import 'dotenv/config'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { initDatabase } from '../db/migrate.ts'
import { pingDatabase } from '../db/pool.ts'
import { registerGovernanceMcpTools } from '../governance/mcpTools.ts'

const PORT = Number(process.env.MCP_PORT ?? 3002)

function parseAllowedHosts(): string[] | undefined {
  const raw = process.env.MCP_ALLOWED_HOSTS?.trim()
  if (!raw) return undefined
  return raw.split(',').map((h) => h.trim()).filter(Boolean)
}

function createGovernanceMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'board-governance',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  )

  registerGovernanceMcpTools(server)
  return server
}

const allowedHosts = parseAllowedHosts()
const app = createMcpExpressApp({
  host: '0.0.0.0',
  allowedHosts,
})

app.get('/health', (_req, res) => {
  void pingDatabase().then((dbOk) => {
    res.json({
      ok: true,
      service: 'board-governance-mcp',
      endpoint: '/mcp',
      database: dbOk ? 'connected' : 'offline',
      allowedHosts: allowedHosts ?? 'none (bind-all warning only)',
    })
  })
})

app.post('/mcp', async (req, res) => {
  const server = createGovernanceMcpServer()
  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    })
    await server.connect(transport)
    await transport.handleRequest(req, res, req.body)
    res.on('close', () => {
      transport.close()
      server.close()
    })
  } catch (error) {
    console.error('[mcp]', error)
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      })
    }
  }
})

app.get('/mcp', (_req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Use POST /mcp for Streamable HTTP MCP requests.' },
    id: null,
  })
})

async function main() {
  const db = await initDatabase()
  if (db.ok) {
    console.log(`Governance MCP: database ready${db.seeded ? ` (seeded ${db.seeded} actions)` : ''}`)
  } else {
    console.warn('Governance MCP: database not reachable — governance tools disabled until Postgres is up.')
    console.warn('Start Postgres: npm run db:up')
    console.warn('Then run: npm run db:migrate')
  }

  app.listen(PORT, () => {
    console.log(`Board governance MCP on http://0.0.0.0:${PORT}/mcp`)
    if (allowedHosts?.length) {
      console.log(`Allowed hosts: ${allowedHosts.join(', ')}`)
    } else {
      console.warn('MCP_ALLOWED_HOSTS not set — set to your ngrok hostname for North.')
    }
    console.log('Expose with: ngrok http 3002')
    console.log('North MCP URL: https://<your-ngrok-host>/mcp')
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
