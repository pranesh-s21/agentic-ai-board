import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { meeting } from '@/data/mockData'
import { MeetingCalendar, calendarMeetings } from '@/components/shared/MeetingCalendar'
import type { CalendarMeeting } from '@/types'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { FileText, Bot, Gavel, ChevronRight, Clock, MapPin, Users, ClipboardList, Send, Lock } from 'lucide-react'

export function MeetingsPage() {
  const {
    role,
    navigateToBoardPack,
    aiFreeMode,
    aiEnabledByAgenda,
    isPackPublished,
    activeMeeting,
    packDocuments,
    setScreen,
  } = useApp()
  const [selectedCalMeeting, setSelectedCalMeeting] = useState<CalendarMeeting | null>(
    calendarMeetings.find((m) => m.id === meeting.id) ?? null
  )

  const isMainMeeting = selectedCalMeeting?.id === meeting.id
  const displayMeeting = isMainMeeting ? activeMeeting : null

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <MeetingCalendar
            onSelectMeeting={(m) => setSelectedCalMeeting(m)}
            selectedDate={selectedCalMeeting?.date}
            selectedMeetingId={selectedCalMeeting?.id}
          />
        </div>

        <div className="xl:col-span-3 space-y-4">
          {selectedCalMeeting ? (
            <Card className="border-navy-200/80 shadow-md">
              <CardHeader className="border-b border-navy-50 bg-gradient-to-r from-white to-navy-50/30">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant={selectedCalMeeting.type === 'Board' ? 'official' : 'pending'} className="mb-2">
                      {selectedCalMeeting.type} Meeting
                    </Badge>
                    <CardTitle className="text-xl leading-snug">{selectedCalMeeting.title}</CardTitle>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-navy-500">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-teal-600" />
                        {formatDate(selectedCalMeeting.date)} · {selectedCalMeeting.time}
                        {selectedCalMeeting.endTime ? ` – ${selectedCalMeeting.endTime}` : ''}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-teal-600" />
                        {selectedCalMeeting.location}
                      </span>
                    </div>
                  </div>
                  <Badge variant={isPackPublished ? 'approved' : 'pending'}>
                    {isPackPublished ? 'Pack published' : 'In preparation'}
                  </Badge>
                </div>
              </CardHeader>
              {displayMeeting ? (
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-navy-600">
                    <Users className="h-4 w-4" />
                    {displayMeeting.agendaItems.length} agenda items
                  </div>
                  {role === 'secretariat' ? (
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => setScreen('pack_preparation')}>
                        <ClipboardList className="h-4 w-4" /> Prepare board pack
                      </Button>
                      {isPackPublished && (
                        <Button variant="outline" onClick={() => navigateToBoardPack()}>
                          Preview published pack <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ) : isPackPublished ? (
                    <Button onClick={() => navigateToBoardPack()}>
                      Open board pack <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="flex items-start gap-2 rounded-lg border border-navy-200 bg-navy-50 px-3 py-2.5">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-navy-500" />
                      <p className="text-sm text-navy-700">
                        The board pack is being prepared by Secretariat. You will be notified when materials are published.
                      </p>
                    </div>
                  )}
                </CardContent>
              ) : (
                <CardContent className="pt-5">
                  <p className="text-sm text-navy-600">
                    Materials for this session will be published to the Board pack when available.
                  </p>
                </CardContent>
              )}
            </Card>
          ) : (
            <Card className="flex h-48 items-center justify-center border-dashed">
              <p className="text-sm text-navy-400">Select a date or meeting from the calendar</p>
            </Card>
          )}
        </div>
      </div>

      {displayMeeting && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-900">Agenda</h2>
            <span className="text-sm text-navy-500">{displayMeeting.agendaItems.length} items</span>
          </div>
          <div className="grid gap-4">
            {displayMeeting.agendaItems.map((item) => {
              const itemDocs = packDocuments.filter((d) => item.documentIds.includes(d.id))
              const aiEnabled = aiEnabledByAgenda[item.id] !== false
              const isStrategic = item.id === 'agenda-1'
              const canReview = role === 'secretariat' || isPackPublished

              return (
                <Card key={item.id} className="group border-du-purple-100 transition-all hover:border-du-magenta-200 hover:du-card-shadow-lg">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-du-purple-900 text-sm font-bold text-white shadow-sm">
                            {item.order}
                          </span>
                          <h3 className="text-base font-semibold text-navy-900">{item.title}</h3>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge variant={item.status === 'Ready' ? 'approved' : item.status === 'Draft' ? 'draft' : 'pending'}>
                            {item.status}
                          </Badge>
                          {item.decisionRequired && (
                            <Badge variant="pending" className="border-gold-200 bg-gold-50 text-gold-800">
                              <Gavel className="mr-1 h-3 w-3" /> Decision Required
                            </Badge>
                          )}
                          <Badge variant={aiEnabled && !(isStrategic && aiFreeMode) ? 'approved' : 'restricted'}>
                            <Bot className="mr-1 h-3 w-3" />
                            {isStrategic && aiFreeMode ? 'AI-Free Mode' : aiEnabled ? 'AI Available' : 'AI Disabled'}
                          </Badge>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-navy-500">
                            <span>Preparation progress</span>
                            <span className="font-medium">{item.preparationProgress}%</span>
                          </div>
                          <div className="mt-1.5 h-2 rounded-full bg-navy-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-du-purple-600 to-du-magenta-500 transition-all"
                              style={{ width: `${item.preparationProgress}%` }}
                            />
                          </div>
                        </div>
                        {itemDocs.length > 0 && (
                          <div className="mt-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">Linked Documents</p>
                            <div className="flex flex-wrap gap-2">
                              {itemDocs.map((doc) => (
                                <span key={doc.id} className="inline-flex items-center gap-1.5 rounded-md border border-navy-100 bg-navy-50 px-2.5 py-1 text-xs text-navy-600">
                                  <FileText className="h-3 w-3" /> {doc.title}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {role === 'secretariat' ? (
                        <Button variant="outline" onClick={() => setScreen('pack_preparation')} className="shrink-0">
                          <Send className="h-4 w-4" /> Manage
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => navigateToBoardPack(item.id)}
                          disabled={!canReview}
                          className="shrink-0 group-hover:border-teal-300 group-hover:bg-teal-50"
                        >
                          Review <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
