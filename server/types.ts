export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

export interface ResolvedCitation {
  id: string
  documentTitle: string
  page: number
  passage: string
  /** Short phrase from the AI answer that points at this source */
  highlight?: string
  /** Full retrieved chunk — used for rich preview */
  fullPassage?: string
  /** North My Files document id (for full-document viewer) */
  northFileId?: string
  confidence: 'High' | 'Medium' | 'Low'
  source: 'mock' | 'north-file' | 'north-agent' | 'governance-register'
  documentId?: string
}

export interface ChatServiceResponse {
  answer: string
  citationIds: string[]
  citations?: ResolvedCitation[]
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

export interface NorthFilesHealth {
  configured: boolean
  directory: string
  fileCount: number
  chunkCount: number
  ragSource: string
}
