import { getPool } from '../db/pool.ts'
import {
  enrichActionWithDocumentTitle,
  enrichActionsWithDocumentTitles,
} from './documentReferenceResolver.ts'
import type {
  CreateGovernanceActionInput,
  GovernanceAction,
  GovernanceActionStatus,
  ListGovernanceActionsQuery,
  UpdateGovernanceActionInput,
} from './types.ts'

interface ActionRow {
  id: string
  title: string
  description: string
  document_reference_id: string | null
  owner: string
  due_date: string | Date
  notes: string
  status: GovernanceActionStatus
  priority: string
  linked_decision: string | null
  linked_meeting_id: string | null
  created_at: string | Date
  updated_at: string | Date
}

function toIsoDate(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

function toIsoDateTime(value: string | Date): string {
  if (value instanceof Date) return value.toISOString()
  return new Date(value).toISOString()
}

function mapRow(row: ActionRow): GovernanceAction {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    documentReferenceId: row.document_reference_id,
    owner: row.owner,
    dueDate: toIsoDate(row.due_date),
    notes: row.notes,
    status: row.status,
    priority: row.priority as GovernanceAction['priority'],
    linkedDecision: row.linked_decision,
    linkedMeetingId: row.linked_meeting_id,
    createdAt: toIsoDateTime(row.created_at),
    updatedAt: toIsoDateTime(row.updated_at),
  }
}

export async function listGovernanceActions(
  query: ListGovernanceActionsQuery = {}
): Promise<GovernanceAction[]> {
  const clauses: string[] = []
  const values: unknown[] = []

  if (query.status) {
    values.push(query.status)
    clauses.push(`status = $${values.length}`)
  }
  if (query.owner) {
    values.push(query.owner)
    clauses.push(`owner ILIKE $${values.length}`)
  }
  if (query.documentReferenceId) {
    values.push(query.documentReferenceId)
    clauses.push(`document_reference_id = $${values.length}`)
  }

  const limit = Math.min(Math.max(query.limit ?? 100, 1), 500)
  values.push(limit)

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const sql = `
    SELECT *
    FROM governance_actions
    ${where}
    ORDER BY due_date ASC, created_at DESC
    LIMIT $${values.length}
  `

  const res = await getPool().query<ActionRow>(sql, values)
  return res.rows.map(mapRow)
}

export async function getGovernanceAction(id: string): Promise<GovernanceAction | null> {
  const res = await getPool().query<ActionRow>(
    'SELECT * FROM governance_actions WHERE id = $1',
    [id]
  )
  return res.rows[0] ? mapRow(res.rows[0]) : null
}

export async function createGovernanceAction(
  input: CreateGovernanceActionInput
): Promise<GovernanceAction> {
  const res = await getPool().query<ActionRow>(
    `INSERT INTO governance_actions (
      title, description, document_reference_id, owner, due_date, notes,
      status, priority, linked_decision, linked_meeting_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      input.title.trim(),
      input.description?.trim() ?? '',
      input.documentReferenceId ?? null,
      input.owner.trim(),
      input.dueDate,
      input.notes?.trim() ?? '',
      input.status ?? 'Open',
      input.priority ?? 'Medium',
      input.linkedDecision ?? null,
      input.linkedMeetingId ?? null,
    ]
  )
  return mapRow(res.rows[0])
}

export async function updateGovernanceAction(
  id: string,
  input: UpdateGovernanceActionInput
): Promise<GovernanceAction | null> {
  const fields: string[] = []
  const values: unknown[] = []

  const setField = (column: string, value: unknown) => {
    values.push(value)
    fields.push(`${column} = $${values.length}`)
  }

  if (input.title !== undefined) setField('title', input.title.trim())
  if (input.description !== undefined) setField('description', input.description.trim())
  if (input.documentReferenceId !== undefined) setField('document_reference_id', input.documentReferenceId)
  if (input.owner !== undefined) setField('owner', input.owner.trim())
  if (input.dueDate !== undefined) setField('due_date', input.dueDate)
  if (input.notes !== undefined) setField('notes', input.notes.trim())
  if (input.status !== undefined) setField('status', input.status)
  if (input.priority !== undefined) setField('priority', input.priority)
  if (input.linkedDecision !== undefined) setField('linked_decision', input.linkedDecision)
  if (input.linkedMeetingId !== undefined) setField('linked_meeting_id', input.linkedMeetingId)

  if (!fields.length) return getGovernanceAction(id)

  setField('updated_at', new Date().toISOString())
  values.push(id)

  const res = await getPool().query<ActionRow>(
    `UPDATE governance_actions SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  )
  return res.rows[0] ? mapRow(res.rows[0]) : null
}

export async function deleteGovernanceAction(id: string): Promise<boolean> {
  const res = await getPool().query('DELETE FROM governance_actions WHERE id = $1', [id])
  return (res.rowCount ?? 0) > 0
}

export async function countGovernanceActions(): Promise<number> {
  const res = await getPool().query<{ count: string }>('SELECT COUNT(*)::text AS count FROM governance_actions')
  return Number(res.rows[0]?.count ?? 0)
}

/** List actions with documentReferenceTitle resolved from board pack / North My Files. */
export async function listGovernanceActionsForDisplay(
  query: ListGovernanceActionsQuery = {}
): Promise<GovernanceAction[]> {
  return enrichActionsWithDocumentTitles(await listGovernanceActions(query))
}

/** Get one action with documentReferenceTitle resolved. */
export async function getGovernanceActionForDisplay(id: string): Promise<GovernanceAction | null> {
  const action = await getGovernanceAction(id)
  if (!action) return null
  return enrichActionWithDocumentTitle(action)
}
