import type { ChatHealth, ChatProvider } from '@/types'

const API_BASE = '/api/chat'

export interface ChatApiResponse {
  answer: string
  citationIds: string[]
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

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Chat request failed (${res.status})`)
  }

  return res.json()
}

export function providerLabel(provider: ChatProvider): string {
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
