import type { ChatHealth, ChatProvider, ResolvedChatCitation } from '@/types'

const API_BASE = '/api/chat'

export interface ChatApiResponse {
  answer: string
  citationIds: string[]
  citations?: ResolvedChatCitation[]
  confidence: string
  provider: ChatProvider
  toolPlan?: string
  priorDecisions?: string[]
  conditions?: string[]
}

export async function fetchChatHealth(): Promise<ChatHealth> {
  try {
    const res = await fetch(`${API_BASE}/health`)
    if (!res.ok) throw new Error('Health check failed')
    const data = await res.json()
    return {
      provider: data.provider ?? 'unknown',
      configured: !!data.configured,
      model: data.model,
      northAgentId: data.northAgentId,
      northFiles: data.northFiles,
    }
  } catch {
    return { provider: 'unknown', configured: false }
  }
}

export async function sendChatToAgent(params: {
  message: string
  scope: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
}): Promise<ChatApiResponse> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message =
      typeof data.error === 'string'
        ? data.error
        : typeof data.hint === 'string'
          ? `${data.error ?? 'Chat failed'}\n\n${data.hint}`
          : `Chat request failed (${res.status})`
    throw new Error(message)
  }

  return data as ChatApiResponse
}

export function providerLabel(provider: ChatProvider, northFiles?: ChatHealth['northFiles']): string {
  if (northFiles?.configured && northFiles.fileCount > 0) {
    if (provider === 'north') return `North Agent · ${northFiles.fileCount} files`
    if (provider === 'cohere') return `Cohere + North Files (${northFiles.fileCount})`
  }

  switch (provider) {
    case 'north':
      return 'Cohere North'
    case 'cohere':
      return 'Cohere Agent'
    case 'mock':
      return 'Mock (offline)'
    default:
      return 'Connecting…'
  }
}
