import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import {
  calendarMeetings,
  calendarMeetingHasBoardPack,
  MEETING_ID,
  resolveCalendarMeetingDisplay,
} from '@/data/mockData'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { AgentStatusPanel } from '@/components/shared/AgentStatusPanel'
import { MeetingCalendar, getMeetingsForDate } from '@/components/shared/MeetingCalendar'
import type { ActionItem, AgendaItem, CalendarMeeting } from '@/types'
import {
  Calendar,
  FolderOpen,
  MessageSquare,
  CheckCircle2,
  Clock,
  Shield,
  ClipboardList,
  ChevronRight,
  Gavel,
  FileText,
  MapPin,
  Bot,
  AlertTriangle,
  Lock,
} from 'lucide-react'

export function DashboardPage() {
  const {
    role,
    setScreen,
    navigateToBoardPack,
    actionItems,
    reviewItems,
    aiFreeMode,
    aiEnabledByAgenda,
    canAccess,
    setSelectedActionId,
    packDocuments,
    isPackPublished,
    activeMeeting,
    boardCommunication,
  } = useApp()

  const defaultCalMeeting =
    calendarMeetings.find((m) => m.id === MEETING_ID) ?? calendarMeetings[0]
  const [selectedCalMeeting, setSelectedCalMeeting] = useState<CalendarMeeting>(defaultCalMeeting)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(defaultCalMeeting.date)

  const activeMeetingDisplay = resolveCalendarMeetingDisplay(selectedCalMeeting)
  const hasBoardPack = calendarMeetingHasBoardPack(selectedCalMeeting, isPackPublished)
  const displayMeeting = selectedCalMeeting.id === MEETING_ID ? activeMeeting : activeMeetingDisplay

  const handleCalendarDateSelect = (dateKey: string) => {
    setSelectedCalendarDate(dateKey)
    const dayMeetings = getMeetingsForDate(dateKey)
    if (dayMeetings.length > 0) {
      setSelectedCalMeeting(dayMeetings[0])
    }
  }

  const handleCalendarMeetingSelect = (cal: CalendarMeeting) => {
    setSelectedCalMeeting(cal)
    setSelectedCalendarDate(cal.date)
  }

  const meetingActions = actionItems.filter((a) => {
    if (!hasBoardPack) return false
    return a.linkedMeetingId === MEETING_ID || a.linkedDecision.includes('Strategic Network')
  })
  const openActions = meetingActions.filter((a) => a.status === 'Open' || a.status === 'Overdue' || a.status === 'Escalated')
  const overdueCount = meetingActions.filter((a) => a.status === 'Overdue').length
  const pendingReviews = reviewItems.filter((r) => r.status === 'Pending Review').length
  const readyAgenda = displayMeeting.agendaItems.filter((a) => a.status === 'Ready').length

  const upcomingEvents = [...calendarMeetings]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((m) => m.date >= '2026-06-04')
    .slice(0, 4)

  return (
    <div className="w-full space-y-5">
      {/* Hero row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden border-l-4 border-l-du-magenta-600 p-0">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-du-magenta-600">
                  {selectedCalMeeting.type === 'Board' ? 'Upcoming Board Meeting' : `${selectedCalMeeting.type} Session`}
                </p>
                <h2 className="mt-2 text-2xl font-bold leading-tight text-du-purple-900">{displayMeeting.title}</h2>
                <p className="mt-1 text-sm font-medium text-navy-600">
                  {formatDate(displayMeeting.date)} · {displayMeeting.location}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MiniStat icon={Calendar} label="Agenda items" value={String(displayMeeting.agendaItems.length)} />
                  <MiniStat
                    icon={FolderOpen}
                    label={role === 'secretariat' ? 'Pack readiness' : 'Pack status'}
                    value={
                      role === 'board_member' && !isPackPublished
                        ? 'Awaiting'
                        : displayMeeting.agendaItems.length
                          ? `${Math.round(
                              displayMeeting.agendaItems.reduce((n, i) => n + i.preparationProgress, 0) /
                                displayMeeting.agendaItems.length
                            )}%`
                          : '—'
                    }
                  />
                  <MiniStat icon={MessageSquare} label="AI briefing" value={aiFreeMode ? 'AI-Free' : 'Available'} />
                </div>
              </div>
              <Badge variant={isPackPublished ? 'approved' : 'pending'} className="shrink-0">
                {isPackPublished ? 'Pack published' : 'In preparation'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Decision Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-navy-700">
              Approve the Strategic Network Investment Programme subject to final vendor due diligence, quarterly risk reporting, and Audit Committee review.
            </p>
            <Badge variant="draft" className="mt-3">Pending Board Decision</Badge>
            <Button size="sm" className="mt-4 w-full" onClick={() => role === 'secretariat' ? setScreen('pack_preparation') : navigateToBoardPack(hasBoardPack ? 'agenda-1' : undefined)} disabled={role === 'board_member' && !hasBoardPack}>
              {role === 'secretariat'
                ? 'Prepare board pack'
                : hasBoardPack
                  ? 'Open decision pack'
                  : 'Board pack not yet published'}{' '}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Clock} label="Open actions" value={openActions.length} onClick={() => setScreen('action_tracking')} />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdueCount} accent={overdueCount > 0 ? 'danger' : 'default'} onClick={() => setScreen('action_tracking')} />
        {role === 'secretariat' ? (
          <StatCard icon={ClipboardList} label="Pending reviews" value={pendingReviews} onClick={() => setScreen('secretariat_review')} />
        ) : (
          <StatCard icon={ClipboardList} label="My draft questions" value={1} onClick={() => setScreen('private_workspace')} />
        )}
        <StatCard icon={CheckCircle2} label="Agenda ready" value={readyAgenda} suffix={`/ ${displayMeeting.agendaItems.length}`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-4">
        <div className="space-y-5 xl:col-span-3">
          {/* Meeting agenda — primary focus */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Meeting Agenda</CardTitle>
                <CardDescription>
                  {displayMeeting.agendaItems.length} items · {formatDate(displayMeeting.date)}
                  {selectedCalMeeting.title !== displayMeeting.title ? ` · ${selectedCalMeeting.title}` : ''}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setScreen('meetings')}>
                Full meeting view
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {displayMeeting.agendaItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-navy-500">No agenda published for this session yet.</p>
              ) : (
                displayMeeting.agendaItems.map((item) => (
                  <AgendaRow
                    key={item.id}
                    item={item}
                    docCount={packDocuments.filter((d) => item.documentIds.includes(d.id)).length}
                    aiFreeMode={aiFreeMode && item.id === 'agenda-1'}
                    aiEnabled={aiEnabledByAgenda[item.id] !== false}
                    onReview={() => hasBoardPack && navigateToBoardPack(item.id)}
                    reviewDisabled={!hasBoardPack}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Open actions */}
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Open Actions</CardTitle>
                  <CardDescription>Linked to this meeting programme</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setScreen('action_tracking')}>
                  View all
                </Button>
              </CardHeader>
              <CardContent>
                {openActions.length === 0 ? (
                  <p className="py-4 text-center text-sm font-medium text-navy-600">No open actions for this meeting.</p>
                ) : (
                  <div className="space-y-2">
                    {openActions.map((action) => (
                      <ActionRow
                        key={action.id}
                        action={action}
                        onClick={() => {
                          setSelectedActionId(action.id)
                          setScreen('action_tracking')
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Role-specific or preparation */}
            {role === 'board_member' && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Preparation</CardTitle>
                  <CardDescription>Private to You</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <PrepItem label="Board pack reviewed" done />
                  <PrepItem label="AI briefing reviewed" done />
                  <PrepItem label="Draft questions prepared" done />
                  <PrepItem label="Prior decisions compared" done={false} />
                  <PrepItem label="Open actions reviewed" done={openActions.length <= 2} />
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setScreen('private_workspace')}>
                    Open Private Workspace
                  </Button>
                </CardContent>
              </Card>
            )}

            {role === 'board_member' && boardCommunication.status === 'published' && (
              <Card className="border-du-cyan-200 bg-du-cyan-50/30">
                <CardHeader>
                  <CardTitle>Board communication</CardTitle>
                  <CardDescription>Published by Secretariat</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm font-semibold text-navy-900">{boardCommunication.title}</p>
                  <p className="text-sm leading-relaxed text-navy-700">{boardCommunication.summary}</p>
                </CardContent>
              </Card>
            )}

            {role === 'secretariat' && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Queue</CardTitle>
                  <CardDescription>Pending Secretariat Review</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {reviewItems.filter((r) => r.status === 'Pending Review').map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl border border-navy-200 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-du-purple-900">{item.title}</p>
                        <Badge variant="ai" className="mt-1">AI-Assisted Draft</Badge>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setScreen('secretariat_review')}>Review</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {role === 'chair' && (
              <Card>
                <CardHeader><CardTitle>Meeting Controls</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <ControlRow label="AI-Free Mode" badge={aiFreeMode ? 'Enabled' : 'Disabled'} variant={aiFreeMode ? 'restricted' : 'approved'} />
                  <ControlRow label="Restricted Session" badge="Not Active" variant="muted" />
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setScreen('chair_controls')}>
                    Open Chair Controls
                  </Button>
                </CardContent>
              </Card>
            )}

            {role === 'governance' && canAccess('governance_audit') && (
              <Card>
                <CardHeader><CardTitle>Compliance Snapshot</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <ComplianceItem label="Source-cited answers" count={12} status="good" />
                  <ComplianceItem label="Drafts pending review" count={pendingReviews} status="warning" />
                  <ComplianceItem label="Approved records" count={3} status="good" />
                  <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => setScreen('governance')}>
                    Open Governance
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Upcoming meetings this cycle */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Upcoming Meetings & Sessions</CardTitle>
                <CardDescription>Board and committee calendar</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setScreen('meetings')}>Calendar</Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className={`rounded-xl border p-4 ${evt.id === MEETING_ID ? 'border-du-magenta-300 bg-du-magenta-50/40' : 'border-navy-200 bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant={evt.type === 'Board' ? 'official' : evt.type === 'Committee' ? 'approved' : 'muted'}>
                        {evt.type}
                      </Badge>
                      {evt.id === MEETING_ID && <Badge variant="draft">Current pack</Badge>}
                    </div>
                    <p className="mt-2 text-sm font-bold text-du-purple-900">{evt.title}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-navy-600">
                      <Clock className="h-3 w-3" />
                      {formatDate(evt.date)} · {evt.time}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-navy-600">
                      <MapPin className="h-3 w-3" />
                      {evt.location}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {role === 'governance' && canAccess('governance_audit') && (
            <AgentStatusPanel />
          )}

          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {role === 'secretariat' ? (
                <>
                  <Button onClick={() => setScreen('pack_preparation')}><FolderOpen className="h-4 w-4" /> Prepare Board Pack</Button>
                  <Button variant="outline" onClick={() => setScreen('secretariat_review')}><ClipboardList className="h-4 w-4" /> Review Queue</Button>
                  <Button variant="outline" onClick={() => setScreen('action_tracking')}><Clock className="h-4 w-4" /> Action Register</Button>
                </>
              ) : (
                <>
                  <Button onClick={() => navigateToBoardPack()} disabled={!isPackPublished}><FolderOpen className="h-4 w-4" /> Open Board Pack</Button>
                  <Button variant="outline" onClick={() => setScreen('ask_ai')}><MessageSquare className="h-4 w-4" /> Ask Board AI</Button>
                  <Button variant="outline" onClick={() => setScreen('private_workspace')}><Lock className="h-4 w-4" /> Private Workspace</Button>
                </>
              )}
              <Button variant="outline" onClick={() => setScreen('decision_memory')}><Shield className="h-4 w-4" /> Prior Decisions</Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <MeetingCalendar
            compact
            selectedDate={selectedCalendarDate}
            selectedMeetingId={selectedCalMeeting.id}
            onDateSelect={handleCalendarDateSelect}
            onSelectMeeting={handleCalendarMeetingSelect}
          />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Meeting Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeMeeting.agendaItems.length === 0 ? (
                <p className="text-xs text-navy-500">Select a meeting with a published agenda.</p>
              ) : (
                activeMeeting.agendaItems.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between text-xs font-semibold text-navy-700">
                    <span className="truncate pr-2">{item.order}. {item.title.split(' ').slice(0, 3).join(' ')}…</span>
                    <span>{item.preparationProgress}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-navy-100">
                    <div
                      className="h-full rounded-full bg-du-magenta-600 transition-all"
                      style={{ width: `${item.preparationProgress}%` }}
                    />
                  </div>
                </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function AgendaRow({
  item,
  docCount,
  aiFreeMode,
  aiEnabled,
  onReview,
  reviewDisabled,
}: {
  item: AgendaItem
  docCount: number
  aiFreeMode: boolean
  aiEnabled: boolean
  onReview: () => void
  reviewDisabled?: boolean
}) {
  const statusVariant = item.status === 'Ready' ? 'approved' : item.status === 'Draft' ? 'draft' : 'pending'

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-navy-200 p-4 transition-colors hover:border-du-magenta-200 hover:bg-du-purple-50/30">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-du-purple-900 text-sm font-bold text-white">
        {item.order}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-du-purple-900">{item.title}</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <Badge variant={statusVariant}>{item.status}</Badge>
          {item.decisionRequired && (
            <Badge variant="draft" className="gap-1"><Gavel className="h-3 w-3" /> Decision</Badge>
          )}
          <Badge variant={aiFreeMode ? 'restricted' : aiEnabled ? 'approved' : 'muted'}>
            <Bot className="mr-1 h-3 w-3" />
            {aiFreeMode ? 'AI-Free' : aiEnabled ? 'AI on' : 'AI off'}
          </Badge>
          {docCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-600">
              <FileText className="h-3 w-3" /> {docCount} docs
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 max-w-[200px] rounded-full bg-navy-100">
            <div className="h-full rounded-full bg-du-magenta-600" style={{ width: `${item.preparationProgress}%` }} />
          </div>
          <span className="text-xs font-semibold text-navy-600">{item.preparationProgress}% prepared</span>
        </div>
      </div>
      <Button variant="outline" size="sm" className="shrink-0" onClick={onReview} disabled={reviewDisabled}>
        Review <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

function ActionRow({ action, onClick }: { action: ActionItem; onClick: () => void }) {
  const statusVariant =
    action.status === 'Overdue' ? 'danger' : action.status === 'Escalated' ? 'restricted' : action.status === 'Open' ? 'pending' : 'muted'

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-navy-200 p-3 text-left transition-colors hover:border-du-magenta-200 hover:bg-du-purple-50/30"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-du-purple-900">{action.title}</p>
        <p className="mt-0.5 text-xs font-medium text-navy-600">
          {action.owner} · Due {formatDate(action.dueDate)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={action.priority === 'High' ? 'danger' : 'muted'}>{action.priority}</Badge>
        <Badge variant={statusVariant}>{action.status}</Badge>
      </div>
    </button>
  )
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-navy-200 bg-navy-50 px-4 py-3">
      <Icon className="mb-2 h-5 w-5 text-du-magenta-600" />
      <p className="text-[11px] font-bold uppercase text-navy-600">{label}</p>
      <p className="text-sm font-bold text-du-purple-900">{value}</p>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  accent = 'default',
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  suffix?: string
  accent?: 'default' | 'danger'
  onClick?: () => void
}) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-2xl border border-du-purple-200 bg-surface-elevated du-card-shadow transition-all ${onClick ? 'cursor-pointer hover:border-du-magenta-300 hover:du-card-shadow-lg text-left w-full' : ''}`}
    >
      <div className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent === 'danger' ? 'bg-red-50' : 'du-gradient-soft'}`}>
          <Icon className={`h-5 w-5 ${accent === 'danger' ? 'text-red-600' : 'text-du-magenta-600'}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-du-purple-900">
            {value}{suffix && <span className="text-base font-semibold text-navy-600">{suffix}</span>}
          </p>
          <p className="text-xs font-semibold text-navy-600">{label}</p>
        </div>
      </div>
    </Wrapper>
  )
}
function PrepItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className={`h-4 w-4 ${done ? 'text-du-magenta-600' : 'text-navy-300'}`} />
      <span className={`text-sm font-medium ${done ? 'text-navy-800' : 'text-navy-500'}`}>{label}</span>
    </div>
  )
}

function ControlRow({ label, badge, variant }: { label: string; badge: string; variant: 'approved' | 'restricted' | 'muted' }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-navy-200 p-3">
      <span className="text-sm font-medium text-navy-700">{label}</span>
      <Badge variant={variant}>{badge}</Badge>
    </div>
  )
}

function ComplianceItem({ label, count, status }: { label: string; count: number; status: 'good' | 'warning' | 'danger' }) {
  const colors = { good: 'text-du-cyan-700', warning: 'text-du-magenta-600', danger: 'text-red-700' }
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-navy-700">{label}</span>
      <span className={`text-sm font-bold ${colors[status]}`}>{count}</span>
    </div>
  )
}
