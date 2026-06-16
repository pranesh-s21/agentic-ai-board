import type { ChatHistoryItem, ChatServiceResponse } from './types.ts'
import { mapCohereCitationsToIds } from './boardContext.ts'

/**
 * Calls a Cohere North agent endpoint.
 *
 * Configure one of:
 * - NORTH_CHAT_URL — full URL (recommended), e.g. https://your-north.example.com/api/v1/agents/{id}/chat
 * - NORTH_BASE_URL + NORTH_AGENT_ID — builds {base}/api/v1/agents/{id}/chat
 */
export async function chatWithNorthAgent(
  message: string,
  scope: string,
  history: ChatHistoryItem[]
): Promise<ChatServiceResponse> {
  const apiKey = process.env.NORTH_API_KEY ?? process.env.COHERE_API_KEY
  if (!apiKey) {
    throw new Error('NORTH_API_KEY or COHERE_API_KEY is required for North')
  }

  const url = resolveNorthChatUrl()
  if (!url) {
    throw new Error('Set NORTH_CHAT_URL or NORTH_BASE_URL + NORTH_AGENT_ID')
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Client-Name': 'du-board-ai-poc',
    },
    body: JSON.stringify({
      message,
      query: message,
      scope,
      agent_id: process.env.NORTH_AGENT_ID,
      messages: [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: message },
      ],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`North agent error (${response.status}): ${errorBody.slice(0, 300)}`)
  }

  const data = (await response.json()) as Record<string, unknown>
  const answer = extractNorthAnswer(data)
  const cohereCitations = extractNorthCitations(data)
  const citationIds = mapCohereCitationsToIds(cohereCitations)

  return {
    answer,
    citationIds,
    confidence: citationIds.length > 0 ? `High — North agent · ${citationIds.length} source(s)` : 'High — Cohere North agent',
    provider: 'north',
    toolPlan: typeof data.tool_plan === 'string' ? data.tool_plan : undefined,
  }
}

function resolveNorthChatUrl(): string | null {
  if (process.env.NORTH_CHAT_URL) return process.env.NORTH_CHAT_URL

  const base = process.env.NORTH_BASE_URL?.replace(/\/$/, '')
  const agentId = process.env.NORTH_AGENT_ID
  if (base && agentId) {
    return `${base}/api/v1/agents/${agentId}/chat`
  }

  return null
}

function extractNorthAnswer(data: Record<string, unknown>): string {
  const candidates = [
    data.answer,
    data.text,
    data.response,
    (data.message as { content?: string })?.content,
    (data.message as { text?: string })?.text,
    (data.output as { text?: string })?.text,
    (data.choices as Array<{ message?: { content?: string } }>)?.[0]?.message?.content,
  ]

  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c
  }

  return 'North agent returned an empty response.'
}

function extractNorthCitations(data: Record<string, unknown>) {
  const raw =
    (data.citations as unknown[]) ??
    ((data.message as { citations?: unknown[] })?.citations) ??
    []

  return raw as Array<{ text?: string; sources?: Array<{ id?: string; document?: Record<string, string> }> }>
}

export function isNorthConfigured(): boolean {
  return !!(process.env.NORTH_CHAT_URL || (process.env.NORTH_BASE_URL && process.env.NORTH_AGENT_ID))
}
