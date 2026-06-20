import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { AttachDocumentsModal } from '@/components/board-pack/AttachDocumentsModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Drawer'
import { cn } from '@/lib/utils'
import type { AgendaItem } from '@/types'
import {
  Send,
  Eye,
  FileText,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  RotateCcw,
  Bot,
  Gavel,
  ChevronRight,
  Lock,
  Plus,
  Trash2,
  FolderPlus,
  Sparkles,
  Paperclip,
} from 'lucide-react'

export function PackPreparationPage() {
  const {
    canAccess,
    activeMeeting,
    packDocuments,
    isPackPublished,
    updateAgendaItem,
    addAgendaItem,
    removeAgendaItem,
    attachCatalogDocument,
    uploadPackDocument,
    detachDocumentFromAgenda,
    startFreshPack,
    loadDemoPack,
    publishBoardPack,
    revertBoardPackToDraft,
    navigateToBoardPack,
    setScreen,
    boardCommunication,
    publishBoardCommunication,
    reviewItems,
  } = useApp()

  const [showAddAgenda, setShowAddAgenda] = useState(false)
  const [newAgendaTitle, setNewAgendaTitle] = useState('')
  const [newAgendaDecision, setNewAgendaDecision] = useState(false)
  const [attachAgendaId, setAttachAgendaId] = useState<string | null>(null)
  const [removeAgendaId, setRemoveAgendaId] = useState<string | null>(null)

  if (!canAccess('pack_preparation')) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 py-20">
        <Lock className="mb-4 h-12 w-12 text-red-400" />
        <p className="text-lg font-medium text-red-800">Restricted</p>
        <p className="mt-1 text-sm text-red-600">Pack preparation is available to Secretariat only.</p>
      </div>
    )
  }

  const items = activeMeeting.agendaItems
  const avgProgress =
    items.length > 0
      ? Math.round(items.reduce((n, i) => n + i.preparationProgress, 0) / items.length)
      : 0

  const itemsWithDocs = items.filter((i) => i.documentIds.length > 0)
  const readyCount = items.filter((i) => i.status === 'Ready' && i.documentIds.length > 0).length
  const canPublish = !isPackPublished && readyCount >= 1
  const pendingReviews = reviewItems.filter((r) => r.status === 'Pending Review').length
  const directorSubmissions = reviewItems.filter((r) => r.source === 'director' && r.status === 'Pending Review').length
  const attachAgendaItem = items.find((i) => i.id === attachAgendaId) ?? null

  const markReady = (item: AgendaItem) => {
    updateAgendaItem(item.id, { status: 'Ready', preparationProgress: 100 })
  }

  const markInReview = (item: AgendaItem) => {
    updateAgendaItem(item.id, {
      status: 'In Review',
      preparationProgress: Math.max(item.preparationProgress, 85),
    })
  }

  const handleAddAgenda = () => {
    if (!newAgendaTitle.trim()) return
    addAgendaItem({ title: newAgendaTitle.trim(), decisionRequired: newAgendaDecision })
    setNewAgendaTitle('')
    setNewAgendaDecision(false)
    setShowAddAgenda(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-navy-200 bg-white px-6 py-5 du-card-shadow">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-du-magenta-600">Institutional Secretariat</p>
          <h2 className="mt-1 text-xl font-bold text-du-purple-900">{activeMeeting.title}</h2>
          <p className="mt-1 text-sm text-navy-600">
            {formatDate(activeMeeting.date)} · {activeMeeting.location}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={startFreshPack}>
            <FolderPlus className="h-4 w-4" /> Fresh pack
          </Button>
          <Button variant="outline" size="sm" onClick={loadDemoPack}>
            <Sparkles className="h-4 w-4" /> Load demo pack
          </Button>
          <Badge variant={isPackPublished ? 'approved' : 'pending'}>
            {isPackPublished ? 'Published to board' : 'Draft — not visible to directors'}
          </Badge>
          {!isPackPublished ? (
            <Button onClick={publishBoardPack} disabled={!canPublish}>
              <Send className="h-4 w-4" /> Publish board pack
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => navigateToBoardPack()}>
                <Eye className="h-4 w-4" /> Preview as published
              </Button>
              <Button variant="outline" onClick={revertBoardPackToDraft}>
                <RotateCcw className="h-4 w-4" /> Revert to draft
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Agenda items" value={String(items.length)} hint={`${itemsWithDocs.length} with documents`} />
        <StatTile label="Pack readiness" value={`${avgProgress}%`} hint={`${readyCount} item(s) marked ready`} />
        <StatTile label="Pending reviews" value={String(pendingReviews)} hint="AI drafts & director submissions" accent={pendingReviews > 0 ? 'warning' : 'default'} />
        <StatTile label="Pack status" value={isPackPublished ? 'Live' : 'Draft'} hint={isPackPublished ? 'Directors can review' : 'Hidden from board'} />
      </div>

      {!canPublish && !isPackPublished && items.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <p className="text-sm text-amber-900">
            Attach documents to agenda items, then mark at least one as <strong>Ready</strong> before publishing to the board.
          </p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-navy-900">Build the agenda</h3>
            <Button size="sm" onClick={() => setShowAddAgenda(true)}>
              <Plus className="h-4 w-4" /> Add agenda item
            </Button>
          </div>

          {items.length === 0 ? (
            <Card className="border-dashed border-navy-300 bg-navy-50/30">
              <CardContent className="flex flex-col items-center py-14 text-center">
                <FolderPlus className="mb-4 h-12 w-12 text-navy-300" />
                <h4 className="text-lg font-bold text-du-purple-900">Start a fresh board pack</h4>
                <p className="mt-2 max-w-md text-sm text-navy-600">
                  Add agenda items, attach papers from the document catalog or upload new files, then publish when ready for directors.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Button onClick={() => setShowAddAgenda(true)}>
                    <Plus className="h-4 w-4" /> Add first agenda item
                  </Button>
                  <Button variant="outline" onClick={loadDemoPack}>
                    <Sparkles className="h-4 w-4" /> Or load demo pack
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            items.map((item) => {
              const itemDocs = packDocuments.filter((d) => item.documentIds.includes(d.id))
              return (
                <Card key={item.id} className="border-navy-200/80">
                  <CardContent className="pt-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-du-purple-900 text-sm font-bold text-white">
                            {item.order}
                          </span>
                          <div>
                            <h4 className="font-semibold text-navy-900">{item.title}</h4>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant={item.status === 'Ready' ? 'approved' : item.status === 'Draft' ? 'draft' : 'pending'}>
                                {item.status}
                              </Badge>
                              {item.decisionRequired && (
                                <Badge variant="draft" className="gap-1">
                                  <Gavel className="h-3 w-3" /> Decision required
                                </Badge>
                              )}
                              {item.aiAvailable && (
                                <Badge variant="approved" className="gap-1">
                                  <Bot className="h-3 w-3" /> AI briefing
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-navy-500">
                            <span>Preparation</span>
                            <span className="font-medium">{item.preparationProgress}%</span>
                          </div>
                          <div className="mt-1.5 h-2 rounded-full bg-navy-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-du-purple-600 to-du-magenta-500"
                              style={{ width: `${item.preparationProgress}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">
                            Pack documents ({itemDocs.length})
                          </p>
                          {itemDocs.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {itemDocs.map((doc) => (
                                <span
                                  key={doc.id}
                                  className="inline-flex items-center gap-1.5 rounded-md border border-navy-100 bg-navy-50 px-2.5 py-1 text-xs text-navy-600"
                                >
                                  <FileText className="h-3 w-3" /> {doc.title}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-navy-500">No documents yet — attach from catalog or upload.</p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2">
                        <Button size="sm" variant="outline" onClick={() => setAttachAgendaId(item.id)}>
                          <Paperclip className="h-4 w-4" /> Attach documents
                        </Button>
                        {item.status !== 'Ready' && itemDocs.length > 0 && (
                          <Button size="sm" variant="outline" onClick={() => markInReview(item)}>
                            Mark in review
                          </Button>
                        )}
                        {itemDocs.length > 0 && (
                          <Button size="sm" onClick={() => markReady(item)}>
                            <CheckCircle2 className="h-4 w-4" /> Mark ready
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setRemoveAgendaId(item.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How to prepare</CardTitle>
              <CardDescription>Fresh pack workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <WorkflowStep done={items.length > 0} label="Add agenda items" />
              <WorkflowStep done={itemsWithDocs.length > 0} label="Attach documents to each item" />
              <WorkflowStep done={readyCount >= 1} label="Mark items ready for board" />
              <WorkflowStep done={isPackPublished} label="Publish pack to directors" />
              <WorkflowStep done={boardCommunication.status === 'published'} label="Communicate meeting outcomes" optional />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review queue</CardTitle>
              <CardDescription>{pendingReviews} items · {directorSubmissions} from directors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {reviewItems.filter((r) => r.status === 'Pending Review').slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-lg border border-navy-200 p-3">
                  <p className="truncate text-sm font-semibold text-du-purple-900">{item.title}</p>
                  {item.source === 'director' && <Badge variant="official" className="mt-1">From director</Badge>}
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={() => setScreen('secretariat_review')}>
                Open review queue <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-4 w-4" /> Board communication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-semibold text-navy-900">{boardCommunication.title}</p>
              <p className="text-sm leading-relaxed text-navy-700">{boardCommunication.summary}</p>
              {boardCommunication.status !== 'published' && (
                <Button size="sm" className="w-full" onClick={publishBoardCommunication}>
                  <Send className="h-4 w-4" /> Publish outcomes
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal open={showAddAgenda} onClose={() => setShowAddAgenda(false)} title="Add agenda item" size="md">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-navy-700">Title</label>
            <Input
              value={newAgendaTitle}
              onChange={(e) => setNewAgendaTitle(e.target.value)}
              placeholder="e.g. Strategic Network Investment Programme"
              autoFocus
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-navy-700">
            <input
              type="checkbox"
              checked={newAgendaDecision}
              onChange={(e) => setNewAgendaDecision(e.target.checked)}
              className="rounded border-navy-300"
            />
            Decision required at this meeting
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddAgenda(false)}>Cancel</Button>
            <Button onClick={handleAddAgenda} disabled={!newAgendaTitle.trim()}>Add item</Button>
          </div>
        </div>
      </Modal>

      <AttachDocumentsModal
        open={!!attachAgendaId}
        onClose={() => setAttachAgendaId(null)}
        agendaItem={attachAgendaItem}
        packDocuments={packDocuments}
        onAttachCatalog={(catalogId) => attachAgendaId && attachCatalogDocument(attachAgendaId, catalogId)}
        onUpload={(input) => attachAgendaId && uploadPackDocument(attachAgendaId, input)}
        onDetach={(documentId) => attachAgendaId && detachDocumentFromAgenda(attachAgendaId, documentId)}
      />

      <ConfirmDialog
        open={!!removeAgendaId}
        onCancel={() => setRemoveAgendaId(null)}
        onConfirm={() => {
          if (removeAgendaId) removeAgendaItem(removeAgendaId)
          setRemoveAgendaId(null)
        }}
        title="Remove agenda item?"
        description="This removes the item from the pack. Linked documents stay in the pack library but are detached from this item."
        confirmLabel="Remove"
        variant="destructive"
      />
    </div>
  )
}

function StatTile({
  label,
  value,
  hint,
  accent = 'default',
}: {
  label: string
  value: string
  hint: string
  accent?: 'default' | 'warning'
}) {
  return (
    <div className={cn('rounded-2xl border border-du-purple-200 bg-white p-5 du-card-shadow', accent === 'warning' && 'border-amber-200')}>
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-du-purple-900">{value}</p>
      <p className="mt-1 text-xs text-navy-600">{hint}</p>
    </div>
  )
}

function WorkflowStep({
  done,
  label,
  optional,
}: {
  done: boolean
  label: string
  optional?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className={cn('h-4 w-4 shrink-0', done ? 'text-du-magenta-600' : 'text-navy-300')} />
      <span className={cn('text-sm', done ? 'font-medium text-navy-800' : 'text-navy-500')}>
        {label}
        {optional && !done && <span className="text-navy-400"> (optional)</span>}
      </span>
    </div>
  )
}
