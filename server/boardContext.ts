import { citations, documentPageContent, documents, getDocumentPageContent } from '../src/data/mockData.ts'

export function buildBoardAgentSystemPrompt(scope: string): string {
  return `You are Board AI for du's executive board portal — a governance-focused assistant for directors reviewing the Strategic Network Investment Programme.

Scope for this conversation: ${scope}

Rules:
- Answer only from the provided board pack documents unless the user asks for general governance guidance.
- Be concise, precise, and suitable for a board director audience.
- When stating facts from the pack, ground them in the documents (citations are enabled).
- Highlight risks, decision points, conditions, and inconsistencies when relevant.
- Do not invent financial figures, approvals, or regulatory statuses not supported by the documents.
- If information is missing from the pack, say so clearly.`
}

/** Flatten board pack pages into Cohere RAG documents. */
export function buildCohereDocuments() {
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
      // Include citation-backed pages from version/compare data
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

export function mapCohereCitationsToIds(
  cohereCitations: Array<{ text?: string; sources?: Array<{ id?: string; document?: Record<string, string> }> }>
): string[] {
  const ids = new Set<string>()

  for (const cite of cohereCitations) {
    const passage = cite.text?.trim()
    if (!passage) continue

    const matched = citations.find(
      (c) =>
        passage.includes(c.passage.slice(0, 40)) ||
        c.passage.includes(passage.slice(0, 40)) ||
        (cite.sources?.some((s) => s.document?.title === c.documentTitle) ?? false)
    )
    if (matched) ids.add(matched.id)
  }

  return [...ids]
}
