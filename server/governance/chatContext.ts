import { listGovernanceActionsForDisplay } from './actionsRepository.ts'
import type { GovernanceAction, GovernanceActionStatus } from './types.ts'
import type { ChatServiceResponse } from '../types.ts'
import {
  GOVERNANCE_REGISTER_CITATION_ID,
  applyGovernanceRegisterCitation,
  isGovernanceRegisterQuery,
  shouldUseGovernanceRegisterCitation,
} from '../../src/lib/governanceCitation.ts'
import { GOVERNANCE_ACTION_CREATE_RULES } from './governanceRules.ts'

export { GOVERNANCE_REGISTER_CITATION_ID }

function inferStatusFilter(message: string): GovernanceActionStatus | undefined {
  const lower = message.toLowerCase()
  if (/\boverdue\b/.test(lower)) return 'Overdue'
  if (/\bcompleted\b|\bclosed\b|\bdone\b/.test(lower)) return 'Completed'
  if (/\bopen\b|\boutstanding\b|\bpending\b/.test(lower)) return 'Open'
  return undefined
}

function formatDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatActionMarkdown(action: GovernanceAction, index: number): string {
  const lines = [
    `${index}. **${action.title}**`,
    `- Status: ${action.status}`,
    `- Owner: ${action.owner}`,
    `- Due: ${formatDate(action.dueDate)}`,
    `- Priority: ${action.priority}`,
  ]
  if (action.description) lines.push(`- Description: ${action.description}`)
  if (action.linkedDecision) lines.push(`- Linked decision: ${action.linkedDecision}`)
  if (action.documentReferenceTitle) {
    lines.push(`- Document: ${action.documentReferenceTitle}`)
  } else if (action.documentReferenceId) {
    lines.push(`- Document reference: ${action.documentReferenceId}`)
  }
  return lines.join('\n')
}

function formatActionsAnswer(actions: GovernanceAction[], statusHint?: GovernanceActionStatus): string {
  const filtered =
    statusHint === 'Open'
      ? actions.filter((a) => a.status === 'Open' || a.status === 'Overdue' || a.status === 'Escalated')
      : statusHint
        ? actions.filter((a) => a.status === statusHint)
        : actions

  if (filtered.length === 0) {
    const scope = statusHint ? `${statusHint.toLowerCase()} ` : ''
    return `There are no ${scope}governance actions in the register at present.`
  }

  const heading =
    statusHint === 'Open'
      ? `There ${filtered.length === 1 ? 'is' : 'are'} ${filtered.length} open governance action${filtered.length === 1 ? '' : 's'}:`
      : statusHint
        ? `There ${filtered.length === 1 ? 'is' : 'are'} ${filtered.length} ${statusHint.toLowerCase()} governance action${filtered.length === 1 ? '' : 's'}:`
        : `There ${filtered.length === 1 ? 'is' : 'are'} ${filtered.length} governance action${filtered.length === 1 ? '' : 's'} in the register:`

  return [heading, '', ...filtered.map((action, i) => formatActionMarkdown(action, i + 1))].join('\n')
}

export async function enrichChatResult(
  result: ChatServiceResponse,
  message: string,
  provider: ChatServiceResponse['provider']
): Promise<ChatServiceResponse> {
  if (!shouldUseGovernanceRegisterCitation(message, result.answer)) {
    return result
  }

  const fromDb = await tryGovernanceRegisterAnswer(message, provider)
  if (fromDb) return fromDb

  return applyGovernanceRegisterCitation(result) as ChatServiceResponse
}

export async function tryGovernanceRegisterAnswer(
  message: string,
  provider: ChatServiceResponse['provider']
): Promise<ChatServiceResponse | null> {
  if (!isGovernanceRegisterQuery(message)) return null

  try {
    const statusHint = inferStatusFilter(message)
    const actions = await listGovernanceActionsForDisplay({ limit: 100 })

    return {
      answer: formatActionsAnswer(actions, statusHint),
      citationIds: [GOVERNANCE_REGISTER_CITATION_ID],
      citations: [
        {
          id: GOVERNANCE_REGISTER_CITATION_ID,
          documentTitle: 'Actions register',
          page: 1,
          passage: `${actions.length} governance action(s) from the live board register (PostgreSQL).`,
          confidence: 'High',
          source: 'governance-register' as const,
        },
      ],
      confidence: `High — Actions register · ${actions.length} action(s)`,
      provider,
    }
  } catch {
    return null
  }
}

export const GOVERNANCE_FORMATTING_HINT = `When listing structured items (actions, risks, conditions):
- Use one numbered list; keep each item's attributes as sub-bullets under that item (Status, Owner, Due date).
- Do not restart numbering for each item.
- Use **bold** for item titles only; keep attribute labels plain.
- For tabular data, use markdown pipe tables (| Column | Column |) — not HTML.
- When answering about board governance actions, cite the Actions register — not North My Files documents.
${GOVERNANCE_ACTION_CREATE_RULES}`
