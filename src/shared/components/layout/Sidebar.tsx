import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Trophy,
  Star,
  FileText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { TranslationKey } from '@/shared/i18n/types'

interface NavItem {
  readonly to: string
  readonly icon: LucideIcon
  readonly labelKey: TranslationKey
  /** Pass `end` for the root route so it doesn't match all children. */
  readonly end: boolean
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard', end: true },
  { to: '/players', icon: Users, labelKey: 'nav.players', end: false },
  { to: '/sessions', icon: CalendarDays, labelKey: 'nav.sessions', end: false },
  // { to: '/matches', icon: Trophy, labelKey: 'nav.matches', end: false },
  // { to: '/ratings', icon: Star, labelKey: 'nav.ratings', end: false },
  // { to: '/reports', icon: FileText, labelKey: 'nav.reports', end: false },
]

export function Sidebar() {
  const { t } = useTranslation()

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-e bg-card">
      {/* Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold tracking-tight text-primary">
          PadelOps
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, icon: Icon, labelKey, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
