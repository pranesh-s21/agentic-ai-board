export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatServiceResponse {
  answer: string
  citationIds: string[]
  confidence: string
  provider: 'cohere' | 'north' | 'mock'
  toolPlan?: string
  priorDecisions?: string[]
  conditions?: string[]
}

export interface ChatRequestBody {
  message: string
  scope?: string
  history?: ChatHistoryItem[]
}
