import { getCitationById, getDocumentPageContent, getCitationsForDocument, getSpreadsheetTabs } from '@/data/mockData'
import type { Document } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SpreadsheetViewer } from '@/components/board-pack/SpreadsheetViewer'
import { cn } from '@/lib/utils'
import { Bot, ChevronLeft, ChevronRight, GitCompare, X, ZoomIn, ZoomOut } from 'lucide-react'

function isSpreadsheetDocument(doc: Document | undefined): boolean {
  return doc?.type === 'XLSX' || doc?.type === 'XLS'
}

interface DocumentViewerProps {
  document: Document | undefined
  page: number
  onPageChange: (page: number) => void
  zoom: number
  onZoomChange: (zoom: number) => void
  onCompareVersions: () => void
  highlightedCitationId: string | null
  onClearHighlight: () => void
  hasVersions: boolean
}

export function DocumentViewer({
  document: doc,
  page,
  onPageChange,
  zoom,
  onZoomChange,
  onCompareVersions,
  highlightedCitationId,
  onClearHighlight,
  hasVersions,
}: DocumentViewerProps) {
  const activeCitation = highlightedCitationId ? getCitationById(highlightedCitationId) : null
  const isCitationOnThisPage =
    activeCitation && doc && activeCitation.documentId === doc.id && activeCitation.page === page

  const docCitations = doc ? getCitationsForDocument(doc.id) : []
  const citedPages = [...new Set(docCitations.map((c) => c.page))].sort((a, b) => a - b)
  const pageContent = doc ? getDocumentPageContent(doc.id, page) : null
  const isSpreadsheet = isSpreadsheetDocument(doc)
  const spreadsheetTabs = doc && isSpreadsheet ? getSpreadsheetTabs(doc.id) : []
  const activeSheetLabel = spreadsheetTabs.find((t) => t.page === page)?.label

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-navy-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-200 bg-navy-50 px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-du-purple-900">{doc?.title}</p>
          <p className="text-xs font-medium text-navy-600">
            {isSpreadsheet && spreadsheetTabs.length > 0
              ? `${doc?.type} · ${spreadsheetTabs.length} sheets`
              : `${doc?.type} · ${doc?.pages} pages`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {hasVersions && (
            <Button variant="outline" size="sm" onClick={onCompareVersions} className="h-8 text-xs">
              <GitCompare className="h-3.5 w-3.5" /> Compare versions
            </Button>
          )}
          <div className="mx-1 h-5 w-px bg-navy-200" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onZoomChange(Math.max(80, zoom - 10))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="min-w-[36px] text-center text-xs font-semibold text-navy-700">{zoom}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onZoomChange(Math.min(120, zoom + 10))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="mx-1 h-5 w-px bg-navy-200" />
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[64px] text-center text-xs font-bold text-navy-800">
            {isSpreadsheet && activeSheetLabel
              ? activeSheetLabel
              : `${page} / ${doc?.pages}`}
          </span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(Math.min(doc?.pages ?? 1, page + 1))} disabled={page >= (doc?.pages ?? 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {activeCitation && activeCitation.documentId === doc?.id && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-du-magenta-200 bg-du-magenta-50 px-4 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Bot className="h-4 w-4 shrink-0 text-du-purple-900" />
            <p className="text-xs font-medium text-du-purple-900">
              <span className="font-bold">Board AI source</span>
              {' · '}
              {isCitationOnThisPage
                ? 'Passage highlighted below — this is the original document text the AI referenced.'
                : `Citation on page ${activeCitation.page} — navigate to view the sourced passage.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isCitationOnThisPage && (
              <Button variant="outline" size="sm" className="h-7 bg-white text-xs" onClick={() => onPageChange(activeCitation.page)}>
                Go to p.{activeCitation.page}
              </Button>
            )}
            <button type="button" onClick={onClearHighlight} className="rounded p-1 text-navy-600 hover:bg-white hover:text-navy-900" title="Clear highlight">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {activeCitation && citedPages.length > 1 && activeCitation.documentId === doc?.id && (
        <div className="flex flex-wrap items-center gap-2 border-b border-navy-100 bg-navy-50 px-4 py-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-navy-500">Cited in this document:</span>
          {citedPages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                'rounded px-2 py-0.5 text-xs font-semibold',
                p === page ? 'bg-du-purple-900 text-white' : 'bg-white text-navy-700 ring-1 ring-navy-200 hover:bg-du-purple-50'
              )}
            >
              p.{p}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-[#dde1e6] p-6 scrollbar-thin">
        <div
          className={cn(
            'mx-auto rounded border border-navy-300 bg-white shadow-lg transition-transform',
            isSpreadsheet ? 'max-w-4xl' : 'max-w-2xl'
          )}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          <div className={cn('border-b border-navy-200 bg-navy-50 px-8 py-4', isSpreadsheet && 'bg-[#f3f3f3]')}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy-600">
              {isSpreadsheet
                ? `Workbook${activeSheetLabel ? ` · ${activeSheetLabel}` : ''}`
                : `Official Record · Page ${page}`}
            </p>
            <h2 className="mt-1 text-lg font-bold text-du-purple-900">{doc?.title.replace(/\.[^.]+$/, '')}</h2>
            {pageContent?.heading && (
              <p className="mt-1 text-sm font-semibold text-navy-700">{pageContent.heading}</p>
            )}
          </div>
          <div className={cn('px-8 py-6', !isSpreadsheet && 'space-y-4 text-sm leading-relaxed text-navy-800')}>
            {pageContent?.table && (
              <SpreadsheetViewer
                headers={pageContent.table.headers}
                rows={pageContent.table.rows}
                highlightPassage={isCitationOnThisPage ? activeCitation?.passage : null}
                tabs={spreadsheetTabs}
                activePage={page}
                onTabChange={onPageChange}
              />
            )}
            {pageContent?.paragraphs?.map((paragraph, i) => (
              <p key={i} className={cn(isSpreadsheet && 'mt-4 text-sm leading-relaxed text-navy-700')}>
                <HighlightedText
                  text={paragraph}
                  highlightPassage={isCitationOnThisPage ? activeCitation.passage : null}
                />
              </p>
            ))}
            {!pageContent?.table && !pageContent?.paragraphs?.length && (
              <p className="text-sm leading-relaxed text-navy-800">
                Board pack material — page {page} of {doc?.pages ?? '?'}.
              </p>
            )}
          </div>
          {isCitationOnThisPage && activeCitation && (
            <div className="mx-8 mb-6 rounded-lg border border-du-purple-200 bg-du-purple-50/80 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="cited" className="text-[10px]">AI referenced this passage</Badge>
                <Badge variant={activeCitation.confidence === 'High' ? 'approved' : 'pending'} className="text-[10px]">
                  {activeCitation.confidence} confidence
                </Badge>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-navy-600">
                Citations live in Board AI responses — not in the official document. The highlight above shows where the AI sourced its answer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HighlightedText({ text, highlightPassage }: { text: string; highlightPassage: string | null }) {
  if (!highlightPassage || !text.includes(highlightPassage)) {
    return <>{text}</>
  }

  const parts = text.split(highlightPassage)
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <mark className="rounded-sm bg-yellow-200 px-0.5 ring-2 ring-du-magenta-400 ring-offset-1">{highlightPassage}</mark>
          )}
        </span>
      ))}
    </>
  )
}
