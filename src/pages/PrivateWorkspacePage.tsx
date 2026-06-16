import { useRef, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { documents } from '@/data/mockData'
import { formatDateTime, formatFileSize } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Drawer'
import type { WorkspaceItem } from '@/types'
import {
  AlertCircle,
  Folder,
  FolderPlus,
  FileText,
  Lock,
  Plus,
  StickyNote,
  Trash2,
  Upload,
  LayoutGrid,
  ExternalLink,
} from 'lucide-react'

type ModalType = 'workspace' | 'folder' | 'note' | 'document' | null

export function PrivateWorkspacePage() {
  const {
    privateWorkspaces,
    workspaceFolders,
    workspaceItems,
    activeWorkspaceId,
    activeFolderId,
    setActiveWorkspaceId,
    setActiveFolderId,
    createPrivateWorkspace,
    updateWorkspaceNotes,
    createWorkspaceFolder,
    addWorkspaceNote,
    addWorkspaceDocument,
    addWorkspaceFile,
    deleteWorkspaceItem,
    navigateToBoardPack,
    setSelectedDocumentId,
  } = useApp()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [modal, setModal] = useState<ModalType>(null)
  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceNotes, setWorkspaceNotes] = useState('')
  const [folderName, setFolderName] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [selectedDocId, setSelectedDocId] = useState(documents[0]?.id ?? '')

  const activeWorkspace = privateWorkspaces.find((w) => w.id === activeWorkspaceId)
  const folders = workspaceFolders.filter((f) => f.workspaceId === activeWorkspaceId)
  const activeFolder = folders.find((f) => f.id === activeFolderId)
  const items = workspaceItems.filter(
    (i) => i.workspaceId === activeWorkspaceId && i.folderId === activeFolderId
  )

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id)
    const firstFolder = workspaceFolders.find((f) => f.workspaceId === id)
    setActiveFolderId(firstFolder?.id ?? null)
  }

  const handleCreateWorkspace = () => {
    if (!workspaceName.trim()) return
    createPrivateWorkspace(workspaceName.trim(), workspaceNotes.trim())
    setWorkspaceName('')
    setWorkspaceNotes('')
    setModal(null)
  }

  const handleCreateFolder = () => {
    if (!folderName.trim() || !activeWorkspaceId) return
    createWorkspaceFolder(activeWorkspaceId, folderName.trim())
    setFolderName('')
    setModal(null)
  }

  const handleAddNote = () => {
    if (!activeFolderId || !noteContent.trim()) return
    addWorkspaceNote(activeFolderId, noteTitle.trim() || 'Untitled note', noteContent.trim())
    setNoteTitle('')
    setNoteContent('')
    setModal(null)
  }

  const handleAddDocument = () => {
    if (!activeFolderId || !selectedDocId) return
    addWorkspaceDocument(activeFolderId, selectedDocId)
    setModal(null)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeFolderId) return
    addWorkspaceFile(activeFolderId, {
      fileName: file.name,
      fileType: file.type || 'File',
      fileSize: formatFileSize(file.size),
    })
    e.target.value = ''
  }

  const openDocument = (item: WorkspaceItem) => {
    if (!item.documentId) return
    setSelectedDocumentId(item.documentId)
    navigateToBoardPack()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-navy-200 bg-white px-4 py-3 du-card-shadow">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" />
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="private">Private to You</Badge>
            <Badge variant="muted">Not part of the official Board record</Badge>
          </div>
          <p className="mt-2 text-sm text-navy-600">
            Organise meeting preparation in private workspaces — folders, notes, board pack references, and uploaded files.
          </p>
        </div>
      </div>

      <div className="flex h-[calc(100vh-12rem)] min-h-[520px] overflow-hidden rounded-xl border border-navy-200 bg-white du-card-shadow">
        {/* Workspaces */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-navy-200 bg-navy-50/50">
          <div className="flex items-center justify-between border-b border-navy-200 px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-navy-600">Workspaces</p>
            <button
              type="button"
              onClick={() => setModal('workspace')}
              className="rounded-lg p-1 text-du-magenta-600 hover:bg-du-magenta-50"
              title="New workspace"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {privateWorkspaces.map((ws) => (
              <button
                key={ws.id}
                type="button"
                onClick={() => handleSelectWorkspace(ws.id)}
                className={`mb-1 flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  ws.id === activeWorkspaceId
                    ? 'bg-du-purple-900 text-white'
                    : 'text-navy-800 hover:bg-white'
                }`}
              >
                <LayoutGrid className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{ws.name}</p>
                  <p className={`mt-0.5 text-[10px] ${ws.id === activeWorkspaceId ? 'text-white/70' : 'text-navy-500'}`}>
                    {workspaceFolders.filter((f) => f.workspaceId === ws.id).length} folders
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Folders */}
        <aside className="flex w-52 shrink-0 flex-col border-r border-navy-200">
          <div className="flex items-center justify-between border-b border-navy-200 px-3 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-navy-600">Folders</p>
            <button
              type="button"
              onClick={() => setModal('folder')}
              disabled={!activeWorkspaceId}
              className="rounded-lg p-1 text-du-magenta-600 hover:bg-du-magenta-50 disabled:opacity-40"
              title="New folder"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            {folders.length === 0 ? (
              <p className="px-2 py-4 text-xs text-navy-500">No folders yet.</p>
            ) : (
              folders.map((folder) => {
                const count = workspaceItems.filter(
                  (i) => i.workspaceId === activeWorkspaceId && i.folderId === folder.id
                ).length
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setActiveFolderId(folder.id)}
                    className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      folder.id === activeFolderId
                        ? 'bg-du-magenta-50 font-semibold text-du-purple-900 ring-1 ring-du-magenta-200'
                        : 'text-navy-700 hover:bg-navy-50'
                    }`}
                  >
                    <Folder className="h-4 w-4 shrink-0 text-du-magenta-600" />
                    <span className="min-w-0 flex-1 truncate">{folder.name}</span>
                    <span className="text-[10px] text-navy-400">{count}</span>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {activeWorkspace ? (
            <>
              <div className="border-b border-navy-200 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-du-purple-900" />
                      <h2 className="text-lg font-bold text-du-purple-900">{activeWorkspace.name}</h2>
                    </div>
                    {activeFolder && (
                      <p className="mt-1 text-sm text-navy-600">{activeFolder.name}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setModal('note')} disabled={!activeFolderId}>
                      <StickyNote className="h-4 w-4" /> Add note
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setModal('document')} disabled={!activeFolderId}>
                      <FileText className="h-4 w-4" /> Add document
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!activeFolderId}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" /> Upload file
                    </Button>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-navy-500">
                    Workspace notes
                  </label>
                  <Textarea
                    value={activeWorkspace.notes}
                    onChange={(e) => updateWorkspaceNotes(activeWorkspace.id, e.target.value)}
                    placeholder="Add private context for this workspace — meeting goals, questions to raise, follow-ups..."
                    rows={2}
                    className="mt-1.5 text-sm"
                  />
                  <p className="mt-1 text-[10px] text-navy-400">Saved automatically · Updated {formatDateTime(activeWorkspace.updatedAt)}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                {!activeFolderId ? (
                  <EmptyState message="Select a folder to view or add items." />
                ) : items.length === 0 ? (
                  <EmptyState message="This folder is empty. Add a note, board pack document, or upload a file." />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onDelete={() => deleteWorkspaceItem(item.id)}
                        onOpenDocument={() => openDocument(item)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyState message="Create a workspace to get started." />
            </div>
          )}
        </div>
      </div>

      <Modal open={modal === 'workspace'} onClose={() => setModal(null)} title="New private workspace" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-navy-700">Workspace name</label>
            <Input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g. Audit Committee — July 2026"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-navy-700">Workspace notes (optional)</label>
            <Textarea
              value={workspaceNotes}
              onChange={(e) => setWorkspaceNotes(e.target.value)}
              placeholder="What is this workspace for?"
              rows={3}
              className="mt-1"
            />
          </div>
          <p className="text-xs text-navy-500">
            Default folders will be created: Preparation Notes, Reference Documents, Uploaded Files, and Saved from Board.
          </p>
          <Button className="w-full" onClick={handleCreateWorkspace} disabled={!workspaceName.trim()}>
            Create workspace
          </Button>
        </div>
      </Modal>

      <Modal open={modal === 'folder'} onClose={() => setModal(null)} title="New folder" size="sm">
        <div className="space-y-4">
          <Input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder name"
          />
          <Button className="w-full" onClick={handleCreateFolder} disabled={!folderName.trim()}>
            Create folder
          </Button>
        </div>
      </Modal>

      <Modal open={modal === 'note'} onClose={() => setModal(null)} title="Add note" size="md">
        <div className="space-y-4">
          <Input
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Note title (optional)"
          />
          <Textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Your private note..."
            rows={5}
          />
          <Button className="w-full" onClick={handleAddNote} disabled={!noteContent.trim()}>
            Save note
          </Button>
        </div>
      </Modal>

      <Modal open={modal === 'document'} onClose={() => setModal(null)} title="Add board pack document" size="md">
        <div className="space-y-4">
          <p className="text-sm text-navy-600">
            Add a reference to an official board pack document. Click the item later to open it in Board Pack Review.
          </p>
          <Select value={selectedDocId} onChange={(e) => setSelectedDocId(e.target.value)}>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.title} ({doc.type})
              </option>
            ))}
          </Select>
          <Button className="w-full" onClick={handleAddDocument}>
            Add document
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function ItemCard({
  item,
  onDelete,
  onOpenDocument,
}: {
  item: WorkspaceItem
  onDelete: () => void
  onOpenDocument: () => void
}) {
  const typeLabels = { note: 'Note', document: 'Document', file: 'File' } as const
  const typeVariants = { note: 'ai', document: 'official', file: 'pending' } as const

  return (
    <Card className="group relative overflow-hidden border-navy-200 transition-shadow hover:du-card-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <Badge variant={typeVariants[item.type]} className="text-[10px]">
            {typeLabels[item.type]}
          </Badge>
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1 text-navy-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
            title="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="mt-2 text-sm font-semibold text-navy-900 line-clamp-2">{item.title}</p>

        {item.type === 'note' && item.content && (
          <p className="mt-2 text-xs leading-relaxed text-navy-600 line-clamp-4">{item.content}</p>
        )}

        {item.type === 'document' && (
          <button
            type="button"
            onClick={onOpenDocument}
            className="mt-3 flex items-center gap-1 text-xs font-semibold text-du-magenta-600 hover:text-du-magenta-700"
          >
            Open in Board Pack <ExternalLink className="h-3 w-3" />
          </button>
        )}

        {item.type === 'file' && (
          <p className="mt-2 text-xs text-navy-500">
            {item.fileType?.split('/').pop()?.toUpperCase() || 'File'} · {item.fileSize}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-navy-100 pt-2">
          <p className="text-[10px] text-navy-400">{formatDateTime(item.createdAt)}</p>
          {item.source && <Badge variant="muted" className="text-[10px]">{item.source}</Badge>}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-navy-200 bg-navy-50/50 py-16 text-center">
      <p className="text-sm text-navy-500">{message}</p>
    </div>
  )
}
