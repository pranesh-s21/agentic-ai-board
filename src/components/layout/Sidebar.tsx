import { cn } from '@/lib/utils'
import { useApp } from '@/context/AppContext'
import { DuLogo } from '@/components/brand/DuLogo'
import { SCREEN_LABELS, type Screen } from '@/types'
import { getNavForRole } from '@/config/roleNavigation'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

function NavSection({
  label,
  items,
  screen,
  setScreen,
  canAccess,
  badges,
  collapsed,
}: {
  label: string
  items: { screen: Screen; icon: typeof PanelLeftClose; restricted?: string }[]
  screen: Screen
  setScreen: (s: Screen) => void
  canAccess: (f: string) => boolean
  badges?: Partial<Record<Screen, number>>
  collapsed: boolean
}) {
  return (
    <div className={cn('mb-5', collapsed && 'mb-3')}>
      {!collapsed && (
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-navy-500">{label}</p>
      )}
      <ul className="space-y-0.5">
        {items.map(({ screen: navScreen, icon: Icon, restricted }) => {
          const isRestricted = !!(restricted && !canAccess(restricted))
          const isActive = screen === navScreen
          const labelText = SCREEN_LABELS[navScreen]

          return (
            <li key={navScreen}>
              <button
                type="button"
                title={collapsed ? labelText : undefined}
                onClick={() => !isRestricted && setScreen(navScreen)}
                disabled={isRestricted}
                className={cn(
                  'flex w-full items-center rounded-xl text-sm font-semibold transition-all',
                  collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                  isActive
                    ? 'bg-du-magenta-600 text-white shadow-sm'
                    : isRestricted
                      ? 'cursor-not-allowed text-navy-300'
                      : 'text-navy-700 hover:bg-du-purple-50 hover:text-du-purple-900'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{labelText}</span>}
                {!collapsed && badges?.[navScreen] != null && (
                  <span className="ml-auto rounded-full bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800">
                    {badges[navScreen]}
                  </span>
                )}
                {!collapsed && isRestricted && navScreen === 'board_pack' && (
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-navy-300">Draft</span>
                )}
                {!collapsed && isRestricted && navScreen !== 'board_pack' && (
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
  const { role, screen, setScreen, canAccess, reviewItems, sidebarCollapsed, toggleSidebar } = useApp()
  const navSections = getNavForRole(role)
  const pendingReviews = reviewItems.filter((r) => r.status === 'Pending Review').length

  const badges: Partial<Record<Screen, number>> = {}
  if (role === 'secretariat' && pendingReviews > 0) {
    badges.secretariat_review = pendingReviews
  }

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-navy-200 bg-white transition-[width] duration-200 ease-in-out',
        sidebarCollapsed ? 'w-[4.25rem]' : 'w-[17.5rem]'
      )}
    >
      <div
        className={cn(
          'flex items-center border-b border-navy-200',
          sidebarCollapsed ? 'justify-center px-2 py-4' : 'justify-between px-5 py-5'
        )}
      >
        {sidebarCollapsed ? (
          <DuLogo size="sm" variant="mark" />
        ) : (
          <DuLogo size="md" />
        )}
        {!sidebarCollapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-700"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>
      <nav className={cn('flex-1 overflow-y-auto scrollbar-thin', sidebarCollapsed ? 'p-2' : 'p-3')}>
        {navSections.map((section) => (
          <NavSection
            key={section.label}
            label={section.label}
            items={section.items}
            screen={screen}
            setScreen={setScreen}
            canAccess={canAccess}
            badges={badges}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>
      <div className={cn('border-t border-navy-200 bg-du-purple-50', sidebarCollapsed ? 'p-2' : 'p-4')}>
        {sidebarCollapsed ? (
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex w-full items-center justify-center rounded-lg p-2 text-navy-500 transition-colors hover:bg-white hover:text-navy-800"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        ) : (
          <p className="text-[11px] font-medium leading-relaxed text-navy-600">
            {role === 'secretariat'
              ? 'Institutional secretariat — prepare, publish, and govern board materials.'
              : 'Board member — review published packs and prepare privately.'}
          </p>
        )}
      </div>
    </aside>
  )
}
