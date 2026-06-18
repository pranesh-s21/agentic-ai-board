import type { ActionItem, ActionStatus } from '@/types'

const API_BASE = '/api/governance'

export interface GovernanceHealth {
  ok: boolean
  actionCount: number
  databaseUrl: string
  mcpPort: number
}

export interface GovernanceActionRecord {
  id: string
  title: string
  description: string
  documentReferenceId: string | null
  documentReferenceTitle?: string | null
  owner: string
  dueDate: string
  notes: string
  status: ActionStatus
  priority: 'High' | 'Medium' | 'Low'
  linkedDecision: string | null
  linkedMeetingId: string | null
  createdAt: string
  updatedAt: string
}

function toActionItem(record: GovernanceActionRecord): ActionItem {
  return {
    id: record.id,
    title: record.title,
    owner: record.owner,
    dueDate: record.dueDate,
    status: record.status,
    linkedDecision: record.linkedDecision ?? '',
    priority: record.priority,
    description: record.description,
    documentReferenceId: record.documentReferenceId,
    documentReferenceTitle: record.documentReferenceTitle ?? null,
    notes: record.notes,
    linkedMeetingId: record.linkedMeetingId ?? undefined,
  }
}

export interface CreateGovernanceActionInput {
  title: string
  description?: string
  documentReferenceId?: string | null
  owner: string
  dueDate: string
  notes?: string
  status?: ActionStatus
  priority?: 'High' | 'Medium' | 'Low'
  linkedDecision?: string
  linkedMeetingId?: string | null
}

export interface UpdateGovernanceActionInput {
  title?: string
  description?: string
  documentReferenceId?: string | null
  owner?: string
  dueDate?: string
  notes?: string
  status?: ActionStatus
  priority?: 'High' | 'Medium' | 'Low'
  linkedDecision?: string | null
  linkedMeetingId?: string | null
}

export async function fetchGovernanceHealth(): Promise<GovernanceHealth> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) return { ok: false, actionCount: 0, databaseUrl: 'unknown', mcpPort: 3002 }
  return res.json()
}

export async function fetchGovernanceActions(): Promise<ActionItem[]> {
  const res = await fetch(`${API_BASE}/actions`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Could not load actions (${res.status})`)
  }
  const actions = (data as { actions: GovernanceActionRecord[] }).actions ?? []
  return actions.map(toActionItem)
}

export async function updateGovernanceActionStatus(
  id: string,
  status: ActionStatus
): Promise<ActionItem> {
  return updateGovernanceAction(id, { status })
}

export async function updateGovernanceAction(
  id: string,
  input: UpdateGovernanceActionInput
): Promise<ActionItem> {
  const res = await fetch(`${API_BASE}/actions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Update failed (${res.status})`)
  }
  return toActionItem((data as { action: GovernanceActionRecord }).action)
}

export async function deleteGovernanceAction(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/actions/${id}`, { method: 'DELETE' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Delete failed (${res.status})`)
  }
}

export async function createGovernanceAction(input: CreateGovernanceActionInput): Promise<ActionItem> {
  const res = await fetch(`${API_BASE}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Create failed (${res.status})`)
  }
  return toActionItem((data as { action: GovernanceActionRecord }).action)
}
