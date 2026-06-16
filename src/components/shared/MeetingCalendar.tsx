import { useMemo, useState } from 'react'
import { calendarMeetings } from '@/data/mockData'
import type { CalendarMeeting } from '@/types'
import { cn, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return { year: y, month: m - 1, day: d }
}

function getMeetingsForDate(dateKey: string) {
  return calendarMeetings.filter((m) => m.date === dateKey)
}

const typeColors: Record<CalendarMeeting['type'], string> = {
  Board: 'bg-du-purple-700',
  Committee: 'bg-du-magenta-500',
  Preparation: 'bg-du-cyan-500',
}

interface MeetingCalendarProps {
  compact?: boolean
  onSelectMeeting?: (meeting: CalendarMeeting) => void
  selectedDate?: string
  onDateSelect?: (dateKey: string) => void
  className?: string
}

export function MeetingCalendar({
  compact = false,
  onSelectMeeting,
  selectedDate: controlledDate,
  onDateSelect,
  className,
}: MeetingCalendarProps) {
  const initial = parseDateKey('2026-06-18')
  const [viewYear, setViewYear] = useState(initial.year)
  const [viewMonth, setViewMonth] = useState(initial.month)
  const [internalSelected, setInternalSelected] = useState('2026-06-18')

  const selectedDate = controlledDate ?? internalSelected

  const handleDateSelect = (dateKey: string) => {
    if (onDateSelect) onDateSelect(dateKey)
    else setInternalSelected(dateKey)
  }

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const lastDay = new Date(viewYear, viewMonth + 1, 0)
    const startOffset = (firstDay.getDay() + 6) % 7
    const days: { day: number; dateKey: string; inMonth: boolean }[] = []

    const prevMonthLast = new Date(viewYear, viewMonth, 0).getDate()
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = prevMonthLast - i
      const m = viewMonth === 0 ? 11 : viewMonth - 1
      const y = viewMonth === 0 ? viewYear - 1 : viewYear
      days.push({ day, dateKey: toDateKey(y, m, day), inMonth: false })
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({ day: d, dateKey: toDateKey(viewYear, viewMonth, d), inMonth: true })
    }

    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1
      const y = viewMonth === 11 ? viewYear + 1 : viewYear
      days.push({ day: d, dateKey: toDateKey(y, m, d), inMonth: false })
    }

    return days
  }, [viewYear, viewMonth])

  const selectedMeetings = getMeetingsForDate(selectedDate)
  const todayKey = '2026-06-04'

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else setViewMonth((m) => m - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else setViewMonth((m) => m + 1)
  }

  return (
    <Card className={cn('overflow-hidden du-card-shadow border-du-purple-100', className)}>
      <CardHeader className={cn('border-b border-du-purple-100 bg-du-gradient-soft', compact ? 'py-3' : 'py-4')}>
        <div className="flex items-center justify-between">
          <CardTitle className={compact ? 'text-sm' : 'text-base'}>Meeting Calendar</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[130px] text-center text-sm font-semibold text-navy-900">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn('p-0', compact ? '' : '')}>
        <div className="grid grid-cols-7 border-b border-navy-100 bg-navy-50/50">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-[11px] font-bold uppercase tracking-wider text-navy-600">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map(({ day, dateKey, inMonth }) => {
            const dayMeetings = getMeetingsForDate(dateKey)
            const isSelected = dateKey === selectedDate
            const isToday = dateKey === todayKey

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => handleDateSelect(dateKey)}
                className={cn(
                  'relative flex min-h-[52px] flex-col items-center border-b border-r border-navy-50 p-1.5 transition-colors hover:bg-teal-50/40',
                  !inMonth && 'bg-navy-50/30',
                  isSelected && 'bg-du-magenta-50 ring-2 ring-inset ring-du-magenta-400/40',
                  compact && 'min-h-[44px]'
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
                    !inMonth && 'text-navy-300',
                    inMonth && 'text-navy-800 font-medium',
                    isToday && 'du-gradient text-white shadow-sm',
                    isSelected && !isToday && 'bg-du-magenta-500 text-white shadow-sm'
                  )}
                >
                  {day}
                </span>
                {dayMeetings.length > 0 && (
                  <div className="mt-0.5 flex gap-0.5">
                    {dayMeetings.slice(0, 3).map((m) => (
                      <span key={m.id} className={cn('h-1.5 w-1.5 rounded-full', typeColors[m.type])} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {!compact && (
          <div className="border-t border-navy-100 bg-white p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-navy-600">
              {formatDate(selectedDate)}
            </p>
            {selectedMeetings.length === 0 ? (
              <p className="rounded-md border border-dashed border-navy-300 py-6 text-center text-sm font-medium text-navy-600">
                No meetings scheduled
              </p>
            ) : (
              <div className="space-y-2">
                {selectedMeetings.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectMeeting?.(m)}
                    className="w-full rounded-lg border border-navy-100 p-3 text-left transition-all hover:border-teal-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-navy-900">{m.title}</p>
                      <Badge variant={m.type === 'Board' ? 'official' : m.type === 'Committee' ? 'approved' : 'pending'}>
                        {m.type}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium text-navy-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {m.time}{m.endTime ? ` – ${m.endTime}` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {m.location}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-3 border-t border-navy-50 pt-3">
              {(['Board', 'Committee', 'Preparation'] as const).map((type) => (
                <div key={type} className="flex items-center gap-1.5 text-xs font-medium text-navy-600">
                  <span className={cn('h-2 w-2 rounded-full', typeColors[type])} />
                  {type}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { calendarMeetings, getMeetingsForDate }
