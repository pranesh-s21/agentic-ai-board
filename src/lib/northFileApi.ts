import type { NorthMyFile } from '@/types'

export interface NorthFilePageView {
  fileId: string
  title: string
  page: number
  totalPages: number
  paragraphs: string[]
  highlight?: string
}

export interface NorthFilePageView {
  fileId: string
  title: string
  page: number
  totalPages: number
  paragraphs: string[]
  highlight?: string
}

const GENERIC_NORTH_TITLES = new Set(['north my files', 'north document', 'north'])

function scoreFilenameMatch(filename: string, hint: string): number {
  const fn = filename.toLowerCase().replace(/\.[^.]+$/, '')
  const norm = hint.toLowerCase().trim()
  if (!norm) return 0
  if (fn === norm) return 100
  if (filename.toLowerCase() === norm) return 95
  if (fn.includes(norm) || norm.includes(fn)) return 80

  const words = norm.split(/\s+/).filter((w) => w.length > 3)
  if (!words.length) return 0
  const hits = words.filter((w) => fn.includes(w)).length
  return hits * 15
}

/** Resolve a North file id from catalog when citations lack northFileId. */
export async function resolveNorthFileFromCatalog(params: {
  fileId?: string
  title?: string
  highlight?: string
}): Promise<{ fileId: string; filename: string } | null> {
  if (params.fileId) {
    return { fileId: params.fileId, filename: params.title ?? 'document' }
  }

  const { files } = await fetchNorthMyFiles()
  if (!files.length) return null

  const title = params.title?.trim() ?? ''
  const titleNorm = title.toLowerCase()

  if (title && !GENERIC_NORTH_TITLES.has(titleNorm)) {
    const byTitle = [...files].sort(
      (a, b) => scoreFilenameMatch(b.filename, title) - scoreFilenameMatch(a.filename, title)
    )
    if (scoreFilenameMatch(byTitle[0].filename, title) >= 15) {
      return { fileId: byTitle[0].id, filename: byTitle[0].filename }
    }
  }

  if (params.highlight) {
    const byHighlight = [...files].sort(
      (a, b) =>
        scoreFilenameMatch(b.filename, params.highlight!) - scoreFilenameMatch(a.filename, params.highlight!)
    )
    if (scoreFilenameMatch(byHighlight[0].filename, params.highlight) >= 15) {
      return { fileId: byHighlight[0].id, filename: byHighlight[0].filename }
    }
  }

  if (files.length === 1) {
    return { fileId: files[0].id, filename: files[0].filename }
  }

  return null
}

export async function fetchNorthFileBlob(params: {
  fileId?: string
  title?: string
  highlight?: string
}): Promise<{ blob: Blob; filename: string }> {
  const resolved = await resolveNorthFileFromCatalog(params)
  if (!resolved) {
    throw new Error(
      'Could not identify which North document to open. Check My Files or try asking Board AI again.'
    )
  }

  const qs = new URLSearchParams()
  qs.set('fileId', resolved.fileId)

  const res = await fetch(`/api/north/files/download?${qs}`)
  if (!res.ok) {
    const text = await res.text()
    let message = `Could not load document (${res.status})`
    try {
      const data = JSON.parse(text) as { error?: string }
      if (data.error) message = data.error
    } catch {
      if (res.status === 404) message = 'Document download API not found — restart chat server'
    }
    throw new Error(message)
  }

  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="([^"]+)"/)
  const filename = match?.[1] ?? resolved.filename
  const blob = await res.blob()
  return { blob, filename }
}

/** @deprecated text-page API — prefer fetchNorthFileBlob + docx-preview */
export async function fetchNorthFilePage(params: {
  fileId?: string
  title?: string
  page: number
  highlight?: string
}): Promise<NorthFilePageView> {
  const qs = new URLSearchParams()
  if (params.fileId) qs.set('fileId', params.fileId)
  if (params.title) qs.set('title', params.title)
  if (params.highlight) qs.set('highlight', params.highlight)
  qs.set('page', String(params.page))

  const res = await fetch(`/api/north/files/view?${qs}`)
  const text = await res.text()
  let data: { error?: string } = {}
  try {
    data = JSON.parse(text) as { error?: string }
  } catch {
    if (res.status === 404) {
      throw new Error('Document viewer API not found — restart the chat server (npm run dev:all)')
    }
  }
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Could not load document (${res.status})`)
  }
  return JSON.parse(text) as NorthFilePageView
}

export async function fetchNorthMyFiles(): Promise<{ source: string; files: NorthMyFile[] }> {
  const res = await fetch('/api/north/files')
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Could not load files (${res.status})`)
  }
  return data as { source: string; files: NorthMyFile[] }
}

export async function uploadNorthMyFile(file: File): Promise<NorthMyFile> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch('/api/north/files/upload', {
    method: 'POST',
    body: form,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Upload failed (${res.status})`)
  }

  return (data as { file: NorthMyFile }).file
}

export async function deleteNorthMyFile(fileId: string): Promise<void> {
  const res = await fetch(`/api/north/files/${fileId}`, { method: 'DELETE' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : `Delete failed (${res.status})`)
  }
}
