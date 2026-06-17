import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import multer from 'multer'
import { chatWithCohere } from './cohereClient.ts'
import { chatWithMock } from './mockChat.ts'
import { chatWithNorthAgent, isNorthConfigured, resetNorthConversation, testNorthConnection } from './northClient.ts'
import { probeNorthEndpoints, summarizeProbes } from './northDiscover.ts'
import {
  getNorthFileSummaries,
  getNorthFilesDir,
  isNorthFilesConfigured,
  loadNorthFiles,
} from './northFilesClient.ts'
import { getNorthFilePageView, resolveNorthFileId, downloadNorthFile } from './northFileViewer.ts'
import {
  deleteNorthMyFile,
  listNorthMyFiles,
  uploadNorthMyFile,
  waitForNorthFileProcessed,
} from './northMyFiles.ts'
import { initDatabase } from './db/migrate.ts'
import { countGovernanceActions } from './governance/actionsRepository.ts'
import { tryGovernanceRegisterAnswer, enrichChatResult } from './governance/chatContext.ts'
import { governanceActionsRouter } from './routes/governanceActions.ts'
import { pingDatabase } from './db/pool.ts'
import type { ChatRequestBody } from './types.ts'

const app = express()
const PORT = Number(process.env.PORT ?? 3001)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
})

app.use(cors())
app.use(express.json({ limit: '1mb' }))

function resolveProvider(): 'north' | 'cohere' | 'mock' {
  const explicit = process.env.CHAT_PROVIDER?.toLowerCase()
  if (explicit === 'mock') return 'mock'
  if (explicit === 'north' || (explicit !== 'cohere' && isNorthConfigured())) return 'north'
  if (process.env.COHERE_API_KEY) return 'cohere'
  return 'mock'
}

app.get('/api/chat/health', async (_req, res) => {
  const provider = resolveProvider()
  let northFiles = { configured: false, fileCount: 0, chunkCount: 0, directory: getNorthFilesDir(), ragSource: 'mock' }

  if (isNorthConfigured()) {
    try {
      const live = await listNorthMyFiles()
      northFiles = {
        configured: live.length > 0,
        fileCount: live.length,
        chunkCount: 0,
        directory: 'North My Files',
        ragSource: 'north-live',
      }
    } catch {
      northFiles = { configured: false, fileCount: 0, chunkCount: 0, directory: 'North My Files', ragSource: 'north-live' }
    }
  } else if (isNorthFilesConfigured()) {
    await loadNorthFiles()
    const summaries = await getNorthFileSummaries()
    northFiles = {
      configured: summaries.length > 0,
      fileCount: summaries.length,
      chunkCount: summaries.reduce((n, s) => n + s.chunks, 0),
      directory: getNorthFilesDir(),
      ragSource: process.env.NORTH_RAG_SOURCE ?? 'both',
    }
  }

  res.json({
    provider,
    configured: provider !== 'mock' || northFiles.configured,
    model: process.env.COHERE_MODEL ?? 'command-a-03-2025',
    northAgentId: process.env.NORTH_AGENT_ID ?? null,
    northChatUrl: process.env.NORTH_CHAT_URL ?? null,
    northBaseUrl: process.env.NORTH_BASE_URL ?? null,
    northFiles,
  })
})

app.get('/api/north/files', async (_req, res) => {
  try {
    if (isNorthConfigured()) {
      const files = await listNorthMyFiles()
      res.json({ source: 'north-live', files })
      return
    }

    await loadNorthFiles(true)
    const summaries = await getNorthFileSummaries()
    const files = summaries.map((s) => ({
      id: s.id,
      filename: s.title,
      bytes: s.chars,
      createdAt: new Date().toISOString(),
      status: 'processed',
      statusDetails: null,
    }))
    res.json({ source: 'local', directory: getNorthFilesDir(), files })
  } catch (error) {
    console.error('[north/files]', error)
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Could not list North files',
    })
  }
})

app.post('/api/north/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!isNorthConfigured()) {
      res.status(400).json({
        error: 'North is not configured',
        hint: 'Set NORTH_BASE_URL, NORTH_AGENT_ID, and NORTH_SESSION_COOKIE in .env',
      })
      return
    }

    const file = req.file
    if (!file) {
      res.status(400).json({ error: 'file is required' })
      return
    }

    const uploaded = await uploadNorthMyFile(file.buffer, file.originalname)
    resetNorthConversation()

    let processed = uploaded
    if (uploaded.status !== 'processed') {
      try {
        processed = await waitForNorthFileProcessed(uploaded.id, 15, 2000)
      } catch {
        // Return uploaded state — client can poll list
      }
    }

    res.json({ file: processed })
  } catch (error) {
    console.error('[north/files/upload]', error)
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Upload failed',
    })
  }
})

app.delete('/api/north/files/:fileId', async (req, res) => {
  try {
    if (!isNorthConfigured()) {
      res.status(400).json({ error: 'North is not configured' })
      return
    }

    await deleteNorthMyFile(req.params.fileId)
    resetNorthConversation()
    res.json({ deleted: true })
  } catch (error) {
    console.error('[north/files/delete]', error)
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Delete failed',
    })
  }
})

app.use('/api/governance', governanceActionsRouter)

app.get('/api/governance/health', async (_req, res) => {
  const ok = await pingDatabase()
  let actionCount = 0
  if (ok) {
    try {
      actionCount = await countGovernanceActions()
    } catch {
      // schema may not be migrated yet
    }
  }
  res.json({
    ok,
    actionCount,
    databaseUrl: process.env.DATABASE_URL ? 'configured' : 'default localhost',
    mcpPort: Number(process.env.MCP_PORT ?? 3002),
  })
})

app.get('/api/north/discover', async (_req, res) => {
  const probes = await probeNorthEndpoints()
  const connection = await testNorthConnection()
  const { healthy, summary } = summarizeProbes(probes)
  res.json({ probes, connection, healthy, summary })
})

app.get('/api/north/files/download', async (req, res) => {
  try {
    let fileId = typeof req.query.fileId === 'string' ? req.query.fileId : undefined
    const title = typeof req.query.title === 'string' ? req.query.title : undefined
    const highlight = typeof req.query.highlight === 'string' ? req.query.highlight : undefined

    if (!fileId && (title || highlight)) {
      fileId = (await resolveNorthFileId(title ?? '', highlight)) ?? undefined
    }
    if (!fileId) {
      res.status(400).json({ error: 'fileId or title is required' })
      return
    }

    const { buffer, filename } = await downloadNorthFile(fileId)
    const lower = filename.toLowerCase()
    const contentType = lower.endsWith('.docx')
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : lower.endsWith('.pdf')
        ? 'application/pdf'
        : 'application/octet-stream'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `inline; filename="${filename.replace(/"/g, '')}"`)
    res.send(buffer)
  } catch (error) {
    console.error('[north/files/download]', error)
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Could not download North document',
    })
  }
})

app.get('/api/north/files/view', async (req, res) => {
  try {
    let fileId = typeof req.query.fileId === 'string' ? req.query.fileId : undefined
    const title = typeof req.query.title === 'string' ? req.query.title : undefined
    const page = Number(req.query.page ?? 1)
    const highlight = typeof req.query.highlight === 'string' ? req.query.highlight : undefined

    if (!fileId && (title || highlight)) {
      fileId = (await resolveNorthFileId(title ?? '', highlight)) ?? undefined
    }
    if (!fileId) {
      res.status(400).json({ error: 'fileId or title is required' })
      return
    }

    const view = await getNorthFilePageView(fileId, page, highlight)
    res.json(view)
  } catch (error) {
    console.error('[north/files/view]', error)
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Could not load North document',
    })
  }
})

app.post('/api/chat', async (req, res) => {
  const body = req.body as ChatRequestBody
  const message = body.message?.trim()
  const scope = body.scope ?? 'Current agenda item'
  const history = (body.history ?? []).slice(-12)

  if (!message) {
    res.status(400).json({ error: 'message is required' })
    return
  }

  const provider = resolveProvider()

  try {
    const registerAnswer = await tryGovernanceRegisterAnswer(message, provider === 'mock' ? 'mock' : provider)
    if (registerAnswer) {
      res.json(registerAnswer)
      return
    }

    let result
    if (provider === 'north') {
      result = await chatWithNorthAgent(message, scope, history)
    } else if (provider === 'cohere') {
      result = await chatWithCohere(message, scope, history)
    } else {
      result = chatWithMock(message)
    }

    res.json(await enrichChatResult(result, message, provider === 'mock' ? 'mock' : provider))
  } catch (error) {
    console.error('[chat]', provider, error)
    // Do not silently fall back when North was explicitly requested — surface the real error.
    if (provider === 'north') {
      res.status(502).json({
        error: error instanceof Error ? error.message : 'North agent unavailable',
        provider: 'north',
        hint: 'North My Files are only accessible via your North agent — not the public Cohere API. Set NORTH_SESSION_COOKIE from browser DevTools.',
      })
      return
    }
    const fallback = chatWithMock(message)
    res.status(200).json(
      await enrichChatResult(
        {
          ...fallback,
          confidence: `Fallback — ${error instanceof Error ? error.message : 'Agent unavailable'}`,
        },
        message,
        'mock'
      )
    )
  }
})

app.listen(PORT, async () => {
  const provider = resolveProvider()
  console.log(`Board AI chat server on http://localhost:${PORT} (${provider} mode)`)

  const db = await initDatabase()
  if (db.ok) {
    console.log(`Governance DB ready (${db.seeded ? `seeded ${db.seeded} actions` : 'existing data'})`)
  } else {
    console.warn('Governance DB not reachable — actions API disabled until Postgres is up (docker compose up -d)')
  }

  if (isNorthFilesConfigured()) {
    console.log(`North files dir: ${getNorthFilesDir()}`)
  }
})
