import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { getNorthAuthHeaders, getNorthBaseUrl } from './northAuth.ts'

export interface NorthFileCitation {
  id: string
  documentTitle: string
  page: number
  passage: string
  confidence: 'High' | 'Medium' | 'Low'
  source: 'north-file'
  documentId: string
}

export interface NorthFileSummary {
  id: string
  title: string
  chunks: number
  chars: number
  origin: 'local' | 'remote'
}

interface NorthDocumentChunk {
  id: string
  data: Record<string, string>
}

const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.markdown', '.json', '.csv'])

let cachedDocuments: NorthDocumentChunk[] | null = null
let cachedCitations: NorthFileCitation[] | null = null
let cachedSummaries: NorthFileSummary[] | null = null
let cacheLoadedAt = 0

const CACHE_TTL_MS = 30_000

function resolveFilesDir(): string {
  return path.resolve(process.cwd(), process.env.NORTH_FILES_DIR ?? 'north-files')
}

function chunkText(text: string, chunkSize = 1800, overlap = 200): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []
  if (normalized.length <= chunkSize) return [normalized]

  const chunks: string[] = []
  let start = 0
  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length)
    chunks.push(normalized.slice(start, end))
    if (end >= normalized.length) break
    start = Math.max(end - overlap, start + 1)
  }
  return chunks
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

async function loadLocalFiles(): Promise<{ docs: NorthDocumentChunk[]; citations: NorthFileCitation[]; summaries: NorthFileSummary[] }> {
  const dir = resolveFilesDir()
  const docs: NorthDocumentChunk[] = []
  const citations: NorthFileCitation[] = []
  const summaries: NorthFileSummary[] = []

  let entries: string[] = []
  try {
    entries = await readdir(dir)
  } catch {
    return { docs, citations, summaries }
  }

  for (const entry of entries) {
    if (entry.startsWith('.')) continue
    const fullPath = path.join(dir, entry)
    const info = await stat(fullPath)
    if (!info.isFile()) continue

    const ext = path.extname(entry).toLowerCase()
    if (!TEXT_EXTENSIONS.has(ext)) continue

    const raw = await readFile(fullPath, 'utf8')
    const title = entry
    const docId = `north-${slugify(path.basename(entry, ext))}`
    const chunks = chunkText(raw)

    summaries.push({
      id: docId,
      title,
      chunks: chunks.length,
      chars: raw.length,
      origin: 'local',
    })

    chunks.forEach((chunk, index) => {
      const chunkId = `${docId}-c${index + 1}`
      docs.push({
        id: chunkId,
        data: {
          title,
          page: String(index + 1),
          section: `Section ${index + 1}`,
          content: chunk,
          source: 'north-my-files',
        },
      })
      citations.push({
        id: chunkId,
        documentTitle: title,
        page: index + 1,
        passage: chunk.slice(0, 280),
        confidence: 'High',
        source: 'north-file',
        documentId: docId,
      })
    })
  }

  return { docs, citations, summaries }
}

/** Attempt to pull text files from North Libraries API (requires session cookie or OAuth). */
async function fetchRemoteLibraryFiles(): Promise<{ docs: NorthDocumentChunk[]; citations: NorthFileCitation[]; summaries: NorthFileSummary[] }> {
  const base = getNorthBaseUrl()
  if (!base || process.env.NORTH_FETCH_REMOTE_FILES !== 'true') {
    return { docs: [], citations: [], summaries: [] }
  }

  const headers = await getNorthAuthHeaders()
  const libraryId = process.env.NORTH_LIBRARY_ID?.trim()

  const listPaths = [
    libraryId ? `${base}/internal/v1/libraries/${libraryId}/files` : null,
    libraryId ? `${base}/internal/v1/admin/libraries/${libraryId}/files` : null,
    `${base}/internal/v1/user/libraries`,
    `${base}/internal/v1/libraries`,
  ].filter(Boolean) as string[]

  for (const url of listPaths) {
    try {
      const response = await fetch(url, {
        headers: { ...headers, Accept: 'application/json', 'X-Client-Name': 'du-board-ai-poc' },
      })
      if (!response.ok) continue

      const payload = (await response.json()) as unknown
      const files = extractFileList(payload)
      if (files.length === 0) continue

      const docs: NorthDocumentChunk[] = []
      const citations: NorthFileCitation[] = []
      const summaries: NorthFileSummary[] = []

      for (const file of files.slice(0, 20)) {
        const text = await fetchFileContent(base, headers, file)
        if (!text?.trim()) continue

        const title = file.name
        const docId = `north-${slugify(file.id || file.name)}`
        const chunks = chunkText(text)

        summaries.push({
          id: docId,
          title,
          chunks: chunks.length,
          chars: text.length,
          origin: 'remote',
        })

        chunks.forEach((chunk, index) => {
          const chunkId = `${docId}-c${index + 1}`
          docs.push({
            id: chunkId,
            data: {
              title,
              page: String(index + 1),
              section: `Section ${index + 1}`,
              content: chunk,
              source: 'north-my-files',
            },
          })
          citations.push({
            id: chunkId,
            documentTitle: title,
            page: index + 1,
            passage: chunk.slice(0, 280),
            confidence: 'High',
            source: 'north-file',
            documentId: docId,
          })
        })
      }

      if (docs.length > 0) return { docs, citations, summaries }
    } catch {
      // try next path
    }
  }

  return { docs: [], citations: [], summaries: [] }
}

function extractFileList(payload: unknown): Array<{ id: string; name: string; download_url?: string }> {
  const items: Array<{ id: string; name: string; download_url?: string }> = []

  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    const record = node as Record<string, unknown>
    const id = String(record.id ?? record.file_id ?? '')
    const name = String(record.name ?? record.filename ?? record.title ?? '')
    const downloadUrl = typeof record.download_url === 'string' ? record.download_url : undefined
    if (id && name && (name.includes('.') || downloadUrl)) {
      items.push({ id, name, download_url: downloadUrl })
    }
    for (const value of Object.values(record)) visit(value)
  }

  visit(payload)
  const seen = new Set<string>()
  return items.filter((f) => {
    if (seen.has(f.id)) return false
    seen.add(f.id)
    return true
  })
}

async function fetchFileContent(
  base: string,
  headers: Record<string, string | undefined>,
  file: { id: string; name: string; download_url?: string }
): Promise<string | null> {
  const urls = [
    file.download_url,
    `${base}/internal/v1/files/${file.id}/content`,
    `${base}/internal/v1/libraries/files/${file.id}/content`,
    `${base}/internal/v1/admin/files/${file.id}/content`,
  ].filter(Boolean) as string[]

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { ...headers, Accept: 'text/plain, application/json, */*' },
      })
      if (!response.ok) continue
      const contentType = response.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        const json = (await response.json()) as Record<string, unknown>
        const text = json.content ?? json.text ?? json.body
        if (typeof text === 'string') return text
      }
      return await response.text()
    } catch {
      // try next
    }
  }
  return null
}

export async function loadNorthFiles(force = false): Promise<void> {
  if (!force && cachedDocuments && Date.now() - cacheLoadedAt < CACHE_TTL_MS) return

  const local = await loadLocalFiles()
  const remote = await fetchRemoteLibraryFiles()

  cachedDocuments = [...local.docs, ...remote.docs]
  cachedCitations = [...local.citations, ...remote.citations]
  cachedSummaries = [...local.summaries, ...remote.summaries]
  cacheLoadedAt = Date.now()
}

export function isNorthFilesConfigured(): boolean {
  return !!(process.env.NORTH_FILES_DIR || process.env.NORTH_FETCH_REMOTE_FILES === 'true')
}

export async function getNorthFileDocuments(): Promise<NorthDocumentChunk[]> {
  await loadNorthFiles()
  return cachedDocuments ?? []
}

export async function getNorthFileCitations(): Promise<NorthFileCitation[]> {
  await loadNorthFiles()
  return cachedCitations ?? []
}

export async function getNorthFileSummaries(): Promise<NorthFileSummary[]> {
  await loadNorthFiles()
  return cachedSummaries ?? []
}

export function getNorthFilesDir(): string {
  return resolveFilesDir()
}
