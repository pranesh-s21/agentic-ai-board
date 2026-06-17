import mammoth from 'mammoth'
import { getNorthAuthHeaders, getNorthBaseUrl } from './northAuth.ts'

export interface NorthFilePageView {
  fileId: string
  title: string
  page: number
  totalPages: number
  paragraphs: string[]
  highlight?: string
}

interface CachedDoc {
  title: string
  pages: string[]
  loadedAt: number
}

const cache = new Map<string, CachedDoc>()
const CACHE_TTL = 5 * 60_000
const CHARS_PER_PAGE = 2400

function splitIntoPages(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return ['']

  const pages: string[] = []
  let start = 0

  while (start < normalized.length) {
    let end = Math.min(start + CHARS_PER_PAGE, normalized.length)
    if (end < normalized.length) {
      const breakAt = normalized.lastIndexOf('\n\n', end)
      if (breakAt > start + CHARS_PER_PAGE * 0.5) end = breakAt
    }
    pages.push(normalized.slice(start, end).trim())
    start = end
  }

  return pages.length ? pages : ['']
}

function pageToParagraphs(pageText: string): string[] {
  return pageText
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean)
}

async function loadFileMeta(fileId: string): Promise<{ title: string; pages: string[] }> {
  const cached = cache.get(fileId)
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL) {
    return { title: cached.title, pages: cached.pages }
  }

  const base = getNorthBaseUrl()
  if (!base) throw new Error('NORTH_BASE_URL not set')

  const headers = await getNorthAuthHeaders()
  const metaRes = await fetch(`${base}/api/v1/files/${fileId}`, {
    headers: { ...headers, Accept: 'application/json' },
  })
  if (!metaRes.ok) throw new Error(`North file not found (${metaRes.status})`)
  const meta = (await metaRes.json()) as { filename?: string }

  const contentRes = await fetch(`${base}/api/v1/files/${fileId}/content`, {
    headers: { ...headers, Accept: '*/*' },
  })
  if (!contentRes.ok) throw new Error(`Could not download file (${contentRes.status})`)

  const buffer = Buffer.from(await contentRes.arrayBuffer())
  const filename = meta.filename ?? fileId
  let rawText = ''

  if (filename.toLowerCase().endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer })
    rawText = result.value
  } else if (filename.toLowerCase().endsWith('.txt') || filename.toLowerCase().endsWith('.md')) {
    rawText = buffer.toString('utf-8')
  } else {
    throw new Error(`Preview not supported for this file type (${filename})`)
  }

  const pages = splitIntoPages(rawText)
  cache.set(fileId, { title: filename, pages, loadedAt: Date.now() })
  return { title: filename, pages }
}

export async function resolveNorthFileId(title: string, highlight?: string): Promise<string | null> {
  const base = getNorthBaseUrl()
  if (!base) return null

  const headers = await getNorthAuthHeaders()
  const res = await fetch(`${base}/api/v1/files`, {
    headers: { ...headers, Accept: 'application/json' },
  })
  if (!res.ok) return null

  const payload = (await res.json()) as { data?: Array<{ id: string; filename: string }> }
  const files = payload.data ?? []
  if (!files.length) return null

  const score = (filename: string, hint: string) => {
    const fn = filename.toLowerCase().replace(/\.[^.]+$/, '')
    const norm = hint.toLowerCase().trim()
    if (!norm) return 0
    if (fn === norm || filename.toLowerCase() === norm) return 100
    if (fn.includes(norm) || norm.includes(fn)) return 80
    const words = norm.split(/\s+/).filter((w) => w.length > 3)
    return words.filter((w) => fn.includes(w)).length * 15
  }

  const generic = new Set(['north my files', 'north document', 'north', ''])
  const titleNorm = title.toLowerCase().trim()

  if (titleNorm && !generic.has(titleNorm)) {
    const best = [...files].sort((a, b) => score(b.filename, title) - score(a.filename, title))[0]
    if (score(best.filename, title) >= 15) return best.id
  }

  if (highlight) {
    const best = [...files].sort((a, b) => score(b.filename, highlight) - score(a.filename, highlight))[0]
    if (score(best.filename, highlight) >= 15) return best.id
  }

  if (files.length === 1) return files[0].id
  return null
}

export async function getNorthFilePageView(
  fileId: string,
  page: number,
  highlight?: string
): Promise<NorthFilePageView> {
  const { title, pages } = await loadFileMeta(fileId)
  const totalPages = pages.length
  const safePage = Math.min(Math.max(1, page), totalPages)
  const pageText = pages[safePage - 1] ?? ''

  return {
    fileId,
    title,
    page: safePage,
    totalPages,
    paragraphs: pageToParagraphs(pageText),
    highlight,
  }
}

export async function downloadNorthFile(fileId: string): Promise<{ buffer: Buffer; filename: string }> {
  const base = getNorthBaseUrl()
  if (!base) throw new Error('NORTH_BASE_URL not set')

  const headers = await getNorthAuthHeaders()
  const metaRes = await fetch(`${base}/api/v1/files/${fileId}`, {
    headers: { ...headers, Accept: 'application/json' },
  })
  if (!metaRes.ok) throw new Error(`North file not found (${metaRes.status})`)
  const meta = (await metaRes.json()) as { filename?: string }

  const contentRes = await fetch(`${base}/api/v1/files/${fileId}/content`, {
    headers: { ...headers, Accept: '*/*' },
  })
  if (!contentRes.ok) throw new Error(`Could not download file (${contentRes.status})`)

  return {
    buffer: Buffer.from(await contentRes.arrayBuffer()),
    filename: meta.filename ?? `${fileId}.docx`,
  }
}
