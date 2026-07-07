import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import type { LucideIcon } from 'lucide-react'
import type { TranslationKey } from '@/shared/i18n/types'

interface NavItem {
  readonly to: string
  readonly icon: LucideIcon
  readonly labelKey: TranslationKey
  readonly end: boolean
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    to: '/',
    icon: LayoutDashboard,
    labelKey: 'nav.dashboard',
    end: true,
  },
  {
    to: '/players',
    icon: Users,
    labelKey: 'nav.players',
    end: false,
  },
  {
    to: '/sessions',
    icon: CalendarDays,
    labelKey: 'nav.sessions',
    end: false,
  },
]

export function MobileBottomNav() {
  const { t } = useTranslation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card shadow-lg md:hidden"
      aria-label="Mobile Navigation"
    >
      <div className="flex h-16 items-center justify-around">
        {NAV_ITEMS.map(({ to, icon: Icon, labelKey, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary',
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}