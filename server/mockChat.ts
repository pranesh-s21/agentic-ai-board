import { findChatResponse } from '../src/data/mockData.ts'
import type { ChatServiceResponse } from './types.ts'

export function chatWithMock(message: string): ChatServiceResponse {
  const response = findChatResponse(message) ?? {
    answer:
      'Based on the available Board records and current Board pack materials, I can provide analysis on prior decisions, conditions, risks, and draft governance language. Try asking about the investment programme scope, prior approvals, or material risks.',
    priorDecisions: [],
    conditions: [],
    citationIds: ['cite-2'],
    confidence: 'Medium — Mock response (configure Cohere North to go live)',
  }

  return {
    answer: response.answer,
    citationIds: response.citationIds,
    citations: 'citations' in response ? response.citations : undefined,
    confidence: response.confidence,
    priorDecisions: response.priorDecisions,
    conditions: response.conditions,
    provider: 'mock',
  }
}
