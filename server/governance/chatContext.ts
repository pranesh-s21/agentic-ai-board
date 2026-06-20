import { listGovernanceActionsForDisplay } from './actionsRepository.ts'
import {
  formatGovernanceActionsTable,
} from './actionFormatting.ts'
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

const TOPIC_STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'for',
  'to',
  'of',
  'in',
  'on',
  'at',
  'from',
  'with',
  'any',
  'are',
  'there',
  'is',
  'what',
  'which',
  'show',
  'list',
  'give',
  'me',
  'all',
  'register',
  'governance',
  'board',
  'action',
  'actions',
  'related',
  'about',
  'regarding',
  'involving',
  'linked',
])

const TOPIC_EXTRACT_PATTERNS = [
  /\b(?:any|some|which|what)\s+actions?\s+(?:related to|about|for|on|regarding|involving|linked to|associated with)\s+(?:the\s+)?(.+)/i,
  /\bactions?\s+(?:related to|about|for|on|regarding|involving|linked to|associated with|connected to)\s+(?:the\s+)?(.+)/i,
  /\bactions?\s+(?:on|in|for)\s+(?:the\s+)?(.+?\s+(?:programme|program|project|initiative|implementation|workstream))/i,
  /\bactions?\s+(?:owned by|assigned to|for)\s+(?:the\s+)?(.+)/i,
]

function cleanTopicPhrase(raw: string): string {
  return raw
    .replace(/\?+$/, '')
    .replace(/\b(?:from|in)\s+(?:the\s+)?(?:governance\s+)?(?:actions?\s+)?register\b.*$/i, '')
    .replace(/\b(?:in|on)\s+(?:the\s+)?(?:governance\s+)?register\b.*$/i, '')
    .trim()
}

/** When the user asks about a specific subject, extract it for register filtering. */
export function extractRegisterTopicFilter(message: string): string | null {
  const trimmed = message.trim()
  if (!trimmed) return null

  // Broad register listing — no topic narrowing
  if (
    /^(?:what are|list|show|give me)\s+(?:all\s+)?(?:the\s+)?(?:open\s+)?(?:governance\s+)?actions?\b/i.test(
      trimmed
    ) &&
    !/\b(?:related to|about|for|on|regarding|involving|linked to)\b/i.test(trimmed)
  ) {
    return null
  }

  for (const pattern of TOPIC_EXTRACT_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match?.[1]) {
      const topic = cleanTopicPhrase(match[1])
      if (topic.length >= 3) return topic
    }
  }

  // "Backhaul Programme" style — programme name without explicit "related to"
  const programmeMatch = trimmed.match(
    /\bactions?\b.*\b((?:[\w-]+\s+){0,4}(?:programme|program|project|initiative|implementation)(?:\s+[\w-]+){0,4})/i
  )
  if (programmeMatch?.[1] && /\b(?:related|about|any|which)\b/i.test(trimmed)) {
    const topic = cleanTopicPhrase(programmeMatch[1])
    if (topic.length >= 4) return topic
  }

  return null
}

function actionSearchText(action: GovernanceAction): string {
  return [
    action.title,
    action.description,
    action.linkedDecision,
    action.documentReferenceTitle,
    action.documentReferenceId,
    action.notes,
    action.owner,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Generic programme vocabulary — too broad to match on their own. */
const GENERIC_TOPIC_WORDS = new Set([
  'programme',
  'program',
  'investment',
  'strategic',
  'implementation',
  'initiative',
  'project',
  'network',
  'service',
  'digital',
  'customer',
  'modernisation',
  'modernization',
])

function topicWords(topic: string): string[] {
  return normalizeForMatch(topic)
    .split(' ')
    .filter((w) => w.length >= 3 && !TOPIC_STOP_WORDS.has(w))
}

function distinctiveTopicWords(topic: string): string[] {
  return topicWords(topic).filter((w) => !GENERIC_TOPIC_WORDS.has(w))
}

function topicLooksLikeProgrammeQuery(topic: string): boolean {
  return /\b(programme|program|investment|decision|initiative|project)\b/i.test(topic)
}

function allWordsPresent(haystack: string, words: string[]): boolean {
  if (!words.length) return false
  const norm = normalizeForMatch(haystack)
  return words.every((w) => norm.includes(w))
}

function linkedDecisionMatchesTopic(linkedDecision: string | null | undefined, topic: string): boolean {
  if (!linkedDecision?.trim()) return false
  const linkedNorm = normalizeForMatch(linkedDecision)
  const topicNorm = normalizeForMatch(topic)
  if (!topicNorm) return false

  if (linkedNorm.includes(topicNorm) || topicNorm.includes(linkedNorm)) return true
  return allWordsPresent(linkedDecision, topicWords(topic))
}

function scoreActionForTopic(action: GovernanceAction, topic: string): number {
  const topicNorm = normalizeForMatch(topic)
  if (!topicNorm) return 0

  const linked = action.linkedDecision?.trim() ?? ''
  const text = actionSearchText(action)

  if (linked && linkedDecisionMatchesTopic(linked, topic)) return 100

  if (text.includes(topicNorm)) return 90

  const distinctive = distinctiveTopicWords(topic)
  if (distinctive.length) {
    const hits = distinctive.filter((w) => text.includes(w)).length
    return hits === distinctive.length ? 80 + hits : 0
  }

  // Programme-style queries with only generic words — require linked decision match
  if (topicLooksLikeProgrammeQuery(topic)) {
    return 0
  }

  const words = topicWords(topic)
  if (words.length && allWordsPresent(text, words)) return 70

  return 0
}

export function filterActionsByTopic(
  actions: GovernanceAction[],
  topic: string
): GovernanceAction[] {
  return actions
    .map((action) => ({ action, score: scoreActionForTopic(action, topic) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ action }) => action)
}

function formatActionsAnswer(
  actions: GovernanceAction[],
  statusHint?: GovernanceActionStatus,
  topic?: string | null
): string {
  const filtered =
    statusHint === 'Open'
      ? actions.filter((a) => a.status === 'Open' || a.status === 'Overdue' || a.status === 'Escalated')
      : statusHint
        ? actions.filter((a) => a.status === statusHint)
        : actions

  if (filtered.length === 0) {
    if (topic) {
      return `There are no governance actions in the register related to **${topic}**.`
    }
    const scope = statusHint ? `${statusHint.toLowerCase()} ` : ''
    return `There are no ${scope}governance actions in the register at present.`
  }

  const heading = topic
    ? `There ${filtered.length === 1 ? 'is' : 'are'} ${filtered.length} governance action${filtered.length === 1 ? '' : 's'} related to **${topic}**:`
    : statusHint === 'Open'
      ? `There ${filtered.length === 1 ? 'is' : 'are'} ${filtered.length} open governance action${filtered.length === 1 ? '' : 's'}:`
      : statusHint
        ? `There ${filtered.length === 1 ? 'is' : 'are'} ${filtered.length} ${statusHint.toLowerCase()} governance action${filtered.length === 1 ? '' : 's'}:`
        : `There ${filtered.length === 1 ? 'is' : 'are'} ${filtered.length} governance action${filtered.length === 1 ? '' : 's'} in the register:`

  return [heading, '', formatGovernanceActionsTable(filtered)].join('\n')
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
    const topic = extractRegisterTopicFilter(message)
    let actions = await listGovernanceActionsForDisplay({ limit: 100 })
    const totalInRegister = actions.length

    if (topic) {
      actions = filterActionsByTopic(actions, topic)
    }

    const confidenceSuffix = topic
      ? `${actions.length} matching · ${totalInRegister} total in register`
      : `${actions.length} action(s)`

    return {
      answer: formatActionsAnswer(actions, statusHint, topic),
      citationIds: [GOVERNANCE_REGISTER_CITATION_ID],
      citations: [
        {
          id: GOVERNANCE_REGISTER_CITATION_ID,
          documentTitle: 'Actions register',
          page: 1,
          passage: topic
            ? `${actions.length} action(s) matching "${topic}" from the live board register (${totalInRegister} total).`
            : `${actions.length} governance action(s) from the live board register (PostgreSQL).`,
          confidence: 'High',
          source: 'governance-register' as const,
        },
      ],
      confidence: `High — Actions register · ${confidenceSuffix}`,
      provider,
    }
  } catch {
    return null
  }
}

export const GOVERNANCE_FORMATTING_HINT = `When listing governance register actions:
- Always use a markdown pipe table (| Action | Owner | Due | Status | Priority | Linked decision | Document |) — not numbered lists or HTML.
- For a single action detail, use a two-column Field | Value table.
- When the user asks about actions related to a specific programme, topic, or owner, list only matching register entries — not the full register.
- When answering about board governance actions, cite the Actions register — not North My Files documents.
${GOVERNANCE_ACTION_CREATE_RULES}`
