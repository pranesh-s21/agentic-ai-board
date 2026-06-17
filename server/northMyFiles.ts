import { getNorthAuthHeaders, getNorthBaseUrl } from './northAuth.ts'

export interface NorthMyFile {
  id: string
  filename: string
  bytes: number
  createdAt: string
  status: string
  statusDetails: string | null
}

interface NorthFileRecord {
  id?: string
  filename?: string
  bytes?: number
  created_at?: number
  status?: string
  status_details?: string | null
}

function mapFile(record: NorthFileRecord): NorthMyFile {
  const createdAt =
    typeof record.created_at === 'number'
      ? new Date(record.created_at * 1000).toISOString()
      : new Date().toISOString()

  return {
    id: String(record.id ?? ''),
    filename: String(record.filename ?? 'Untitled'),
    bytes: Number(record.bytes ?? 0),
    createdAt,
    status: String(record.status ?? 'unknown'),
    statusDetails: record.status_details ?? null,
  }
}

export async function listNorthMyFiles(): Promise<NorthMyFile[]> {
  const base = getNorthBaseUrl()
  if (!base) throw new Error('NORTH_BASE_URL not set')

  const headers = await getNorthAuthHeaders()
  const res = await fetch(`${base}/api/v1/files`, {
    headers: { ...headers, Accept: 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`Failed to list North My Files (${res.status}) — refresh NORTH_SESSION_COOKIE`)
  }

  const payload = (await res.json()) as { data?: NorthFileRecord[] }
  return (payload.data ?? [])
    .map(mapFile)
    .filter((f) => f.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getNorthMyFile(fileId: string): Promise<NorthMyFile> {
  const base = getNorthBaseUrl()
  if (!base) throw new Error('NORTH_BASE_URL not set')

  const headers = await getNorthAuthHeaders()
  const res = await fetch(`${base}/api/v1/files/${fileId}`, {
    headers: { ...headers, Accept: 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`North file not found (${res.status})`)
  }

  return mapFile((await res.json()) as NorthFileRecord)
}

export async function uploadNorthMyFile(buffer: Buffer, filename: string): Promise<NorthMyFile> {
  const base = getNorthBaseUrl()
  if (!base) throw new Error('NORTH_BASE_URL not set')

  const headers = await getNorthAuthHeaders()
  const form = new FormData()
  const blob = new Blob([buffer])
  form.append('file', blob, filename)

  const res = await fetch(`${base}/api/v1/files`, {
    method: 'POST',
    headers: { ...headers, Accept: 'application/json' },
    body: form,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Upload failed (${res.status}): ${text.slice(0, 200)}`)
  }

  return mapFile((await res.json()) as NorthFileRecord)
}

export async function waitForNorthFileProcessed(
  fileId: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<NorthMyFile> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(intervalMs)

    const file = await getNorthMyFile(fileId)
    if (file.status === 'processed') return file
    if (file.status === 'error' || file.status === 'failed') {
      throw new Error(file.statusDetails ?? `File processing failed (${file.status})`)
    }
  }

  throw new Error('File is still processing — try again in a moment')
}

export async function deleteNorthMyFile(fileId: string): Promise<void> {
  const base = getNorthBaseUrl()
  if (!base) throw new Error('NORTH_BASE_URL not set')

  const headers = await getNorthAuthHeaders()
  const res = await fetch(`${base}/api/v1/files/${fileId}`, {
    method: 'DELETE',
    headers: { ...headers, Accept: 'application/json' },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Delete failed (${res.status}): ${text.slice(0, 200)}`)
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
