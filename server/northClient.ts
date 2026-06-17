import { buildNorthPreviewText, pickBestNorthPassage, scoreNorthChunk } from '../src/lib/northExcerpt.ts'
import { getNorthAuthHeaders, getNorthBaseUrl } from './northAuth.ts'
import type { ChatHistoryItem, ChatServiceResponse, ResolvedCitation } from './types.ts'

let cachedAgentTools: unknown[] | null = null
let cachedFileIds: string[] | null = null

/**
 * Live North agent chat via POST /api/v1/chat — uses My Files (my_drive) tools on the agent.
 * Requires NORTH_SESSION_COOKIE from browser DevTools while logged into North chat.
 * Passes file_ids so my_drive_search can access uploaded My Files (required for non-default agents).
 */
export async function chatWithNorthAgent(
  message: string,
  scope: string,
  history: ChatHistoryItem[]
): Promise<ChatServiceResponse> {
  const base = getNorthBaseUrl()
  const agentId = process.env.NORTH_AGENT_ID?.trim()
  if (!base || !agentId) {
    throw new Error('Set NORTH_BASE_URL and NORTH_AGENT_ID')
  }

  const authHeaders = await getNorthAuthHeaders()
  const tools = await fetchAgentTools(base, authHeaders, agentId)
  const fileIds = await fetchNorthFileIds(base, authHeaders)

  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: scope ? `[Scope: ${scope}]\n\n${message}` : message },
  ]

  const response = await fetch(`${base}/api/v1/chat`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream, application/json',
      'X-Client-Name': 'du-board-ai-poc',
    },
    body: JSON.stringify({
      agent_id: agentId,
      tools,
      file_ids: fileIds,
      messages,
      stream: true,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`North chat error (${response.status}): ${errorBody.slice(0, 300)}`)
  }

  const streamBody = await response.text()
  const conversationId = extractConversationId(streamBody)
  if (!conversationId) {
    throw new Error('North chat did not return a conversation_id')
  }

  const answer = await pollForAssistantAnswer(base, authHeaders, conversationId)
  const citations = await extractCitationsFromConversation(base, authHeaders, conversationId)
  const documentCount = new Set(citations.map((c) => c.documentTitle)).size

  if (answerIncludesFileSearchFailure(answer) && citations.length === 0) {
    throw new Error(
      'North My Files search failed — no files available. Upload files in North My Files or set NORTH_FILE_IDS in .env'
    )
  }

  return {
    answer,
    citationIds: citations.map((c) => c.id),
    citations,
    confidence:
      citations.length > 0
        ? `High — North My Files · ${documentCount} document(s)`
        : 'Medium — North agent (no document citations)',
    provider: 'north',
  }
}

async function fetchNorthFileIds(
  base: string,
  authHeaders: Record<string, string | undefined>
): Promise<string[]> {
  const fromEnv = process.env.NORTH_FILE_IDS?.split(',').map((s) => s.trim()).filter(Boolean)
  if (fromEnv?.length) return fromEnv
  if (cachedFileIds?.length) return cachedFileIds

  const res = await fetch(`${base}/api/v1/files`, {
    headers: { ...authHeaders, Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Failed to list North My Files (${res.status}) — refresh NORTH_SESSION_COOKIE`)
  }

  const payload = (await res.json()) as {
    data?: Array<{ id?: string; status?: string; filename?: string }>
  }
  const ids = (payload.data ?? [])
    .filter((f) => f.id && (f.status === 'processed' || !f.status))
    .map((f) => f.id!)

  if (!ids.length) {
    throw new Error('No processed files in North My Files — upload documents in the North UI first')
  }

  cachedFileIds = ids
  return ids
}

async function fetchAgentTools(
  base: string,
  authHeaders: Record<string, string | undefined>,
  agentId: string
): Promise<unknown[]> {
  if (cachedAgentTools) return cachedAgentTools

  const res = await fetch(`${base}/api/v1/agents/${agentId}`, {
    headers: { ...authHeaders, Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Failed to load North agent (${res.status})`)
  }
  const agent = (await res.json()) as { tools?: unknown[] }
  cachedAgentTools = agent.tools ?? []
  return cachedAgentTools
}

function extractConversationId(streamBody: string): string | null {
  const match = streamBody.match(/"conversation_id"\s*:\s*"([^"]+)"/)
  return match?.[1] ?? null
}

async function pollForAssistantAnswer(
  base: string,
  authHeaders: Record<string, string | undefined>,
  conversationId: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(intervalMs)

    const res = await fetch(`${base}/api/v1/conversations/${conversationId}`, {
      headers: { ...authHeaders, Accept: 'application/json' },
    })
    if (!res.ok) continue

    const conv = (await res.json()) as { messages?: NorthMessage[]; background_chat_task?: { status?: string } }
    const taskStatus = conv.background_chat_task?.status
    const text = findLatestAssistantText(conv.messages ?? [])

    if (text.length > 0 && (!taskStatus || taskStatus === 'completed')) {
      return text
    }
  }

  throw new Error('North agent timed out waiting for a response — try again or refresh NORTH_SESSION_COOKIE')
}

interface NorthMessage {
  role: string
  content?: Array<{ type: string; text?: string; document?: { id?: string; data?: Record<string, unknown> } }>
  citations?: Array<{ text?: string; sources?: Array<{ id?: string; document?: Record<string, string> }> }>
}

function findLatestAssistantText(messages: NorthMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role !== 'assistant') continue
    const text = (msg.content ?? [])
      .filter((c) => c.type === 'text' && c.text)
      .map((c) => c.text!)
      .join('\n')
      .trim()
    if (text) return text
  }
  return ''
}

function answerIncludesFileSearchFailure(answer: string): boolean {
  const lower = answer.toLowerCase()
  return (
    lower.includes('unable to access') ||
    lower.includes('no files available') ||
    lower.includes('no files selected') ||
    lower.includes('cannot access internal')
  )
}

function findLatestAssistantMessage(messages: NorthMessage[]): NorthMessage | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role !== 'assistant') continue
    if (findLatestAssistantText([msg]).length > 0) return msg
  }
  return null
}

const CHUNK_STORE_LENGTH = 4000

function collectAllToolChunks(messages: NorthMessage[]): ResolvedCitation[] {
  const chunks: ResolvedCitation[] = []

  for (const msg of messages) {
    if (msg.role !== 'tool') continue
    for (const block of msg.content ?? []) {
      if (block.type !== 'document' || !block.document?.data) continue
      const data = block.document.data
      if (data.success === false) continue

      const passage = String(data.text ?? data.content ?? '').trim()
      if (!passage) continue

      chunks.push({
        id: String(data.chunk_id ?? block.document.id ?? `north-${data.title}`),
        documentTitle: String(data.title ?? 'North My Files'),
        page: Number(data.page_number ?? 1),
        passage: passage.slice(0, CHUNK_STORE_LENGTH),
        northFileId: data.doc_id ? String(data.doc_id) : undefined,
        confidence: 'High',
        source: 'north-agent',
      })
    }
  }

  return chunks
}

function bestChunkForCitation(
  chunks: ResolvedCitation[],
  title: string,
  highlight?: string,
  preferredPage?: number,
  sourceId?: string | null,
  toolIndex?: Map<string, ResolvedCitation>
): ResolvedCitation | undefined {
  if (sourceId && toolIndex?.has(sourceId)) {
    const hit = toolIndex.get(sourceId)!
    if (!highlight || scoreNorthChunk(hit.passage, highlight, preferredPage, hit.page) > 100) {
      return hit
    }
  }

  const norm = title.toLowerCase()
  const matching = chunks.filter((c) => c.documentTitle.toLowerCase() === norm)
  if (!matching.length) return sourceId ? toolIndex?.get(sourceId) : undefined

  return [...matching].sort(
    (a, b) =>
      scoreNorthChunk(b.passage, highlight, preferredPage, b.page) -
      scoreNorthChunk(a.passage, highlight, preferredPage, a.page)
  )[0]
}

function pickToolChunk(
  toolIndex: Map<string, ResolvedCitation>,
  allChunks: ResolvedCitation[],
  sourceId: string | null,
  title?: string,
  page?: number,
  highlight?: string
): ResolvedCitation | undefined {
  return title
    ? bestChunkForCitation(allChunks, title, highlight, page, sourceId, toolIndex)
    : sourceId
      ? toolIndex.get(sourceId)
      : undefined
}

function buildToolChunkIndex(messages: NorthMessage[]): Map<string, ResolvedCitation> {
  const index = new Map<string, ResolvedCitation>()

  for (const msg of messages) {
    if (msg.role !== 'tool') continue
    for (const block of msg.content ?? []) {
      if (block.type !== 'document' || !block.document?.data) continue
      const data = block.document.data
      if (data.success === false) continue

      const passage = String(data.text ?? data.content ?? '').trim()
      if (!passage) continue

      const citation: ResolvedCitation = {
        id: String(data.chunk_id ?? block.document.id ?? `north-${data.title}`),
        documentTitle: String(data.title ?? 'North My Files'),
        page: Number(data.page_number ?? 1),
        passage: passage.slice(0, CHUNK_STORE_LENGTH),
        northFileId: data.doc_id ? String(data.doc_id) : undefined,
        confidence: 'High',
        source: 'north-agent',
      }

      for (const key of [block.document.id, data.chunk_id, data.doc_id, citation.id].filter(Boolean)) {
        const k = String(key)
        const existing = index.get(k)
        if (!existing || citation.passage.length > existing.passage.length) {
          index.set(k, citation)
        }
      }
    }
  }

  return index
}

async function extractCitationsFromConversation(
  base: string,
  authHeaders: Record<string, string | undefined>,
  conversationId: string
): Promise<ResolvedCitation[]> {
  const res = await fetch(`${base}/api/v1/conversations/${conversationId}`, {
    headers: { ...authHeaders, Accept: 'application/json' },
  })
  if (!res.ok) return []

  const conv = (await res.json()) as { messages?: NorthMessage[] }
  const messages = conv.messages ?? []
  const allChunks = collectAllToolChunks(messages)
  const toolIndex = buildToolChunkIndex(messages)
  const assistant = findLatestAssistantMessage(messages)

  // Prefer inline citations on the final answer — not every RAG chunk the agent retrieved.
  if (assistant?.citations?.length) {
    const resolved: ResolvedCitation[] = []
    const seen = new Set<string>()

    for (const cite of assistant.citations) {
      const sourceId = cite.sources?.[0]?.id ? String(cite.sources[0].id) : null
      const highlight = cite.text?.trim() ?? ''
      const docMeta = cite.sources?.[0]?.document
      const title = docMeta?.title ?? docMeta?.filename ?? 'North My Files'
      const page = docMeta?.page ? Number(docMeta.page) : undefined
      const fromTool = pickToolChunk(toolIndex, allChunks, sourceId, title, page, highlight)
      const docChunks = allChunks
        .filter((c) => c.documentTitle.toLowerCase() === title.toLowerCase())
        .map((c) => ({ passage: c.passage, highlight, page: c.page }))

      if (!fromTool && !highlight) continue

      const rawPassage =
        fromTool?.passage ??
        pickBestNorthPassage(docChunks, highlight, page)

      const citation: ResolvedCitation = {
        id: sourceId ?? fromTool?.id ?? `north-${resolved.length}`,
        documentTitle: title,
        page: page ?? fromTool?.page ?? 1,
        northFileId: fromTool?.northFileId,
        fullPassage: rawPassage,
        passage: buildNorthPreviewText(rawPassage, highlight || undefined),
        highlight: highlight || undefined,
        confidence: 'High',
        source: 'north-agent',
      }

      const dedupeKey = `${citation.documentTitle}|${citation.page}`
      const existingIdx = resolved.findIndex((c) => `${c.documentTitle}|${c.page}` === dedupeKey)
      if (existingIdx >= 0) {
        const prev = resolved[existingIdx]
        const better =
          scoreNorthChunk(citation.passage, highlight, page, citation.page) >
          scoreNorthChunk(prev.passage, prev.highlight, page, prev.page)
        if (better) {
          resolved[existingIdx] = {
            ...prev,
            passage: citation.passage,
            highlight: citation.highlight ?? prev.highlight,
          }
        }
        continue
      }
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)
      resolved.push(citation)
    }

    return resolved
  }

  // Fallback: dedupe tool chunks from the latest turn only (cap display noise).
  const lastUserIdx = messages.findLastIndex((m) => m.role === 'user')
  const turnMessages = lastUserIdx >= 0 ? messages.slice(lastUserIdx + 1) : messages
  const resolved: ResolvedCitation[] = []
  const seen = new Set<string>()

  for (const msg of turnMessages) {
    if (msg.role !== 'tool') continue
    for (const block of msg.content ?? []) {
      if (block.type !== 'document' || !block.document?.data) continue
      const data = block.document.data
      if (data.success === false) continue

      const title = String(data.title ?? 'North My Files')
      const page = Number(data.page_number ?? 1)
      const dedupeKey = `${title}|${page}`
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)

      const raw = String(data.text ?? data.content ?? '')
      resolved.push({
        id: String(data.chunk_id ?? block.document.id ?? `north-${title}-${page}`),
        documentTitle: title,
        page,
        northFileId: data.doc_id ? String(data.doc_id) : undefined,
        fullPassage: raw,
        passage: buildNorthPreviewText(raw),
        confidence: 'High',
        source: 'north-agent',
      })
      if (resolved.length >= 6) return resolved
    }
  }

  return resolved
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function isNorthConfigured(): boolean {
  return !!(
    process.env.NORTH_BASE_URL &&
    process.env.NORTH_AGENT_ID &&
    (process.env.NORTH_SESSION_COOKIE || process.env.NORTH_CLIENT_ID || process.env.NORTH_API_KEY)
  )
}

export async function testNorthConnection(): Promise<{ ok: boolean; conversationId: string | null; message: string }> {
  const base = getNorthBaseUrl()
  const agentId = process.env.NORTH_AGENT_ID?.trim()
  if (!base || !agentId) {
    return { ok: false, conversationId: null, message: 'Set NORTH_BASE_URL and NORTH_AGENT_ID' }
  }

  try {
    const authHeaders = await getNorthAuthHeaders()
    const res = await fetch(`${base}/api/v1/agents/${agentId}`, {
      headers: { ...authHeaders, Accept: 'application/json' },
    })
    if (!res.ok) {
      return { ok: false, conversationId: null, message: `Agent lookup failed (${res.status}) — refresh NORTH_SESSION_COOKIE` }
    }
    const agent = (await res.json()) as { name?: string; tools?: unknown[] }
    const toolCount = agent.tools?.length ?? 0

    let fileCount = 0
    try {
      const fileIds = await fetchNorthFileIds(base, authHeaders)
      fileCount = fileIds.length
    } catch {
      return {
        ok: false,
        conversationId: null,
        message: `Agent "${agent.name ?? agentId}" has My Files tool but no uploaded files — add files in North My Files`,
      }
    }

    return {
      ok: true,
      conversationId: null,
      message: `Connected to North agent "${agent.name ?? agentId}" with ${toolCount} tool(s) and ${fileCount} My Files document(s)`,
    }
  } catch (error) {
    return { ok: false, conversationId: null, message: error instanceof Error ? error.message : 'Connection failed' }
  }
}

export function resetNorthConversation(): void {
  cachedAgentTools = null
  cachedFileIds = null
}
