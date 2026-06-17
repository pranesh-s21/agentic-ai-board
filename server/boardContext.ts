import { citations, documentPageContent, documents, getDocumentPageContent } from '../src/data/mockData.ts'
import { GOVERNANCE_FORMATTING_HINT } from './governance/chatContext.ts'
import {
  getNorthFileCitations,
  getNorthFileDocuments,
  isNorthFilesConfigured,
} from './northFilesClient.ts'
import type { ResolvedCitation } from './types.ts'

export function buildBoardAgentSystemPrompt(scope: string): string {
  const ragSource = resolveRagSource()
  const sourceHint =
    ragSource === 'north-files'
      ? 'Answer from the user\'s North My Files documents.'
      : ragSource === 'both'
        ? 'Answer from North My Files documents and the board pack.'
        : 'Answer from the provided board pack documents.'

  return `You are Board AI for du's executive board portal — a governance-focused assistant for directors reviewing strategic programmes.

Scope for this conversation: ${scope}

${sourceHint}

Rules:
- Be concise, precise, and suitable for a board director audience.
- When stating facts, ground them in the provided documents (citations are enabled).
- Highlight risks, decision points, conditions, and inconsistencies when relevant.
- Do not invent financial figures, approvals, or regulatory statuses not supported by the documents.
- If information is missing from the documents, say so clearly.
- Directors may ask about the "governance register", "action register", or "open actions" — these refer to board governance action items, not the risk register in board-pack documents.

Formatting:
${GOVERNANCE_FORMATTING_HINT}`
}

type RagSource = 'mock' | 'north-files' | 'both'

function resolveRagSource(): RagSource {
  const explicit = process.env.NORTH_RAG_SOURCE?.toLowerCase()
  if (explicit === 'mock') return 'mock'
  if (explicit === 'north-files' || explicit === 'north') return 'north-files'
  if (explicit === 'both') return 'both'
  if (isNorthFilesConfigured()) return 'both'
  return 'mock'
}

/** Flatten board pack + North My Files into Cohere RAG documents. */
export async function buildCohereDocuments() {
  const cohereDocs: Array<{ id: string; data: Record<string, string> }> = []
  const source = resolveRagSource()

  if (source === 'mock' || source === 'both') {
    cohereDocs.push(...buildMockDocuments())
  }

  if (source === 'north-files' || source === 'both') {
    const northDocs = await getNorthFileDocuments()
    cohereDocs.push(...northDocs)
  }

  return cohereDocs
}

function buildMockDocuments() {
  const cohereDocs: Array<{ id: string; data: Record<string, string> }> = []

  for (const doc of documents) {
    const pages = documentPageContent[doc.id]
    if (pages) {
      for (const [pageStr, content] of Object.entries(pages)) {
        const page = Number(pageStr)
        cohereDocs.push({
          id: `${doc.id}-p${page}`,
          data: {
            title: doc.title,
            page: String(page),
            section: content.heading ?? `Page ${page}`,
            content: content.paragraphs.join('\n\n'),
          },
        })
      }
    } else {
      for (const cite of citations.filter((c) => c.documentId === doc.id)) {
        const pageContent = getDocumentPageContent(doc.id, cite.page)
        cohereDocs.push({
          id: `${doc.id}-p${cite.page}`,
          data: {
            title: doc.title,
            page: String(cite.page),
            section: pageContent.heading ?? `Page ${cite.page}`,
            content: pageContent.paragraphs.join('\n\n'),
          },
        })
      }
    }
  }

  return cohereDocs
}

export async function mapCohereCitationsToIds(
  cohereCitations: Array<{ text?: string; sources?: Array<{ id?: string; document?: Record<string, string> }> }>
): Promise<{ citationIds: string[]; citations: ResolvedCitation[] }> {
  const ids = new Set<string>()
  const resolved: ResolvedCitation[] = []
  const northCitations = await getNorthFileCitations()

  for (const cite of cohereCitations) {
    const passage = cite.text?.trim()
    if (!passage) continue

    const sourceId = cite.sources?.[0]?.id
    if (sourceId) {
      const northMatch = northCitations.find((c) => c.id === sourceId)
      if (northMatch) {
        ids.add(northMatch.id)
        resolved.push({ ...northMatch, source: 'north-file' })
        continue
      }
    }

    const sourceTitle = cite.sources?.[0]?.document?.title
    if (sourceTitle) {
      const northByTitle = northCitations.find((c) => c.documentTitle === sourceTitle)
      if (northByTitle) {
        ids.add(northByTitle.id)
        resolved.push({ ...northByTitle, source: 'north-file' })
        continue
      }
    }

    const matched = citations.find(
      (c) =>
        passage.includes(c.passage.slice(0, 40)) ||
        c.passage.includes(passage.slice(0, 40)) ||
        (cite.sources?.some((s) => s.document?.title === c.documentTitle) ?? false)
    )
    if (matched) {
      ids.add(matched.id)
      resolved.push({ ...matched, source: 'mock' })
    } else if (sourceTitle || sourceId) {
      const dynamicId = sourceId ?? `north-dynamic-${slug(sourceTitle ?? passage.slice(0, 24))}`
      ids.add(dynamicId)
      resolved.push({
        id: dynamicId,
        documentTitle: sourceTitle ?? 'North document',
        page: Number(cite.sources?.[0]?.document?.page ?? 1),
        passage: passage.slice(0, 280),
        confidence: 'High',
        source: 'north-file',
      })
    }
  }

  return { citationIds: [...ids], citations: resolved }
}

export function mapNorthAgentCitations(
  northCitations: Array<{ text?: string; sources?: Array<{ id?: string; document?: Record<string, string> }> }>
): { citationIds: string[]; citations: ResolvedCitation[] } {
  const ids = new Set<string>()
  const resolved: ResolvedCitation[] = []

  for (const cite of northCitations) {
    const passage = cite.text?.trim() ?? ''
    const doc = cite.sources?.[0]?.document
    const title = doc?.title ?? doc?.filename ?? 'North My Files'
    const page = Number(doc?.page ?? 1)
    const id = cite.sources?.[0]?.id ?? `north-agent-${slug(title)}-${page}`

    ids.add(id)
    resolved.push({
      id,
      documentTitle: title,
      page: Number.isFinite(page) ? page : 1,
      passage: passage.slice(0, 280) || `Source: ${title}`,
      confidence: 'High',
      source: 'north-agent',
    })
  }

  return { citationIds: [...ids], citations: resolved }
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
}
