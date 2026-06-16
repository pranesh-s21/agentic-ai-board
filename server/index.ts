import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { chatWithCohere } from './cohereClient.ts'
import { chatWithMock } from './mockChat.ts'
import { chatWithNorthAgent, isNorthConfigured } from './northClient.ts'
import type { ChatRequestBody } from './types.ts'

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

app.use(cors())
app.use(express.json({ limit: '1mb' }))

function resolveProvider(): 'north' | 'cohere' | 'mock' {
  const explicit = process.env.CHAT_PROVIDER?.toLowerCase()
  if (explicit === 'mock') return 'mock'
  if (explicit === 'north' || (explicit !== 'cohere' && isNorthConfigured())) return 'north'
  if (process.env.COHERE_API_KEY) return 'cohere'
  return 'mock'
}

app.get('/api/chat/health', (_req, res) => {
  const provider = resolveProvider()
  res.json({
    provider,
    configured: provider !== 'mock',
    model: process.env.COHERE_MODEL ?? 'command-a-03-2025',
    northAgentId: process.env.NORTH_AGENT_ID ?? null,
    northChatUrl: process.env.NORTH_CHAT_URL ?? null,
  })
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
    let result
    if (provider === 'north') {
      result = await chatWithNorthAgent(message, scope, history)
    } else if (provider === 'cohere') {
      result = await chatWithCohere(message, scope, history)
    } else {
      result = chatWithMock(message)
    }

    res.json(result)
  } catch (error) {
    console.error('[chat]', provider, error)
    // Graceful fallback for POC demos when North/Cohere is misconfigured
    const fallback = chatWithMock(message)
    res.status(200).json({
      ...fallback,
      confidence: `Fallback — ${error instanceof Error ? error.message : 'Agent unavailable'}`,
    })
  }
})

app.listen(PORT, () => {
  const provider = resolveProvider()
  console.log(`Board AI chat server on http://localhost:${PORT} (${provider} mode)`)
})
