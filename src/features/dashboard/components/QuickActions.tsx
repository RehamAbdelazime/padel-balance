import { useTranslation } from 'react-i18next'
import { CalendarPlus, Users, FileBarChart, TrendingUp, Radio } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

interface QuickActionsProps {
  hasLiveSession: boolean
  onCreateSession: () => void
  onOpenPlayers:   () => void
  onResumeLive:    () => void
}

/**
 * Section 2 — Quick Actions. "Reports" and "Statistics" are disabled with a
 * "Coming soon" affordance: neither page exists yet in this app (confirmed
 * — no route for either), and building them is explicitly out of scope for
 * this sprint ("those belong to Reports"). Disabling is preferred over a
 * dead link or silently omitting a requested action.
 */
export function QuickActions({ hasLiveSession, onCreateSession, onOpenPlayers, onResumeLive }: QuickActionsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={onCreateSession}>
        <CalendarPlus className="h-5 w-5" aria-hidden="true" />
        {t('dashboard.quickActions.createSession')}
      </Button>

      <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={onOpenPlayers}>
        <Users className="h-5 w-5" aria-hidden="true" />
        {t('dashboard.quickActions.players')}
      </Button>

      <Button variant="outline" className="h-auto flex-col gap-2 py-4" disabled title={t('dashboard.quickActions.comingSoon')}>
        <FileBarChart className="h-5 w-5" aria-hidden="true" />
        {t('dashboard.quickActions.reports')}
      </Button>

      <Button variant="outline" className="h-auto flex-col gap-2 py-4" disabled title={t('dashboard.quickActions.comingSoon')}>
        <TrendingUp className="h-5 w-5" aria-hidden="true" />
        {t('dashboard.quickActions.statistics')}
      </Button>

      {hasLiveSession && (
        <Button className="h-auto flex-col gap-2 py-4" onClick={onResumeLive}>
          <Radio className="h-5 w-5" aria-hidden="true" />
          {t('dashboard.quickActions.resumeLive')}
        </Button>
      )}
    </div>
  )
}
