import { useApp } from '@/context/AppContext'
import { meeting } from '@/data/mockData'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Bot, Ban, Shield, Lock, Crown } from 'lucide-react'

export function ChairControlsPage() {
  const {
    aiFreeMode,
    setAiFreeMode,
    aiEnabledByAgenda,
    setAiEnabledForAgenda,
    canAccess,
    role,
    restrictedSession,
    showToast,
  } = useApp()

  if (!canAccess('chair_controls')) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 py-20">
        <Lock className="mb-4 h-12 w-12 text-red-400" />
        <p className="text-lg font-medium text-red-800">Restricted</p>
        <p className="mt-1 text-sm text-red-600">Chair Controls are available to the Chair role only.</p>
        <Badge variant="restricted" className="mt-4">Current role: {role.replace('_', ' ')}</Badge>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-gold-500" />
            <CardTitle>Meeting Controls — {meeting.title}</CardTitle>
          </div>
          <CardDescription>Chair-only controls for AI governance and session management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatusCard
              label="AI Status"
              value={aiFreeMode ? 'AI-Free Mode' : 'AI Enabled'}
              variant={aiFreeMode ? 'restricted' : 'approved'}
              icon={Bot}
            />
            <StatusCard
              label="Session Mode"
              value={restrictedSession ? 'Restricted' : 'Standard'}
              variant={restrictedSession ? 'restricted' : 'default'}
              icon={Shield}
            />
            <StatusCard
              label="Agenda Items"
              value={`${meeting.agendaItems.length} items`}
              variant="default"
              icon={Crown}
            />
          </div>
        </CardContent>
      </Card>

      {restrictedSession && (
        <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <Shield className="h-5 w-5 text-red-600" />
          <p className="text-sm font-medium text-red-800">Restricted session is active. Enhanced logging and access controls apply.</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>AI Control by Agenda Item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {meeting.agendaItems.map((item) => {
            const isStrategic = item.id === 'agenda-1'
            const aiEnabled = aiEnabledByAgenda[item.id] !== false

            return (
              <div key={item.id} className="flex items-center justify-between rounded-md border border-navy-100 p-4">
                <div>
                  <p className="text-sm font-medium text-navy-900">{item.title}</p>
                  <p className="text-xs text-navy-500">
                    {isStrategic && aiFreeMode ? 'AI-Free Mode active' : aiEnabled ? 'AI enabled' : 'AI disabled'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {!isStrategic && (
                    <label className="flex items-center gap-2 text-sm text-navy-600">
                      <input
                        type="checkbox"
                        checked={aiEnabled}
                        onChange={(e) => {
                          setAiEnabledForAgenda(item.id, e.target.checked)
                          showToast(`AI ${e.target.checked ? 'enabled' : 'disabled'} for ${item.title}`)
                        }}
                        className="h-4 w-4 rounded border-navy-300"
                      />
                      AI Enabled
                    </label>
                  )}
                  {isStrategic && (
                    <label className="flex items-center gap-2 text-sm text-navy-600">
                      <input
                        type="checkbox"
                        checked={aiFreeMode}
                        onChange={(e) => {
                          setAiFreeMode(e.target.checked)
                          showToast(e.target.checked ? 'AI-Free Mode enabled' : 'AI-Free Mode disabled')
                        }}
                        className="h-4 w-4 rounded border-navy-300"
                      />
                      <Ban className="h-4 w-4 text-amber-600" />
                      AI-Free Mode
                    </label>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI-Free Mode — Strategic Network Investment Programme</CardTitle>
          <CardDescription>
            When enabled, AI follow-up, generative queries, and AI-assisted features are disabled for this agenda item across Board Pack Review and Ask Board AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${aiFreeMode ? 'bg-amber-100' : 'bg-teal-100'}`}>
                {aiFreeMode ? <Ban className="h-6 w-6 text-amber-700" /> : <Bot className="h-6 w-6 text-teal-700" />}
              </div>
              <div>
                <p className="text-sm font-medium text-navy-900">
                  {aiFreeMode ? 'AI-Free Mode is enabled' : 'AI is enabled for this item'}
                </p>
                <p className="text-xs text-navy-500">
                  {aiFreeMode
                    ? 'Directors will review materials without AI assistance for this agenda item.'
                    : 'AI briefing and follow-up queries are available.'}
                </p>
              </div>
            </div>
            <Button
              variant={aiFreeMode ? 'outline' : 'default'}
              onClick={() => {
                setAiFreeMode(!aiFreeMode)
                showToast(aiFreeMode ? 'AI-Free Mode disabled' : 'AI-Free Mode enabled')
              }}
            >
              {aiFreeMode ? 'Disable AI-Free Mode' : 'Enable AI-Free Mode'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusCard({
  label,
  value,
  variant,
  icon: Icon,
}: {
  label: string
  value: string
  variant: 'approved' | 'restricted' | 'default'
  icon: typeof Bot
}) {
  return (
    <div className="rounded-md border border-navy-100 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-navy-500" />
        <p className="text-xs font-medium uppercase text-navy-400">{label}</p>
      </div>
      <p className="mt-2 text-sm font-semibold text-navy-900">{value}</p>
      <Badge variant={variant} className="mt-2">{value}</Badge>
    </div>
  )
}
