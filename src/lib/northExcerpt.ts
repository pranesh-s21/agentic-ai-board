const PREVIEW_MAX = 700

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

const BOILERPLATE = [
  /^mock document for cohere north rag testing only/i,
  /^emirates digital network \(edn\)/i,
  /^document control$/i,
  /^field value$/i,
  /^document owner$/i,
  /^version history$/i,
]

function isBoilerplateLine(line: string): boolean {
  return BOILERPLATE.some((re) => re.test(line))
}

/** Short label rows from docx tables — not useful as excerpts. */
function isLabelLine(line: string): boolean {
  if (line.length >= 55) return false
  if (/[.!?]/.test(line) && line.length >= 30) return false
  if (line.split(/\s+/).length <= 5 && line.length < 45) return true
  return false
}

export function cleanNorthBoilerplate(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const body = lines.filter((line) => !isBoilerplateLine(line))
  return (body.length >= 1 ? body.join('\n\n') : text).slice(0, PREVIEW_MAX)
}

/** Body paragraphs only — skips headers, labels, and metadata. */
export function extractSubstantiveParagraphs(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const substantive = lines.filter((line) => !isBoilerplateLine(line) && !isLabelLine(line))
  const joined = substantive.join('\n\n')
  return joined.slice(0, PREVIEW_MAX) || text.slice(0, PREVIEW_MAX)
}

/** Excerpt anchored on a cited phrase — prefers paragraph *after* a section heading. */
export function excerptAroundPhrase(fullText: string, phrase?: string): string {
  const text = fullText.trim()
  if (!text) return 'No preview available for this source.'

  if (!phrase || phrase.length < 5) {
    return extractSubstantiveParagraphs(text)
  }

  const needle = phrase.replace(/\s*section\s*$/i, '').trim().toLowerCase()
  const lower = text.toLowerCase()
  let idx = lower.indexOf(needle)

  if (idx < 0) {
    const words = needle.split(' ').filter((w) => w.length > 4)
    for (const word of words) {
      idx = lower.indexOf(word)
      if (idx >= 0) break
    }
  }

  if (idx < 0) {
    return extractSubstantiveParagraphs(text)
  }

  // Try content on lines *after* the heading row
  const afterHeading = text.slice(idx)
  const lines = afterHeading.split('\n')
  const bodyLines: string[] = []

  for (let i = 1; i < lines.length && bodyLines.join('\n').length < PREVIEW_MAX; i++) {
    const line = lines[i].trim()
    if (!line) continue
    if (isBoilerplateLine(line)) continue
    bodyLines.push(line)
  }

  if (bodyLines.join('').length >= 60) {
    return bodyLines.join('\n\n').slice(0, PREVIEW_MAX)
  }

  // Inline anchor — window around match
  const start = Math.max(0, idx - 80)
  const end = Math.min(text.length, idx + phrase.length + 480)
  let window = text.slice(start, end).trim()
  if (start > 0) window = `…${window}`
  if (end < text.length) window = `${window}…`
  return extractSubstantiveParagraphs(window)
}

export function scoreNorthChunk(
  passage: string,
  highlight?: string,
  preferredPage?: number,
  page?: number
): number {
  let score = 0
  const p = normalize(passage)

  if (preferredPage != null && page === preferredPage) score += 60

  if (highlight) {
    const h = normalize(highlight.replace(/\s*section\s*$/i, ''))
    if (h.length >= 8 && p.includes(h)) score += 2000
    else {
      const words = h.split(' ').filter((w) => w.length > 3)
      score += words.filter((w) => p.includes(w)).length * 50
    }
  }

  if (p.includes('document control') && p.includes('field value')) score -= 400
  if (passage.length >= 120 && passage.length <= 2500) score += 40
  if (passage.length < 50) score -= 500

  const substantive = extractSubstantiveParagraphs(passage)
  score += Math.min(substantive.length, 300)

  return score
}

export function pickBestNorthPassage(
  candidates: Array<{ passage: string; highlight?: string; page?: number }>,
  anchor?: string,
  preferredPage?: number
): string {
  if (!candidates.length) return 'No preview available for this source.'

  const best = [...candidates].sort(
    (a, b) =>
      scoreNorthChunk(b.passage, anchor ?? b.highlight, preferredPage, b.page) -
      scoreNorthChunk(a.passage, anchor ?? a.highlight, preferredPage, a.page)
  )[0]

  return excerptAroundPhrase(best.passage, anchor ?? best.highlight)
}

export function buildNorthPreviewText(fullPassage: string, highlight?: string): string {
  const excerpt = excerptAroundPhrase(fullPassage, highlight)
  if (excerpt.length >= 60) return excerpt
  return extractSubstantiveParagraphs(fullPassage)
}

const WEAK_HIGHLIGHT_PATTERNS = [
  /materially affect cost/i,
  /\bscope control\b/i,
  /^out of scope$/i,
  /field value/i,
  /document control/i,
]

/** North inline cite snippets are often generic boilerplate — skip for document navigation. */
export function isWeakCitationHighlight(text: string): boolean {
  const t = text.trim()
  if (t.length < 28) return true
  if (WEAK_HIGHLIGHT_PATTERNS.some((re) => re.test(t))) return true
  return false
}

/** Pick a distinctive phrase from the RAG chunk for in-document highlight — not generic inline cites. */
export function pickDocumentHighlight(citation: {
  highlight?: string
  fullPassage?: string
  passage: string
}): string | undefined {
  const inline = citation.highlight?.replace(/\s*section\s*$/i, '').trim()
  if (inline && !isWeakCitationHighlight(inline)) return inline

  const full = (citation.fullPassage ?? citation.passage).trim()
  if (!full) return undefined

  const lines = full.split('\n').map((l) => l.trim()).filter(Boolean)
  for (const line of lines) {
    if (isBoilerplateLine(line)) continue
    if (isLabelLine(line) && line.length < 50) continue
    if (/^out of scope$/i.test(line)) continue
    if (/^scope control$/i.test(line)) continue
    if (line.length >= 18 && line.length <= 140 && !isWeakCitationHighlight(line)) {
      return line.replace(/\s*section\s*$/i, '').trim()
    }
  }

  const substantive = extractSubstantiveParagraphs(full)
  const chunk = substantive.split(/\n\n+/)[0]?.trim()
  if (chunk && chunk.length >= 18 && !isWeakCitationHighlight(chunk)) {
    return chunk.slice(0, 120)
  }

  return inline && inline.length >= 18 ? inline : undefined
}
