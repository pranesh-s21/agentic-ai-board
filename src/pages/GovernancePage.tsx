import { useApp } from '@/context/AppContext'
import { auditEvents } from '@/data/mockData'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { AgentStatusPanel } from '@/components/shared/AgentStatusPanel'
import { Lock, Shield, FileText, AlertTriangle, Bot, CheckCircle2 } from 'lucide-react'

export function GovernancePage() {
  const { canAccess, role, reviewItems: liveReviewItems } = useApp()

  if (!canAccess('governance_audit')) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 py-20">
        <Lock className="mb-4 h-12 w-12 text-red-400" />
        <p className="text-lg font-medium text-red-800">Restricted</p>
        <p className="mt-1 text-sm text-red-600">Governance audit summary is available to Governance User and Chair roles.</p>
        <Badge variant="restricted" className="mt-4">Current role: {role.replace('_', ' ')}</Badge>
      </div>
    )
  }

  const pendingReviews = liveReviewItems.filter((r) => r.status === 'Pending Review').length
  const approvedRecords = liveReviewItems.filter((r) => r.status === 'Approved').length
  const restrictedAttempts = auditEvents.filter((e) => e.status === 'Restricted').length
  const pendingAgentActions = auditEvents.filter((e) => e.status === 'Pending').length

  const statusVariant = (status: string) => {
    switch (status) {
      case 'Success': return 'approved' as const
      case 'Approved': return 'official' as const
      case 'Pending': return 'pending' as const
      case 'Restricted': return 'restricted' as const
      default: return 'default' as const
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard icon={FileText} label="Source-Cited Answers" value={12} />
        <MetricCard icon={AlertTriangle} label="Drafts Pending Review" value={pendingReviews} />
        <MetricCard icon={CheckCircle2} label="Approved Records" value={approvedRecords} />
        <MetricCard icon={Lock} label="Restricted Access Attempts" value={restrictedAttempts} />
        <MetricCard icon={Bot} label="Agent Actions Requiring Approval" value={pendingAgentActions} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-600" />
              <CardTitle>Compliance Indicators</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ComplianceRow label="All AI outputs source-cited" status="Compliant" />
            <ComplianceRow label="Secretariat review workflow active" status="Compliant" />
            <ComplianceRow label="Decision records integrity" status="Verified" />
            <ComplianceRow label="Retention policy adherence" status="Compliant" />
            <ComplianceRow label="Restricted access logging" status="Active" />
          </CardContent>
        </Card>

        <AgentStatusPanel />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Event Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-muted bg-navy-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-navy-700">Timestamp</th>
                  <th className="px-4 py-3 font-medium text-navy-700">User</th>
                  <th className="px-4 py-3 font-medium text-navy-700">Action</th>
                  <th className="px-4 py-3 font-medium text-navy-700">Object</th>
                  <th className="px-4 py-3 font-medium text-navy-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {auditEvents.map((event) => (
                  <tr key={event.id} className="border-b border-navy-50 hover:bg-navy-50/50">
                    <td className="px-4 py-3 text-navy-600 whitespace-nowrap">{formatDateTime(event.timestamp)}</td>
                    <td className="px-4 py-3 text-navy-800">{event.user}</td>
                    <td className="px-4 py-3 text-navy-700">{event.action}</td>
                    <td className="px-4 py-3 text-navy-600 max-w-[200px] truncate">{event.object}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(event.status)}>{event.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Approval History</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {auditEvents
              .filter((e) => e.status === 'Approved' || e.action.includes('approved'))
              .map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-md border border-navy-100 p-3 text-sm">
                  <span className="text-navy-800">{event.action} — {event.object}</span>
                  <span className="text-navy-500">{formatDateTime(event.timestamp)}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <Icon className="mb-2 h-5 w-5 text-navy-500" />
        <p className="text-2xl font-semibold text-navy-900">{value}</p>
        <p className="text-xs text-navy-500">{label}</p>
      </CardContent>
    </Card>
  )
}

function ComplianceRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-navy-700">{label}</span>
      <Badge variant="approved">{status}</Badge>
    </div>
  )
}
