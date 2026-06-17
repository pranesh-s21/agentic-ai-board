import { cn } from '@/lib/utils'
import { buildNorthPreviewText, scoreNorthChunk } from '@/lib/northExcerpt'
import {
  answerReferencesGovernanceRegister,
  GOVERNANCE_REGISTER_CITATION_ID,
} from '@/lib/governanceCitation'
import { useApp } from '@/context/AppContext'
import type { ResolvedChatCitation } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { FileText, ClipboardList } from 'lucide-react'

interface CitationChipProps {
  citationId: string
  citation?: ResolvedChatCitation
  onClick?: (citationId: string) => void
  className?: string
}

export function CitationChip({ citationId, citation: citationOverride, onClick, className }: CitationChipProps) {
  const { resolveCitation } = useApp()
  const citation = citationOverride ?? resolveCitation(citationId)
  if (!citation) return null

  const isNorth =
    'source' in citation &&
    (citation.source === 'north-file' || citation.source === 'north-agent')
  const isRegister =
    citationId === 'cite-governance-register' ||
    ('source' in citation && citation.source === 'governance-register')

  return (
    <button
      type="button"
      onClick={() => onClick?.(citationId)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium transition-colors',
        isRegister
          ? 'border-du-purple-200 bg-du-purple-50 text-du-purple-800 hover:border-du-purple-300 hover:bg-du-purple-100'
          : isNorth
          ? 'border-teal-200 bg-teal-50 text-teal-800 hover:border-teal-300 hover:bg-teal-100'
          : 'border-du-purple-200 bg-du-purple-50 text-du-purple-700 hover:border-du-magenta-300 hover:bg-du-magenta-50',
        className
      )}
    >
      {isRegister ? <ClipboardList className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
      <span>{citation.documentTitle}</span>
      {!isRegister && <span className="text-navy-400">p.{citation.page}</span>}
      {isNorth && <span className="text-[10px] text-teal-600">North</span>}
      {isRegister && <span className="text-[10px] text-du-purple-600">Live</span>}
    </button>
  )
}

interface CitationListProps {
  citationIds: string[]
  citations?: ResolvedChatCitation[]
  answerContent?: string
  onCitationClick?: (citationId: string) => void
  className?: string
}

export function CitationList({
  citationIds,
  citations,
  answerContent,
  onCitationClick,
  className,
}: CitationListProps) {
  if (answerContent && answerReferencesGovernanceRegister(answerContent)) {
    const registerCitation =
      citations?.find((c) => c.id === GOVERNANCE_REGISTER_CITATION_ID || c.source === 'governance-register') ?? {
        id: GOVERNANCE_REGISTER_CITATION_ID,
        documentTitle: 'Actions register',
        page: 1,
        passage: 'Board governance actions from the live register.',
        confidence: 'High' as const,
        source: 'governance-register' as const,
      }

    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        <CitationChip
          citationId={registerCitation.id}
          citation={registerCitation}
          onClick={onCitationClick}
        />
      </div>
    )
  }

  if (citationIds.length === 0) return null

  const citationById = Object.fromEntries((citations ?? []).map((c) => [c.id, c]))
  const ordered = citationIds.map((id) => citationById[id]).filter(Boolean) as ResolvedChatCitation[]

  // Group North citations by document so one chip shows all pages used in the answer.
  const northGroups = new Map<string, { title: string; pages: number[]; firstId: string }>()
  const boardPack: ResolvedChatCitation[] = []

  for (const c of ordered) {
    if (c.source === 'governance-register' || c.id === 'cite-governance-register') {
      boardPack.push(c)
      continue
    }
    const isNorth = c.source === 'north-file' || c.source === 'north-agent'
    if (!isNorth) {
      boardPack.push(c)
      continue
    }
    const existing = northGroups.get(c.documentTitle)
    if (existing) {
      if (!existing.pages.includes(c.page)) existing.pages.push(c.page)
    } else {
      northGroups.set(c.documentTitle, { title: c.documentTitle, pages: [c.page], firstId: c.id })
    }
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {[...northGroups.values()].map((group) => {
        const groupCitations = ordered.filter(
          (c) =>
            (c.source === 'north-file' || c.source === 'north-agent') &&
            c.documentTitle === group.title
        )
        const bestCitation = groupCitations.reduce((best, c) => {
          const bestScore = scoreNorthChunk(
            best.fullPassage ?? best.passage,
            best.highlight,
            undefined,
            best.page
          )
          const cScore = scoreNorthChunk(
            c.fullPassage ?? c.passage,
            c.highlight,
            undefined,
            c.page
          )
          return cScore > bestScore ? c : best
        }, groupCitations[0])

        return (
        <button
          key={group.title}
          type="button"
          onClick={() => onCitationClick?.(bestCitation?.id ?? group.firstId)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800 transition-colors hover:border-teal-300 hover:bg-teal-100"
        >
          <FileText className="h-3 w-3" />
          <span className="max-w-[200px] truncate">{group.title}</span>
          <span className="text-navy-400">
            p.{group.pages.sort((a, b) => a - b).join(', ')}
          </span>
          <span className="text-[10px] text-teal-600">North</span>
        </button>
        )
      })}
      {boardPack.map((c) => (
        <CitationChip
          key={c.id}
          citationId={c.id}
          citation={c}
          onClick={onCitationClick}
        />
      ))}
    </div>
  )
}

interface SourcePreviewProps {
  citationId: string
  onOpenPage?: () => void
}

export function SourcePreview({ citationId, onOpenPage }: SourcePreviewProps) {
  const { resolveCitation } = useApp()
  const citation = resolveCitation(citationId)
  if (!citation) return <p className="text-sm text-navy-500">Citation not found.</p>

  const isNorth =
    'source' in citation &&
    (citation.source === 'north-file' || citation.source === 'north-agent')

  const highlight = 'highlight' in citation ? citation.highlight : undefined
  const fullText =
    'fullPassage' in citation && citation.fullPassage
      ? citation.fullPassage
      : citation.passage
  const previewText = buildNorthPreviewText(fullText, highlight)

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-navy-900">{citation.documentTitle}</p>
          <p className="text-sm text-navy-500">
            {isNorth ? 'North My Files' : 'Board pack'} · Page {citation.page}
          </p>
        </div>
        <Badge variant="cited">{isNorth ? 'North Source' : 'Source-Cited'}</Badge>
      </div>
      {highlight && highlight.length >= 12 && !previewText.toLowerCase().includes(highlight.toLowerCase().slice(0, 20)) && (
        <div className="rounded-md border border-teal-100 bg-teal-50/60 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-700">Referenced in answer</p>
          <p className="mt-1 text-sm text-teal-900">"{highlight}"</p>
        </div>
      )}
      <div className="rounded-md border border-navy-200 bg-navy-50 p-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-navy-400">Document excerpt</p>
        <p className="max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-navy-800">
          {previewText}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <Badge variant={citation.confidence === 'High' ? 'approved' : citation.confidence === 'Medium' ? 'pending' : 'warning'}>
          Confidence: {citation.confidence}
        </Badge>
        {onOpenPage && !isNorth && (
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
