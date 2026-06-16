import { getVersionsForDocument, getCitationById } from '@/data/mockData'
import type { Document } from '@/types'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Drawer'

interface VersionCompareModalProps {
  open: boolean
  onClose: () => void
  document: Document | undefined
  page: number
}

export function VersionCompareModal({ open, onClose, document, page }: VersionCompareModalProps) {
  const versions = document ? getVersionsForDocument(document.id) : []
  const [older, newer] = versions.length >= 2 ? [versions[0], versions[versions.length - 1]] : [null, null]

  const olderPage = older?.pages[page]
  const newerPage = newer?.pages[page]

  return (
    <Modal open={open} onClose={onClose} title={`Compare versions — ${document?.title ?? ''}`} size="xl">
      {!document || versions.length < 2 ? (
        <p className="text-sm font-medium text-navy-700">Version history is not available for this document.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-navy-700">
            Comparing <strong>{older!.version}</strong> ({formatDate(older!.publishedAt)}) with{' '}
            <strong>{newer!.version}</strong> ({formatDate(newer!.publishedAt)}) — Page {page}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <VersionPanel
              version={older!.version}
              label={older!.label}
              author={older!.author}
              date={older!.publishedAt}
              summary={older!.changeSummary}
              body={olderPage?.body ?? 'No content changes on this page in the earlier version.'}
              isNewer={false}
            />
            <VersionPanel
              version={newer!.version}
              label={newer!.label}
              author={newer!.author}
              date={newer!.publishedAt}
              summary={newer!.changeSummary}
              body={newerPage?.body ?? 'Page added in this version.'}
              isNewer
              changed={newerPage?.changed}
              citationIds={newerPage?.citationIds}
            />
          </div>
          {newerPage?.changed && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <strong>Change detected on page {page}:</strong> {newer!.changeSummary}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

function VersionPanel({
  version,
  label,
  author,
  date,
  summary,
  body,
  isNewer,
  changed,
  citationIds = [],
}: {
  version: string
  label: string
  author: string
  date: string
  summary: string
  body: string
  isNewer: boolean
  changed?: boolean
  citationIds?: string[]
}) {
  return (
    <div className={`rounded-xl border-2 p-4 ${isNewer && changed ? 'border-du-magenta-400 bg-du-magenta-50/30' : 'border-navy-200 bg-white'}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant={isNewer ? 'draft' : 'muted'}>{version}</Badge>
        {changed && <Badge variant="pending">Modified</Badge>}
        {isNewer && <Badge variant="official">Current</Badge>}
      </div>
      <p className="text-sm font-bold text-du-purple-900">{label}</p>
      <p className="mt-1 text-xs font-medium text-navy-600">{author} · {formatDate(date)}</p>
      <p className="mt-2 text-xs text-navy-600">{summary}</p>
      <div className={`mt-4 rounded-lg border p-3 text-sm leading-relaxed ${changed ? 'border-du-magenta-200 bg-white' : 'border-navy-100 bg-navy-50'}`}>
        <p className="text-navy-800">{body}</p>
        {citationIds.map((id) => {
          const c = getCitationById(id)
          if (!c) return null
          return (
            <div key={id} className="mt-3 border-l-4 border-du-magenta-500 bg-yellow-100 px-3 py-2">
              <p className="text-xs font-bold uppercase text-du-purple-900">Source-Cited</p>
              <p className="mt-1 text-sm italic text-navy-800">"{c.passage}"</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
