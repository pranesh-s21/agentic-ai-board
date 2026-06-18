import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { deleteNorthMyFile, fetchNorthMyFiles, uploadNorthMyFile } from '@/lib/northFileApi'
import { formatDateTime, formatFileSize } from '@/lib/utils'
import type { NorthMyFile } from '@/types'
import { ChatProviderStatus } from '@/components/shared/ChatProviderStatus'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  Eye,
  File,
  Files,
  FileSpreadsheet,
  FileText,
  FileType,
  Loader2,
  MessageSquare,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react'

const ACCEPTED_TYPES = '.docx,.pdf,.txt,.md,.csv'

function statusVariant(status: string): 'default' | 'cited' | 'warning' {
  if (status === 'processed') return 'cited'
  if (status === 'uploaded' || status === 'processing') return 'warning'
  return 'default'
}

function statusLabel(status: string): string {
  if (status === 'processed') return 'Ready'
  if (status === 'uploaded') return 'Processing'
  if (status === 'processing') return 'Processing'
  return status
}

function fileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return FileType
  if (ext === 'csv') return FileSpreadsheet
  if (ext === 'docx' || ext === 'doc') return FileText
  return File
}

export function NorthMyFilesPanel({
  className,
  variant = 'org',
  layout = 'compact',
}: {
  className?: string
  variant?: 'org' | 'workspace' | 'standalone'
  layout?: 'compact' | 'page'
}) {
  const { setNorthDocumentView, showToast, chatHealth, refreshChatHealth, setScreen } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<NorthMyFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<NorthMyFile | null>(null)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)

  const isNorthLive = chatHealth.provider === 'north'
  const isPageLayout = layout === 'page' && variant === 'org'

  const loadFiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchNorthMyFiles()
      setFiles(data.files)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load files')
      setFiles([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isNorthLive) loadFiles()
    else setLoading(false)
  }, [isNorthLive, loadFiles])

  const handleUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0]
    if (!file || uploading) return

    setUploading(true)
    setError(null)
    try {
      const uploaded = await uploadNorthMyFile(file)
      await loadFiles()
      await refreshChatHealth()
      showToast(
        uploaded.status === 'processed'
          ? `${uploaded.filename} uploaded — ready for Board AI`
          : `${uploaded.filename} uploaded — processing…`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const requestDelete = (file: NorthMyFile) => {
    setPendingDelete(file)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const file = pendingDelete
    setDeletingFileId(file.id)
    setError(null)
    try {
      await deleteNorthMyFile(file.id)
      await loadFiles()
      await refreshChatHealth()
      showToast(`${file.filename} removed`)
      setPendingDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingFileId(null)
    }
  }

  const deleteConfirmDialog = (
    <ConfirmDialog
      open={!!pendingDelete}
      title="Remove organisation file?"
      description={
        pendingDelete ? (
          <>
            <span className="font-medium text-navy-800">&ldquo;{pendingDelete.filename}&rdquo;</span> will be
            removed from the shared library. Board AI will no longer cite this document.
          </>
        ) : null
      }
      confirmLabel="Remove file"
      cancelLabel="Keep file"
      variant="destructive"
      loading={!!pendingDelete && deletingFileId === pendingDelete.id}
      onConfirm={confirmDelete}
      onCancel={() => !deletingFileId && setPendingDelete(null)}
    />
  )

  const openFile = (file: NorthMyFile) => {
    setNorthDocumentView({
      fileId: file.id,
      title: file.filename,
      page: 1,
    })
  }

  const uploadZone = (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleUpload(e.dataTransfer.files)
      }}
      className={cn(
        'transition-all',
        isPageLayout
          ? 'flex items-center gap-4 rounded-lg border border-dashed px-4 py-3'
          : 'rounded-xl border-2 border-dashed px-4 py-5 text-center',
        dragOver
          ? 'border-teal-400 bg-teal-50/80'
          : isPageLayout
            ? 'border-navy-200 bg-white'
            : 'border-navy-200 bg-gradient-to-r from-navy-50/60 to-teal-50/30',
        uploading && 'pointer-events-none opacity-60'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />
      {uploading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-navy-600">
          <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
          Uploading…
        </div>
      ) : (
        <>
          <div
            className={cn(
              'flex shrink-0 items-center justify-center rounded-lg bg-teal-50 ring-1 ring-teal-100',
              isPageLayout ? 'h-9 w-9' : 'mx-auto h-10 w-10 rounded-2xl bg-white shadow-sm'
            )}
          >
            <Upload className={cn('text-teal-600', isPageLayout ? 'h-4 w-4' : 'h-5 w-5')} />
          </div>
          <div className={cn('min-w-0 flex-1', !isPageLayout && 'mt-2')}>
            <p className={cn('font-medium text-navy-800', isPageLayout ? 'text-sm' : 'text-xs')}>
              {isPageLayout ? (
                <>
                  <span className="font-semibold">Drop files here</span>
                  <span className="text-navy-500"> or </span>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="font-semibold text-teal-700 hover:underline"
                  >
                    browse
                  </button>
                </>
              ) : (
                'Drop a file or'
              )}
            </p>
            <p className="text-[11px] text-navy-400">
              .docx, .pdf, .txt, .md, .csv · max 50 MB
              {!isPageLayout && (
                <>
                  {' · '}
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="font-semibold text-teal-700 hover:underline"
                  >
                    browse your computer
                  </button>
                </>
              )}
            </p>
          </div>
          {!isPageLayout ? (
            <Button variant="outline" size="sm" className="mt-2" onClick={() => inputRef.current?.click()}>
              Choose file
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => inputRef.current?.click()}>
              Choose file
            </Button>
          )}
        </>
      )}
    </div>
  )

  if (!isNorthLive) {
    return (
      <>
      <Card className={cn('border-navy-200/80', className)}>
        <CardHeader className="pb-2">
          <p className="text-sm font-semibold text-navy-900">Organisation Files</p>
          <p className="text-[11px] text-navy-500">Shared library · powers Board AI document search</p>
        </CardHeader>
        <CardContent>
          <p className="text-xs leading-relaxed text-navy-600">
            Connect North in <code className="text-[10px]">.env</code> (<code className="text-[10px]">CHAT_PROVIDER=north</code>) to upload organisation documents here. Once indexed, all board members can query them in Ask Board AI.
          </p>
        </CardContent>
      </Card>
      {deleteConfirmDialog}
      </>
    )
  }

  const readyCount = files.filter((f) => f.status === 'processed').length
  const processingCount = files.filter((f) => f.status !== 'processed').length

  if (isPageLayout) {
    return (
      <>
      <div className={cn('flex min-h-0 flex-col overflow-hidden bg-white', className)}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-navy-200 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
              <Files className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-du-purple-900">Organisation Files</h2>
                <Badge variant="official">Organisation-wide</Badge>
                <Badge variant="cited">{readyCount} indexed</Badge>
              </div>
              <p className="text-xs text-navy-500">
                Shared document library for the board · available to Ask Board AI with citations
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ChatProviderStatus />
            <Button variant="outline" size="sm" onClick={loadFiles} disabled={loading || uploading}>
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            </Button>
            <Button size="sm" onClick={() => setScreen('ask_ai')}>
              <MessageSquare className="h-3.5 w-3.5" />
              Ask Board AI
            </Button>
          </div>
        </div>

        <div className="shrink-0 border-b border-navy-100 bg-navy-50/30 px-6 py-3">{uploadZone}</div>

        {error && (
          <div className="mx-6 mt-3 flex shrink-0 items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
          {loading && files.length === 0 ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-navy-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading documents…
            </div>
          ) : files.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <FileText className="h-12 w-12 text-navy-200" />
              <p className="mt-4 text-base font-semibold text-navy-800">No documents yet</p>
              <p className="mt-1 max-w-md text-sm text-navy-500">
                Upload programme documents using the bar above. Once processed, board members can query them in Ask Board AI.
              </p>
              <Button className="mt-4" size="sm" onClick={() => inputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Upload first document
              </Button>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 border-b border-navy-200 bg-white shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                <tr>
                  <th className="w-[45%] px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-navy-500">
                    Document
                  </th>
                  <th className="w-[10%] px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-navy-500">
                    Size
                  </th>
                  <th className="w-[12%] px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-navy-500">
                    Status
                  </th>
                  <th className="hidden w-[18%] px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-navy-500 lg:table-cell">
                    Uploaded
                  </th>
                  <th className="w-[15%] px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-navy-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, index) => {
                  const Icon = fileIcon(file.filename)
                  return (
                    <tr
                      key={file.id}
                      className={cn(
                        'group transition-colors hover:bg-teal-50/40',
                        index !== files.length - 1 && 'border-b border-navy-100'
                      )}
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 ring-1 ring-teal-100/80">
                            <Icon className="h-4 w-4 text-teal-700" />
                          </div>
                          <button
                            type="button"
                            onClick={() => file.status === 'processed' && openFile(file)}
                            disabled={file.status !== 'processed'}
                            className={cn(
                              'min-w-0 truncate text-left text-sm font-semibold',
                              file.status === 'processed'
                                ? 'text-navy-900 hover:text-teal-700'
                                : 'cursor-default text-navy-600'
                            )}
                            title={file.filename}
                          >
                            {file.filename}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm tabular-nums text-navy-600">{formatFileSize(file.bytes)}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={statusVariant(file.status)}>{statusLabel(file.status)}</Badge>
                      </td>
                      <td className="hidden px-4 py-3.5 text-sm text-navy-500 lg:table-cell">
                        {formatDateTime(file.createdAt)}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={file.status !== 'processed'}
                            onClick={() => openFile(file)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => requestDelete(file)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {files.length > 0 && (
          <div className="shrink-0 border-t border-navy-100 bg-navy-50/40 px-6 py-2.5 text-xs text-navy-500">
            {files.length} document{files.length === 1 ? '' : 's'} in North My Files
            {processingCount > 0 && ` · ${processingCount} still processing`}
            {' · '}
            <button
              type="button"
              onClick={() => setScreen('ask_ai')}
              className="font-semibold text-teal-700 hover:underline"
            >
              Ask Board AI
            </button>{' '}
            to query with citations
          </div>
        )}
      </div>
      {deleteConfirmDialog}
      </>
    )
  }

  const title =
    variant === 'org' ? 'Document library' : variant === 'workspace' ? 'Uploaded Files' : 'North My Files'
  const subtitle =
    variant === 'org'
      ? `${files.length} organisation document${files.length === 1 ? '' : 's'} · shared with all board members`
      : variant === 'workspace'
        ? 'Stored in North My Files · indexed for Board AI'
        : `${files.length} document${files.length === 1 ? '' : 's'} indexed for Board AI`

  return (
    <>
    <Card className={cn('flex flex-col border-navy-200/80', className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <div>
          <p className="text-sm font-semibold text-navy-900">{title}</p>
          <p className="text-[11px] text-navy-500">{subtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadFiles} disabled={loading || uploading}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        {uploadZone}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto scrollbar-thin">
          {loading && files.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-navy-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading files…
            </div>
          ) : files.length === 0 ? (
            <p className="py-6 text-center text-xs text-navy-500">
              No files yet. Upload a board document to start asking questions.
            </p>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="flex items-start gap-2 rounded-lg border border-navy-100 bg-white px-3 py-2.5 shadow-sm"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-navy-900" title={file.filename}>
                    {file.filename}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant={statusVariant(file.status)} className="text-[9px]">
                      {statusLabel(file.status)}
                    </Badge>
                    <span className="text-[10px] text-navy-500">{formatFileSize(file.bytes)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    title="View document"
                    disabled={file.status !== 'processed'}
                    onClick={() => openFile(file)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                    title="Remove file"
                    onClick={() => requestDelete(file)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
    {deleteConfirmDialog}
    </>
  )
}
