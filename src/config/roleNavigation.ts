import type { PackStatus, Screen, UserRole } from '@/types'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Calendar,
  FolderOpen,
  ClipboardList,
  MessageSquare,
  Lock,
  History,
  CheckSquare,
  ClipboardCheck,
} from 'lucide-react'

export interface NavItem {
  screen: Screen
  icon: LucideIcon
  restricted?: string
}

export const boardMemberNav: { label: string; items: NavItem[] }[] = [
  {
    label: 'Preparation',
    items: [
      { screen: 'dashboard', icon: LayoutDashboard },
      { screen: 'meetings', icon: Calendar },
      { screen: 'board_pack', icon: FolderOpen, restricted: 'view_published_pack' },
      { screen: 'ask_ai', icon: MessageSquare },
      { screen: 'private_workspace', icon: Lock, restricted: 'private_workspace' },
    ],
  },
  {
    label: 'Records',
    items: [
      { screen: 'decision_memory', icon: History },
      { screen: 'action_tracking', icon: CheckSquare },
    ],
  },
]

export const secretariatNav: { label: string; items: NavItem[] }[] = [
  {
    label: 'Pack & Meeting',
    items: [
      { screen: 'dashboard', icon: LayoutDashboard },
      { screen: 'pack_preparation', icon: ClipboardList, restricted: 'pack_preparation' },
      { screen: 'meetings', icon: Calendar },
      { screen: 'board_pack', icon: FolderOpen },
    ],
  },
  {
    label: 'Governance',
    items: [
      { screen: 'secretariat_review', icon: ClipboardCheck, restricted: 'secretariat_review' },
      { screen: 'action_tracking', icon: CheckSquare },
      { screen: 'decision_memory', icon: History },
      { screen: 'ask_ai', icon: MessageSquare },
    ],
  },
]

export function getNavForRole(role: UserRole) {
  if (role === 'secretariat') return secretariatNav
  if (role === 'board_member') return boardMemberNav
  return boardMemberNav
}

export function canAccessScreen(
  screen: Screen,
  role: UserRole,
  packStatus: PackStatus
): boolean {
  if (role === 'board_member') {
    if (screen === 'board_pack') return packStatus === 'published'
    if (['pack_preparation', 'secretariat_review', 'chair_controls', 'governance', 'files'].includes(screen)) {
      return false
    }
    return true
  }

  if (role === 'secretariat') {
    if (screen === 'private_workspace') return false
    if (['chair_controls', 'governance', 'files'].includes(screen)) return false
    return true
  }

  return true
}

export function defaultScreenForRole(role: UserRole): Screen {
  if (role === 'secretariat') return 'pack_preparation'
  return 'dashboard'
}
