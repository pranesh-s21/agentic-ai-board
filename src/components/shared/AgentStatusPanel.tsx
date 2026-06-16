import { cn } from '@/lib/utils'
import { agentStatuses } from '@/data/mockData'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Bot, Info } from 'lucide-react'

export function AgentStatusPanel({ className }: { className?: string }) {
  const modeVariant = (mode: string) => {
    switch (mode) {
      case 'Read-only':
        return 'default' as const
      case 'Supervised':
        return 'pending' as const
      case 'Paused':
        return 'muted' as const
      default:
        return 'approved' as const
    }
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'Success':
        return 'approved' as const
      case 'Pending':
        return 'pending' as const
      default:
        return 'danger' as const
    }
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-navy-600" />
          <CardTitle>Agent & Workflow Status</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {agentStatuses.map((agent) => (
          <div key={agent.id} className="flex items-center justify-between rounded-md border border-navy-100 p-3">
            <div>
              <p className="text-sm font-medium text-navy-900">{agent.name}</p>
              <p className="text-xs text-navy-500">Last run: {formatDateTime(agent.lastRun)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={modeVariant(agent.mode)}>{agent.mode}</Badge>
              <Badge variant={statusVariant(agent.lastStatus)}>{agent.lastStatus}</Badge>
              {agent.pendingApprovals > 0 && (
                <Badge variant="pending">{agent.pendingApprovals} HITL</Badge>
              )}
            </div>
          </div>
        ))}
        <div className="flex items-start gap-2 rounded-md bg-navy-50 p-3 text-xs text-navy-600">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Deep agent configuration remains in North Admin.</span>
        </div>
      </CardContent>
    </Card>
  )
}
