import { useApp } from '@/context/AppContext'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Input'
import { Drawer } from '@/components/ui/Drawer'
import type { ActionStatus } from '@/types'
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react'

const statusVariant = (status: ActionStatus) => {
  switch (status) {
    case 'Completed': return 'approved' as const
    case 'Overdue': return 'danger' as const
    case 'Escalated': return 'restricted' as const
    case 'Pending Review': return 'pending' as const
    default: return 'draft' as const
  }
}

export function ActionTrackingPage() {
  const { actionItems, selectedActionId, setSelectedActionId, updateActionStatus, canAccess, role } = useApp()

  const open = actionItems.filter((a) => a.status === 'Open').length
  const overdue = actionItems.filter((a) => a.status === 'Overdue').length
  const completed = actionItems.filter((a) => a.status === 'Completed').length
  const escalated = actionItems.filter((a) => a.status === 'Escalated').length

  const selected = actionItems.find((a) => a.id === selectedActionId)
  const canEdit = canAccess('edit_actions')

  return (
    <div className="space-y-6">
      {!canEdit && role === 'board_member' && (
        <div className="rounded-md border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-600">
          Read-only view. Action status changes require Secretariat role.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={Clock} label="Open" value={open} color="text-blue-600" />
        <SummaryCard icon={AlertTriangle} label="Overdue" value={overdue} color="text-red-600" />
        <SummaryCard icon={CheckCircle2} label="Completed" value={completed} color="text-teal-600" />
        <SummaryCard icon={TrendingUp} label="Escalated" value={escalated} color="text-amber-600" />
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
              <th className="px-4 py-3 font-medium text-navy-700">Status</th>
              <th className="px-4 py-3 font-medium text-navy-700"></th>
            </tr>
          </thead>
          <tbody>
            {actionItems.map((action) => (
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
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(action.status)}>{action.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedActionId(action.id)}>View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
              <p className="mt-1 text-sm text-navy-800">{selected.description}</p>
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
            </div>
            {canEdit && (
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
            )}
          </div>
        )}
      </Drawer>
    </div>
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
