import { buildBoardAgentSystemPrompt, buildCohereDocuments, mapCohereCitationsToIds } from './boardContext.ts'
import type { ChatHistoryItem, ChatServiceResponse } from './types.ts'

interface CohereContentBlock {
  type: string
  text?: string
}

interface CohereChatResponse {
  message?: {
    content?: string | CohereContentBlock[]
    citations?: Array<{ text?: string; sources?: Array<{ id?: string; document?: Record<string, string> }> }>
    tool_plan?: string
  }
  finish_reason?: string
}

function extractAssistantText(content: string | CohereContentBlock[] | undefined): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  return content
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text!)
    .join('\n')
}

export async function chatWithCohere(
  message: string,
  scope: string,
  history: ChatHistoryItem[]
): Promise<ChatServiceResponse> {
  const apiKey = process.env.COHERE_API_KEY
  if (!apiKey) {
    throw new Error('COHERE_API_KEY is not configured')
  }

  const baseUrl = (process.env.COHERE_BASE_URL ?? 'https://api.cohere.com').replace(/\/$/, '')
  const model = process.env.COHERE_MODEL ?? 'command-a-03-2025'

  const messages = [
    { role: 'system', content: buildBoardAgentSystemPrompt(scope) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ]

  const body: Record<string, unknown> = {
    model,
    messages,
    documents: await buildCohereDocuments(),
    temperature: 0.3,
  }

  // Trial models often support FAST citations only (not ACCURATE) for RAG.
  const citationMode = process.env.COHERE_CITATION_MODE ?? 'FAST'
  if (citationMode.toUpperCase() !== 'OFF') {
    body.citation_options = { mode: citationMode.toUpperCase() }
  }

  let response = await fetch(`${baseUrl}/v2/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Client-Name': 'du-board-ai-poc',
    },
    body: JSON.stringify(body),
  })

  // Retry without citation_options if the model rejects the citation mode.
  if (!response.ok) {
    const errorBody = await response.text()
    if (errorBody.includes('citation mode')) {
      delete body.citation_options
      response = await fetch(`${baseUrl}/v2/chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Client-Name': 'du-board-ai-poc',
        },
        body: JSON.stringify(body),
      })
    } else {
      throw new Error(`Cohere API error (${response.status}): ${errorBody.slice(0, 300)}`)
    }
  }

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Cohere API error (${response.status}): ${errorBody.slice(0, 300)}`)
  }

  const data = (await response.json()) as CohereChatResponse
  const answer = extractAssistantText(data.message?.content)
  const { citationIds, citations } = await mapCohereCitationsToIds(data.message?.citations ?? [])
  const northCited = citations.some((c) => c.source === 'north-file')

  return {
    answer: answer || 'No response generated.',
    citationIds,
    citations,
    confidence: citationIds.length > 0
      ? northCited
        ? `High — ${citationIds.length} source(s) · North My Files`
        : `High — ${citationIds.length} source(s) cited`
      : 'Medium — document context',
    provider: 'cohere',
    toolPlan: data.message?.tool_plan,
  }
}
