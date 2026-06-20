import type { GovernanceAction } from './types.ts'

function formatDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim()
}

function cell(value: string | null | undefined, fallback = '—'): string {
  return escapeCell(value?.trim() ? value : fallback)
}

function documentCell(action: GovernanceAction): string {
  return cell(action.documentReferenceTitle ?? action.documentReferenceId ?? null)
}

/** Multi-row register table for list/search responses. */
export function formatGovernanceActionsTable(actions: GovernanceAction[]): string {
  if (actions.length === 0) return ''

  const headers = ['Action', 'Owner', 'Due', 'Status', 'Priority', 'Linked decision', 'Document']
  const rows = actions.map((action) => [
    cell(action.title),
    cell(action.owner),
    cell(formatDate(action.dueDate)),
    cell(action.status),
    cell(action.priority),
    cell(action.linkedDecision),
    documentCell(action),
  ])

  const headerLine = `| ${headers.join(' | ')} |`
  const separator = `| ${headers.map(() => '---').join(' | ')} |`
  const body = rows.map((row) => `| ${row.join(' | ')} |`).join('\n')
  return [headerLine, separator, body].join('\n')
}

/** Field–value table for a single action (get/create/update). */
export function formatGovernanceActionDetailTable(action: GovernanceAction): string {
  const rows: Array<[string, string]> = [
    ['Action', action.title],
    ['Owner', action.owner],
    ['Due', formatDate(action.dueDate)],
    ['Status', action.status],
    ['Priority', action.priority],
  ]

  if (action.description?.trim()) rows.push(['Description', action.description.trim()])
  if (action.linkedDecision?.trim()) rows.push(['Linked decision', action.linkedDecision.trim()])
  const document = action.documentReferenceTitle ?? action.documentReferenceId
  if (document?.trim()) rows.push(['Document', document.trim()])
  if (action.notes?.trim()) rows.push(['Notes', action.notes.trim()])
  rows.push(['ID', action.id])

  const headerLine = '| Field | Value |'
  const separator = '| --- | --- |'
  const body = rows.map(([field, value]) => `| ${escapeCell(field)} | ${cell(value, '')} |`).join('\n')
  return [headerLine, separator, body].join('\n')
}
