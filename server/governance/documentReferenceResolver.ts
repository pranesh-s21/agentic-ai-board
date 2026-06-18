import { documents } from '../../src/data/mockData.ts'
import { getNorthFileSummaries, loadNorthFiles } from '../northFilesClient.ts'
import { getNorthBaseUrl } from '../northAuth.ts'
import { listNorthMyFiles } from '../northMyFiles.ts'
import type { GovernanceAction } from './types.ts'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const FILE_EXT_RE = /\.(pdf|docx?|xlsx?|pptx?|txt|md|csv)$/i

let catalogCache: Map<string, string> | null = null
let catalogLoadedAt = 0
const CATALOG_TTL_MS = 30_000

function looksLikeFilename(ref: string): boolean {
  return FILE_EXT_RE.test(ref) || (!UUID_RE.test(ref) && /\s/.test(ref))
}

export async function buildDocumentReferenceCatalog(): Promise<Map<string, string>> {
  if (catalogCache && Date.now() - catalogLoadedAt < CATALOG_TTL_MS) {
    return catalogCache
  }

  const catalog = new Map<string, string>()

  for (const doc of documents) {
    catalog.set(doc.id, doc.title)
  }

  try {
    await loadNorthFiles()
    for (const summary of await getNorthFileSummaries()) {
      if (summary.id && summary.title) catalog.set(summary.id, summary.title)
    }
  } catch {
    // local north-files directory is optional
  }

  if (getNorthBaseUrl()) {
    try {
      for (const file of await listNorthMyFiles()) {
        if (file.id && file.filename) catalog.set(file.id, file.filename)
      }
    } catch {
      // North API optional when cookie expired
    }
  }

  catalogCache = catalog
  catalogLoadedAt = Date.now()
  return catalog
}

export function resolveDocumentReferenceTitleSync(
  documentReferenceId: string | null | undefined,
  catalog: Map<string, string>
): string | null {
  if (!documentReferenceId?.trim()) return null
  const id = documentReferenceId.trim()
  const fromCatalog = catalog.get(id)
  if (fromCatalog) return fromCatalog
  if (looksLikeFilename(id)) return id
  return null
}

export async function enrichActionsWithDocumentTitles(
  actions: GovernanceAction[]
): Promise<GovernanceAction[]> {
  if (!actions.length) return actions

  const catalog = await buildDocumentReferenceCatalog()

  return actions.map((action) => ({
    ...action,
    documentReferenceTitle: resolveDocumentReferenceTitleSync(action.documentReferenceId, catalog),
  }))
}

export async function enrichActionWithDocumentTitle(
  action: GovernanceAction
): Promise<GovernanceAction> {
  const [enriched] = await enrichActionsWithDocumentTitles([action])
  return enriched
}
