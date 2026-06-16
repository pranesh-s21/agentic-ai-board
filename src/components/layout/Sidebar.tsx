import { cn } from '@/lib/utils'
import { useApp } from '@/context/AppContext'
import { DuLogo } from '@/components/brand/DuLogo'
import { SCREEN_LABELS, type Screen } from '@/types'
import {
  LayoutDashboard,
  Calendar,
  FolderOpen,
  MessageSquare,
  Lock,
  History,
  CheckSquare,
  ClipboardCheck,
  Crown,
  Shield,
} from 'lucide-react'

const mainNav: { screen: Screen; icon: typeof LayoutDashboard }[] = [
  { screen: 'dashboard', icon: LayoutDashboard },
  { screen: 'meetings', icon: Calendar },
  { screen: 'board_pack', icon: FolderOpen },
  { screen: 'ask_ai', icon: MessageSquare },
  { screen: 'private_workspace', icon: Lock },
]

const recordsNav: { screen: Screen; icon: typeof History }[] = [
  { screen: 'decision_memory', icon: History },
  { screen: 'action_tracking', icon: CheckSquare },
]

const adminNav: { screen: Screen; icon: typeof ClipboardCheck; restricted?: string }[] = [
  { screen: 'secretariat_review', icon: ClipboardCheck, restricted: 'secretariat_review' },
  { screen: 'chair_controls', icon: Crown, restricted: 'chair_controls' },
  { screen: 'governance', icon: Shield, restricted: 'governance_audit' },
]

function NavSection({
  label,
  items,
  screen,
  setScreen,
  canAccess,
}: {
  label: string
  items: { screen: Screen; icon: typeof LayoutDashboard; restricted?: string }[]
  screen: Screen
  setScreen: (s: Screen) => void
  canAccess: (f: string) => boolean
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-navy-500">{label}</p>
      <ul className="space-y-0.5">
        {items.map(({ screen: navScreen, icon: Icon, restricted }) => {
          const isRestricted = !!(restricted && !canAccess(restricted))
          const isActive = screen === navScreen

          return (
            <li key={navScreen}>
              <button
                type="button"
                onClick={() => !isRestricted && setScreen(navScreen)}
                disabled={isRestricted}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-du-magenta-600 text-white shadow-sm'
                    : isRestricted
                      ? 'cursor-not-allowed text-navy-300'
                      : 'text-navy-700 hover:bg-du-purple-50 hover:text-du-purple-900'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{SCREEN_LABELS[navScreen]}</span>
                {isRestricted && (
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-navy-300">Locked</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Sidebar() {
  const { screen, setScreen, canAccess } = useApp()

  return (
    <aside className="flex w-[17.5rem] shrink-0 flex-col border-r border-navy-200 bg-white">
      <div className="border-b border-navy-200 px-5 py-5">
        <DuLogo size="md" />
      </div>
      <nav className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        <NavSection label="Workspace" items={mainNav} screen={screen} setScreen={setScreen} canAccess={canAccess} />
        <NavSection label="Records" items={recordsNav} screen={screen} setScreen={setScreen} canAccess={canAccess} />
        <NavSection label="Governance" items={adminNav} screen={screen} setScreen={setScreen} canAccess={canAccess} />
      </nav>
      <div className="border-t border-navy-200 bg-du-purple-50 p-4">
        <p className="text-[11px] font-medium leading-relaxed text-navy-600">
          Secure Board environment. All activity is logged for governance purposes.
        </p>
      </div>
    </aside>
  )
}
