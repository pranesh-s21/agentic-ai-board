import { useApp } from '@/context/AppContext'
import { ROLE_LABELS, SCREEN_LABELS, type UserRole } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Input'
import { Bell, ShieldCheck, User } from 'lucide-react'
import { meeting } from '@/data/mockData'
import { formatDate } from '@/lib/utils'

export function Header() {
  const { role, setRole, screen, aiFreeMode } = useApp()

  return (
    <header className="flex h-[4.5rem] shrink-0 items-center justify-between border-b border-du-purple-100 bg-white px-6 shadow-sm">
      <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-du-purple-900">
            {SCREEN_LABELS[screen]}
          </h1>
          <p className="text-xs font-medium text-navy-600">
            {meeting.title} · {formatDate(meeting.date)}
          </p>
        </div>
      <div className="flex items-center gap-3">
        {aiFreeMode && (
          <Badge variant="restricted" className="hidden sm:inline-flex">
            AI-Free Mode Active
          </Badge>
        )}
        <div className="hidden items-center gap-2 rounded-full border border-du-cyan-200 bg-du-cyan-50 px-3 py-1.5 md:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-du-cyan-600" />
          <span className="text-xs font-semibold text-du-cyan-700">Secure Session</span>
        </div>
        <button
          type="button"
          className="relative rounded-xl p-2.5 text-du-purple-400 transition-colors hover:bg-du-purple-50 hover:text-du-purple-700"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-du-magenta-500 ring-2 ring-white" />
        </button>
        <div className="flex items-center gap-2">
          <Select
            id="role-select"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="hidden h-9 w-40 border-du-purple-200 sm:flex"
          >
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-du-magenta-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-du-magenta-700 hover:shadow-md"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{ROLE_LABELS[role]}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
