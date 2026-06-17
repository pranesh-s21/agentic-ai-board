import type { ResolvedChatCitation } from '@/types'
import type { ChatApiResponse } from '@/lib/chatApi'

export const GOVERNANCE_REGISTER_CITATION_ID = 'cite-governance-register'

const REGISTER_CITATION: ResolvedChatCitation = {
  id: GOVERNANCE_REGISTER_CITATION_ID,
  documentTitle: 'Actions register',
  page: 1,
  passage: 'Board governance actions from the live register.',
  confidence: 'High',
  source: 'governance-register',
}

export function answerLooksLikeGovernanceActionTable(answer: string): boolean {
  if (/\baction id\b/i.test(answer)) return true
  if (/\blinked decision\b/i.test(answer) && /\bowner\b/i.test(answer)) return true
  if (answer.includes('|') && /\|\s*owner\s*\|/i.test(answer) && /\|\s*status\s*\|/i.test(answer)) {
    return true
  }
  return false
}

export function answerReferencesGovernanceRegister(answer: string): boolean {
  const lower = answer.toLowerCase()

  if (/\bgovernance register\b/.test(lower)) return true
  if (/\baction register\b/.test(lower)) return true
  if (/\bactions register\b/.test(lower)) return true
  if (/\bgovernance actions?\b/.test(lower)) return true

  if (answerLooksLikeGovernanceActionTable(answer)) return true

  if (/\bactions?\b/.test(lower) && /\bowner\b/i.test(answer)) {
    if (/\bdue date\b/i.test(answer) || /\bstatus\b/i.test(answer) || /\bpriority\b/i.test(answer)) {
      return true
    }
  }

  return false
}

export function isGovernanceRegisterQuery(message: string): boolean {
  const lower = message.toLowerCase().trim()
  if (!lower) return false

  if (/\brisk register\b/.test(lower) && !/\bgovernance register\b/.test(lower)) {
    return false
  }

  const patterns = [
    /\bgovernance register\b/,
    /\baction register\b/,
    /\bactions register\b/,
    /\bgovernance actions?\b/,
    /\bopen actions?\b/,
    /\boverdue actions?\b/,
    /\bboard actions?\b/,
    /\baction items?\b/,
    /\baction tracking\b/,
    /\b(?:actions?|register).{0,40}(?:governance|board)\b/,
    /\b(?:governance|board).{0,40}actions?\b/,
    /\bactions?.{0,24}from.{0,20}register\b/,
    /\bregister.{0,24}actions?\b/,
    /\bopen actions?\b.*\b(linked|programme|program|investment|decision|meeting)\b/,
    /\bactions?\b.*\blinked to\b/,
    /\b(?:what|list|show|give|all).{0,48}\bactions?\b/,
    /\bactions?\b.{0,32}\b(programme|program|investment|decision)\b/,
  ]

  return patterns.some((pattern) => pattern.test(lower))
}

export function applyGovernanceRegisterCitation(response: ChatApiResponse): ChatApiResponse {
  return {
    ...response,
    citationIds: [GOVERNANCE_REGISTER_CITATION_ID],
    citations: [REGISTER_CITATION],
    confidence: /actions register/i.test(response.confidence ?? '')
      ? response.confidence!
      : 'High — Actions register',
  }
}

export function shouldUseGovernanceRegisterCitation(message: string, answer: string): boolean {
  return isGovernanceRegisterQuery(message) || answerReferencesGovernanceRegister(answer)
}
