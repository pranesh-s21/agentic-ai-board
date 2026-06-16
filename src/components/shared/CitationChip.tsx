import { cn } from '@/lib/utils'
import { getCitationById } from '@/data/mockData'
import { Badge } from '@/components/ui/Badge'
import { FileText } from 'lucide-react'

interface CitationChipProps {
  citationId: string
  onClick?: (citationId: string) => void
  className?: string
}

export function CitationChip({ citationId, onClick, className }: CitationChipProps) {
  const citation = getCitationById(citationId)
  if (!citation) return null

  return (
    <button
      type="button"
      onClick={() => onClick?.(citationId)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border border-du-purple-200 bg-du-purple-50 px-2 py-1 text-xs font-medium text-du-purple-700 transition-colors hover:border-du-magenta-300 hover:bg-du-magenta-50',
        className
      )}
    >
      <FileText className="h-3 w-3" />
      <span>{citation.documentTitle}</span>
      <span className="text-navy-400">p.{citation.page}</span>
    </button>
  )
}

interface CitationListProps {
  citationIds: string[]
  onCitationClick?: (citationId: string) => void
  className?: string
}

export function CitationList({ citationIds, onCitationClick, className }: CitationListProps) {
  if (citationIds.length === 0) return null
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {citationIds.map((id) => (
        <CitationChip key={id} citationId={id} onClick={onCitationClick} />
      ))}
    </div>
  )
}

interface SourcePreviewProps {
  citationId: string
  onOpenPage?: () => void
}

export function SourcePreview({ citationId, onOpenPage }: SourcePreviewProps) {
  const citation = getCitationById(citationId)
  if (!citation) return <p className="text-sm text-navy-500">Citation not found.</p>

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-navy-900">{citation.documentTitle}</p>
          <p className="text-sm text-navy-500">Page {citation.page}</p>
        </div>
        <Badge variant="cited">Source-Cited</Badge>
      </div>
      <div className="rounded-md border border-navy-200 bg-navy-50 p-4">
        <p className="text-sm leading-relaxed text-navy-800 italic">"{citation.passage}"</p>
      </div>
      <div className="flex items-center justify-between">
        <Badge variant={citation.confidence === 'High' ? 'approved' : citation.confidence === 'Medium' ? 'pending' : 'warning'}>
          Confidence: {citation.confidence}
        </Badge>
        {onOpenPage && (
          <button
            type="button"
            onClick={onOpenPage}
            className="text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            View in document →
          </button>
        )}
      </div>
    </div>
  )
}
