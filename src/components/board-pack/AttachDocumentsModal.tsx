import { useState } from 'react'
import { documentCatalog } from '@/data/mockData'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Drawer'
import { cn } from '@/lib/utils'
import type { AgendaItem, Document } from '@/types'
import { FileText, Plus, Upload, X } from 'lucide-react'

interface AttachDocumentsModalProps {
  open: boolean
  onClose: () => void
  agendaItem: AgendaItem | null
  packDocuments: Document[]
  onAttachCatalog: (catalogId: string) => void
  onUpload: (input: { title: string; type: string; pages: number }) => void
  onDetach: (documentId: string) => void
}

export function AttachDocumentsModal({
  open,
  onClose,
  agendaItem,
  packDocuments,
  onAttachCatalog,
  onUpload,
  onDetach,
}: AttachDocumentsModalProps) {
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadType, setUploadType] = useState('PDF')
  const [uploadPages, setUploadPages] = useState('12')
  const [filter, setFilter] = useState('')

  if (!agendaItem) return null

  const linkedDocs = packDocuments.filter((d) => agendaItem.documentIds.includes(d.id))
  const filteredCatalog = documentCatalog.filter(
    (entry) =>
      entry.title.toLowerCase().includes(filter.toLowerCase()) ||
      entry.category.toLowerCase().includes(filter.toLowerCase())
  )

  const handleUpload = () => {
    if (!uploadTitle.trim()) return
    onUpload({
      title: uploadTitle.trim(),
      type: uploadType,
      pages: Number(uploadPages) || 1,
    })
    setUploadTitle('')
    setUploadPages('12')
  }

  return (
    <Modal open={open} onClose={onClose} title={`Documents — ${agendaItem.title}`} size="lg">
      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-bold text-navy-900">Linked to this agenda item</h3>
          {linkedDocs.length === 0 ? (
            <p className="mt-2 text-sm text-navy-500">No documents attached yet. Select from the catalog or upload below.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {linkedDocs.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-navy-200 bg-navy-50/50 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-du-magenta-600" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy-900">{doc.title}</p>
                      <p className="text-xs text-navy-500">
                        {doc.type} · {doc.pages} pages
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDetach(doc.id)}
                    className="rounded-lg p-1.5 text-navy-400 hover:bg-white hover:text-red-600"
                    title="Remove from agenda item"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-navy-900">Organisation document catalog</h3>
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter..."
              className="h-8 max-w-[180px] text-xs"
            />
          </div>
          <div className="mt-3 max-h-56 space-y-2 overflow-y-auto scrollbar-thin">
            {filteredCatalog.map((entry) => {
              const linked = linkedDocs.some((d) => d.title === entry.title)
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5',
                    linked ? 'border-du-magenta-200 bg-du-magenta-50/40' : 'border-navy-200 bg-white'
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy-900">{entry.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="muted" className="text-[10px]">{entry.type}</Badge>
                      <Badge variant="muted" className="text-[10px]">{entry.category}</Badge>
                      <span className="text-[10px] text-navy-500">{entry.pages} pp</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={linked ? 'outline' : 'default'}
                    disabled={linked}
                    onClick={() => onAttachCatalog(entry.id)}
                  >
                    {linked ? 'Attached' : 'Attach'}
                  </Button>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-xl border border-dashed border-navy-300 bg-navy-50/50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-navy-900">
            <Upload className="h-4 w-4" /> Upload new document
          </h3>
          <p className="mt-1 text-xs text-navy-500">Simulates adding a new file to the pack (prototype).</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Input
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Document title"
              className="sm:col-span-3"
            />
            <Select value={uploadType} onChange={(e) => setUploadType(e.target.value)}>
              <option value="PDF">PDF</option>
              <option value="XLSX">XLSX</option>
              <option value="PPTX">PPTX</option>
              <option value="DOCX">DOCX</option>
            </Select>
            <Input
              type="number"
              min={1}
              value={uploadPages}
              onChange={(e) => setUploadPages(e.target.value)}
              placeholder="Pages"
            />
            <Button onClick={handleUpload} disabled={!uploadTitle.trim()}>
              <Plus className="h-4 w-4" /> Add file
            </Button>
          </div>
        </section>
      </div>
    </Modal>
  )
}
