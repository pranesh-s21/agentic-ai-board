import { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'
import type { NorthDocumentView } from '@/types'
import { fetchNorthFileBlob } from '@/lib/northFileApi'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, ExternalLink, Loader2, ZoomIn, ZoomOut } from 'lucide-react'

interface NorthDocumentViewerProps {
  view: NorthDocumentView
  onPageChange?: (page: number) => void
  className?: string
}

export function NorthDocumentViewer({ view, onPageChange, className }: NorthDocumentViewerProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<HTMLDivElement>(null)

  const [page, setPage] = useState(view.page)
  const [zoom, setZoom] = useState(100)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState(view.title)
  const [totalPages, setTotalPages] = useState(1)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  useEffect(() => {
    setPage(view.page)
  }, [view.page, view.fileId, view.title])

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    async function load() {
      setLoading(true)
      setError(null)
      if (bodyRef.current) bodyRef.current.innerHTML = ''
      if (styleRef.current) styleRef.current.innerHTML = ''

      try {
        const { blob, filename } = await fetchNorthFileBlob({
          fileId: view.fileId,
          title: view.title,
        })
        if (cancelled) return

        setTitle(filename)
        objectUrl = URL.createObjectURL(blob)
        setDownloadUrl(objectUrl)

        const lower = filename.toLowerCase()
        if (!lower.endsWith('.docx')) {
          setError('Only .docx preview is supported in-app — use Open original to download.')
          setLoading(false)
          return
        }

        if (!bodyRef.current || !styleRef.current) return

        await renderAsync(blob, bodyRef.current, styleRef.current, {
          className: 'north-docx-page',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        })

        if (cancelled) return

        const sections = bodyRef.current.querySelectorAll('section')
        const count = Math.max(1, sections.length)
        setTotalPages(count)

        const citedPage = Math.min(Math.max(1, view.page || 1), count)
        setPage(citedPage)
        scrollToPage(citedPage, sections)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Load failed')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [view.fileId, view.title, view.page])

  const goToPage = (next: number) => {
    const clamped = Math.min(Math.max(1, next), totalPages)
    setPage(clamped)
    onPageChange?.(clamped)
    const sections = bodyRef.current?.querySelectorAll('section')
    if (sections) scrollToPage(clamped, sections)
  }

  return (
    <div className={cn('flex h-full min-h-[480px] flex-col overflow-hidden rounded-xl border border-navy-200 bg-white', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-200 bg-navy-50 px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-du-purple-900">{title}</p>
          <p className="text-xs font-medium text-navy-600">
            North My Files · Page {page} of {totalPages}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(60, z - 10))}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-[3rem] text-center text-xs font-medium text-navy-600">{zoom}%</span>
          <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(140, z + 10))}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => goToPage(page - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => goToPage(page + 1)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={title}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-navy-200 bg-white px-2 text-xs font-medium text-navy-700 hover:bg-navy-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open original
            </a>
          )}
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-[#525659] p-4 scrollbar-thin">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-[#525659]/80 text-sm text-white">
            <Loader2 className="h-5 w-5 animate-spin" />
            Rendering document…
          </div>
        )}
        {error && !loading && (
          <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}
        <div ref={styleRef} />
        <div
          ref={bodyRef}
          className="north-docx-viewer mx-auto origin-top transition-transform"
          style={{ transform: `scale(${zoom / 100})` }}
        />
      </div>

      {!loading && !error && (
        <div className="border-t border-navy-100 bg-navy-50 px-4 py-2">
          <Badge variant="cited" className="text-[10px]">Source document · Board AI</Badge>
        </div>
      )}
    </div>
  )
}

function scrollToPage(page: number, sections: NodeListOf<Element>) {
  const section = sections[page - 1]
  section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
