import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatDate } from '@/lib/utils'
import type { CreateGovernanceActionInput } from '@/lib/actionsApi'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Drawer } from '@/components/ui/Drawer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { ActionItem, ActionStatus } from '@/types'
import { AlertTriangle, CheckCircle2, Clock, Loader2, Pencil, Plus, Trash2, TrendingUp } from 'lucide-react'

const DEFAULT_LINKED_DECISION = 'Strategic Network Investment Programme'

function actionDocumentLabel(action: ActionItem): string {
  return action.documentReferenceTitle?.trim() || '—'
}

const statusVariant = (status: ActionStatus) => {
  switch (status) {
    case 'Completed': return 'approved' as const
    case 'Overdue': return 'danger' as const
    case 'Escalated': return 'restricted' as const
    case 'Pending Review': return 'pending' as const
    default: return 'draft' as const
  }
}

function defaultDueDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

const emptyForm = (): ActionFormState => ({
  title: '',
  description: '',
  owner: '',
  dueDate: defaultDueDate(),
  priority: 'Medium',
  linkedDecision: DEFAULT_LINKED_DECISION,
  notes: '',
  documentReferenceId: '',
  status: 'Open',
})

type ActionFormState = CreateGovernanceActionInput & { status: ActionStatus }

function actionToForm(action: ActionItem): ActionFormState {
  return {
    title: action.title,
    description: action.description ?? '',
    owner: action.owner,
    dueDate: action.dueDate,
    priority: action.priority,
    linkedDecision: action.linkedDecision,
    notes: action.notes ?? '',
    documentReferenceId: action.documentReferenceId ?? '',
    status: action.status,
    linkedMeetingId: action.linkedMeetingId,
  }
}

export function ActionTrackingPage() {
  const {
    actionItems,
    actionsSource,
    governanceHealth,
    refreshActions,
    createAction,
    updateAction,
    deleteAction,
    selectedActionId,
    setSelectedActionId,
    updateActionStatus,
    canAccess,
  } = useApp()

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ActionItem | null>(null)

  const open = actionItems.filter((a) => a.status === 'Open').length
  const overdue = actionItems.filter((a) => a.status === 'Overdue').length
  const completed = actionItems.filter((a) => a.status === 'Completed').length
  const escalated = actionItems.filter((a) => a.status === 'Escalated').length

  const selected = actionItems.find((a) => a.id === selectedActionId)
  const canEdit = canAccess('edit_actions')

  const openCreate = () => {
    setFormMode('create')
    setEditingId(null)
    setForm(emptyForm())
    setFormOpen(true)
  }

  const openEdit = (action: ActionItem) => {
    setFormMode('edit')
    setEditingId(action.id)
    setForm(actionToForm(action))
    setFormOpen(true)
  }

  const closeForm = () => {
    if (submitting) return
    setFormOpen(false)
    setEditingId(null)
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.owner.trim() || !form.dueDate) return
    setSubmitting(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        owner: form.owner.trim(),
        dueDate: form.dueDate,
        priority: form.priority,
        linkedDecision: form.linkedDecision?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        documentReferenceId: form.documentReferenceId?.trim() || null,
        status: form.status,
        linkedMeetingId: form.linkedMeetingId ?? 'meeting-2026-06',
      }

      if (formMode === 'create') {
        const created = await createAction(payload)
        if (created) {
          closeForm()
          setForm(emptyForm())
          setSelectedActionId(created.id)
        }
      } else if (editingId) {
        const updated = await updateAction(editingId, payload)
        if (updated) {
          closeForm()
          setSelectedActionId(updated.id)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const requestDelete = (action: ActionItem) => {
    setPendingDelete(action)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const action = pendingDelete
    setDeletingId(action.id)
    try {
      const ok = await deleteAction(action.id)
      if (ok) {
        if (editingId === action.id) closeForm()
        setPendingDelete(null)
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {actionsSource === 'database' ? (
        <div className="rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          Live governance register · {governanceHealth?.actionCount ?? actionItems.length} action(s) in PostgreSQL
        </div>
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Showing mock actions — start Postgres (<code className="text-xs">docker compose up -d</code>) and restart the server.
          <Button variant="ghost" size="sm" className="ml-2 h-7" onClick={refreshActions}>
            Retry
          </Button>
        </div>
      )}

      {!canEdit && (
        <div className="rounded-md border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-600">
          Read-only view. Create, edit, and delete require Secretariat or Chair role.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard icon={Clock} label="Open" value={open} color="text-blue-600" />
          <SummaryCard icon={AlertTriangle} label="Overdue" value={overdue} color="text-red-600" />
          <SummaryCard icon={CheckCircle2} label="Completed" value={completed} color="text-teal-600" />
          <SummaryCard icon={TrendingUp} label="Escalated" value={escalated} color="text-amber-600" />
        </div>
        {canEdit && (
          <Button onClick={openCreate} className="shrink-0 gap-1.5">
            <Plus className="h-4 w-4" />
            New action
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border-muted bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border-muted bg-navy-50">
            <tr>
              <th className="px-4 py-3 font-medium text-navy-700">Action</th>
              <th className="px-4 py-3 font-medium text-navy-700">Owner</th>
              <th className="px-4 py-3 font-medium text-navy-700">Due Date</th>
              <th className="px-4 py-3 font-medium text-navy-700">Priority</th>
              <th className="px-4 py-3 font-medium text-navy-700">Linked Decision</th>
              <th className="hidden px-4 py-3 font-medium text-navy-700 lg:table-cell">Document</th>
              <th className="px-4 py-3 font-medium text-navy-700">Status</th>
              <th className="px-4 py-3 font-medium text-navy-700"></th>
            </tr>
          </thead>
          <tbody>
            {actionItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-navy-500">
                  No actions in the register.
                  {canEdit && ' Use New action to add one.'}
                </td>
              </tr>
            ) : (
              actionItems.map((action) => (
                <tr key={action.id} className="border-b border-navy-50 hover:bg-navy-50/50">
                  <td className="px-4 py-3 font-medium text-navy-900">{action.title}</td>
                  <td className="px-4 py-3 text-navy-600">{action.owner}</td>
                  <td className="px-4 py-3 text-navy-600">{formatDate(action.dueDate)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={action.priority === 'High' ? 'danger' : action.priority === 'Medium' ? 'pending' : 'muted'}>
                      {action.priority}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-navy-600 max-w-[180px] truncate">{action.linkedDecision}</td>
                  <td className="hidden px-4 py-3 text-navy-600 lg:table-cell max-w-[200px] truncate" title={actionDocumentLabel(action)}>
                    {actionDocumentLabel(action)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(action.status)}>{action.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedActionId(action.id)}>
                        View
                      </Button>
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(action)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={deletingId === action.id}
                            onClick={() => requestDelete(action)}
                            aria-label={`Delete ${action.title}`}
                          >
                            {deletingId === action.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Drawer
        open={formOpen}
        onClose={closeForm}
        title={formMode === 'create' ? 'New governance action' : 'Edit governance action'}
        width="xl"
      >
        <div className="space-y-4">
          <FormField label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Final vendor due diligence"
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What needs to be done?"
              rows={3}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Owner" required>
              <Input
                value={form.owner}
                onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                placeholder="e.g. Chief Financial Officer"
              />
            </FormField>
            <FormField label="Due date" required>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Priority">
              <Select
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: e.target.value as ActionFormState['priority'] }))
                }
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ActionStatus }))}
              >
                <option value="Open">Open</option>
                <option value="Overdue">Overdue</option>
                <option value="Completed">Completed</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Escalated">Escalated</option>
              </Select>
            </FormField>
          </div>

          <FormField label="Linked decision">
            <Input
              value={form.linkedDecision ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, linkedDecision: e.target.value }))}
            />
          </FormField>

          <FormField label="Document">
            <Input
              value={form.documentReferenceId ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, documentReferenceId: e.target.value }))}
              placeholder="North file ID (display name resolved automatically)"
              className="font-mono text-xs"
            />
          </FormField>

          <FormField label="Notes">
            <Textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Board condition, escalation notes, etc."
              rows={2}
            />
          </FormField>

          {actionsSource === 'mock' && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Database offline — changes appear locally only until Postgres is running.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-navy-100 pt-4">
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={submitting || !form.title.trim() || !form.owner.trim() || !form.dueDate}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : formMode === 'create' ? (
                  'Add to register'
                ) : (
                  'Save changes'
                )}
              </Button>
              <Button variant="outline" disabled={submitting} onClick={closeForm}>
                Cancel
              </Button>
            </div>
            {formMode === 'edit' && editingId && (
              <Button
                variant="outline"
                disabled={submitting || deletingId === editingId}
                className="gap-1.5 text-red-700 hover:bg-red-50 hover:text-red-800"
                onClick={() => {
                  const action = actionItems.find((a) => a.id === editingId)
                  if (action) requestDelete(action)
                }}
              >
                {deletingId === editingId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete action
              </Button>
            )}
          </div>
        </div>
      </Drawer>

      <Drawer
        open={!!selectedActionId}
        onClose={() => setSelectedActionId(null)}
        title={selected?.title ?? 'Action Detail'}
        width="lg"
      >
        {selected && (
          <div className="space-y-4">
            <Badge variant={statusVariant(selected.status)}>{selected.status}</Badge>
            <div>
              <p className="text-xs font-medium uppercase text-navy-400">Description</p>
              <p className="mt-1 text-sm text-navy-800">{selected.description || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase text-navy-400">Owner</p>
                <p className="text-sm text-navy-800">{selected.owner}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-navy-400">Due Date</p>
                <p className="text-sm text-navy-800">{formatDate(selected.dueDate)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-navy-400">Priority</p>
                <Badge variant={selected.priority === 'High' ? 'danger' : 'pending'}>{selected.priority}</Badge>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-navy-400">Linked Decision</p>
                <p className="text-sm text-navy-800">{selected.linkedDecision}</p>
              </div>
              {(selected.documentReferenceTitle || selected.documentReferenceId) && (
                <div className="col-span-2">
                  <p className="text-xs font-medium uppercase text-navy-400">Document</p>
                  <p className="text-sm text-navy-800">{actionDocumentLabel(selected)}</p>
                </div>
              )}
              {selected.notes && (
                <div className="col-span-2">
                  <p className="text-xs font-medium uppercase text-navy-400">Notes</p>
                  <p className="text-sm text-navy-800">{selected.notes}</p>
                </div>
              )}
            </div>
            {canEdit && (
              <>
                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-navy-400">Update Status</p>
                  <Select
                    value={selected.status}
                    onChange={(e) => updateActionStatus(selected.id, e.target.value as ActionStatus)}
                  >
                    <option value="Open">Open</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Escalated">Escalated</option>
                  </Select>
                  {selected.status === 'Pending Review' && (
                    <Button className="mt-3" size="sm" onClick={() => updateActionStatus(selected.id, 'Open')}>
                      Approve Draft Action
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 border-t border-navy-100 pt-4">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEdit(selected)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Edit action
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-red-700 hover:bg-red-50 hover:text-red-800"
                    disabled={deletingId === selected.id}
                    onClick={() => requestDelete(selected)}
                  >
                    {deletingId === selected.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete governance action?"
        description={
          pendingDelete ? (
            <>
              <span className="font-medium text-navy-800">&ldquo;{pendingDelete.title}&rdquo;</span> will be
              permanently removed from the register. This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete action"
        cancelLabel="Keep action"
        variant="destructive"
        loading={!!pendingDelete && deletingId === pendingDelete.id}
        onConfirm={confirmDelete}
        onCancel={() => !deletingId && setPendingDelete(null)}
      />
    </div>
  )
}

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-navy-500">
        {label}
        {required && <span className="text-du-magenta-600"> *</span>}
      </span>
      {children}
    </label>
  )
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: typeof Clock; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-5">
        <Icon className={`h-8 w-8 ${color}`} />
        <div>
          <p className="text-2xl font-semibold text-navy-900">{value}</p>
          <p className="text-xs text-navy-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
