export type UserRole = 'board_member' | 'chair' | 'secretariat' | 'governance'

/** Prototype focuses on these two roles; others remain for compatibility. */
export const PROTOTYPE_ROLES: UserRole[] = ['board_member', 'secretariat']

export type PackStatus = 'draft' | 'published'

export type Screen =
  | 'dashboard'
  | 'meetings'
  | 'pack_preparation'
  | 'board_pack'
  | 'files'
  | 'ask_ai'
  | 'private_workspace'
  | 'decision_memory'
  | 'action_tracking'
  | 'secretariat_review'
  | 'chair_controls'
  | 'governance'

export type ConfidenceLevel = 'High' | 'Medium' | 'Low'

export type ReviewStatus = 'Pending Review' | 'Approved' | 'Rejected' | 'Published' | 'Draft'

export type ActionStatus = 'Open' | 'Overdue' | 'Completed' | 'Pending Review' | 'Escalated'

export type DecisionStatus = 'Approved' | 'Superseded' | 'Withdrawn'

export interface Citation {
  id: string
  documentId: string
  documentTitle: string
  page: number
  passage: string
  confidence: ConfidenceLevel
}

export interface SpreadsheetTable {
  headers: string[]
  rows: string[][]
}

export interface DocumentPageContent {
  heading?: string
  sheetName?: string
  paragraphs?: string[]
  table?: SpreadsheetTable
}

export interface Document {
  id: string
  title: string
  type: string
  pages: number
  agendaItemId: string
  versions?: string[]
}

export interface DocumentVersion {
  id: string
  documentId: string
  version: string
  label: string
  publishedAt: string
  author: string
  changeSummary: string
  pages: Record<number, { body: string; changed?: boolean; citationIds?: string[] }>
}

export interface AgendaItem {
  id: string
  title: string
  order: number
  status: 'Ready' | 'In Review' | 'Draft' | 'Approved'
  decisionRequired: boolean
  aiAvailable: boolean
  preparationProgress: number
  documentIds: string[]
}

export interface Meeting {
  id: string
  title: string
  date: string
  location: string
  status: 'Scheduled' | 'In Preparation' | 'Completed'
  agendaItems: AgendaItem[]
}

export interface CalendarMeeting {
  id: string
  title: string
  date: string
  time: string
  endTime?: string
  type: 'Board' | 'Committee' | 'Preparation'
  status: 'Scheduled' | 'In Preparation' | 'Completed'
  location: string
  agendaItems?: AgendaItem[]
}

export interface AIInsight {
  id: string
  type: 'summary' | 'decision' | 'risks' | 'questions' | 'inconsistencies' | 'assumptions'
  title: string
  content: string | string[]
  citationIds: string[]
}

export interface PriorDecision {
  id: string
  title: string
  date: string
  committee: string
  status: DecisionStatus
  decisionText: string
  conditions: string[]
  assumptions: string[]
  linkedActions: string[]
  sourcePapers: string[]
  approvalHistory: { date: string; approver: string; action: string }[]
  topic: string
}

export interface ActionItem {
  id: string
  title: string
  owner: string
  dueDate: string
  status: ActionStatus
  linkedDecision: string
  priority: 'High' | 'Medium' | 'Low'
  description: string
  documentReferenceId?: string | null
  documentReferenceTitle?: string | null
  notes?: string
  linkedMeetingId?: string
}

export interface Risk {
  id: string
  title: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  likelihood: 'High' | 'Medium' | 'Low'
  description: string
  mitigation: string
}

export interface AuditEvent {
  id: string
  timestamp: string
  user: string
  action: string
  object: string
  status: 'Success' | 'Pending' | 'Restricted' | 'Approved'
}

export interface AgentStatus {
  id: string
  name: string
  mode: 'Read-only' | 'Supervised' | 'Paused' | 'Active'
  lastRun: string
  lastStatus: 'Success' | 'Pending' | 'Failed'
  pendingApprovals: number
}

export interface SecretariatReviewItem {
  id: string
  title: string
  type: 'briefing' | 'decision' | 'action' | 'risk' | 'question'
  content: string
  citationIds: string[]
  status: ReviewStatus
  version: string
  versionHistory: string[]
  createdAt: string
  source?: 'director' | 'ai' | 'secretariat'
  submittedBy?: string
}

export interface BoardCommunication {
  id: string
  meetingId: string
  title: string
  summary: string
  status: 'draft' | 'published'
  publishedAt: string | null
}

export type ChatProvider = 'cohere' | 'north' | 'mock' | 'unknown'

export interface ChatHealth {
  provider: ChatProvider
  configured: boolean
  model?: string
  northAgentId?: string | null
  northFiles?: {
    configured: boolean
    fileCount: number
    chunkCount: number
    directory: string
    ragSource: string
  }
}

export interface ResolvedChatCitation {
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
  confidence: ConfidenceLevel
  source?: 'mock' | 'north-file' | 'north-agent' | 'governance-register'
  documentId?: string
}

export interface NorthDocumentView {
  fileId?: string
  title: string
  page: number
  highlight?: string
}

export interface NorthMyFile {
  id: string
  filename: string
  bytes: number
  createdAt: string
  status: string
  statusDetails: string | null
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  scope?: string
  priorDecisions?: string[]
  conditions?: string[]
  citationIds?: string[]
  citations?: ResolvedChatCitation[]
  confidence?: string
  loading?: boolean
  provider?: 'cohere' | 'north' | 'mock'
  toolPlan?: string
}

export interface PrivateNote {
  id: string
  content: string
  createdAt: string
  source?: string
}

export interface PrivateWorkspace {
  id: string
  name: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface WorkspaceFolder {
  id: string
  workspaceId: string
  name: string
  createdAt: string
}

export type WorkspaceItemType = 'note' | 'document' | 'file'

export interface WorkspaceItem {
  id: string
  workspaceId: string
  folderId: string
  type: WorkspaceItemType
  title: string
  content?: string
  documentId?: string
  fileName?: string
  fileType?: string
  fileSize?: string
  source?: string
  createdAt: string
  updatedAt: string
}

export interface SavedAIAnswer {
  id: string
  question: string
  answer: string
  savedAt: string
  citationIds: string[]
}

export interface SavedCitation {
  id: string
  citationId: string
  savedAt: string
  note?: string
}

export interface DraftQuestion {
  id: string
  question: string
  agendaItemId: string
  createdAt: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  board_member: 'Board Member',
  chair: 'Chair',
  secretariat: 'Secretariat',
  governance: 'Governance User',
}

export const SCREEN_LABELS: Record<Screen, string> = {
  dashboard: 'Dashboard',
  meetings: 'Meetings',
  pack_preparation: 'Prepare Board Pack',
  board_pack: 'Board Pack',
  files: 'Files',
  ask_ai: 'Ask Board AI',
  private_workspace: 'Private Workspace',
  decision_memory: 'Decision Memory',
  action_tracking: 'Action Tracking',
  secretariat_review: 'Review Queue',
  chair_controls: 'Chair Controls',
  governance: 'Governance',
}
