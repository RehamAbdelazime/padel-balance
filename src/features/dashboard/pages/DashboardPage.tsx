import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { SessionFormDialog } from '@/features/sessions/components/SessionFormDialog'
import { useDashboard } from '../hooks/useDashboard'
import { TodaySummaryCard } from '../components/TodaySummaryCard'
import { QuickActions } from '../components/QuickActions'
import { ActiveSessionCard } from '../components/ActiveSessionCard'
import { UpcomingSessionsList } from '../components/UpcomingSessionsList'
import { RecentSessionsList } from '../components/RecentSessionsList'
import { PlayersOverviewCard } from '../components/PlayersOverviewCard'
import { SystemHealthCard } from '../components/SystemHealthCard'

/**
 * Dashboard page — the organiser's home screen (Sprint D1).
 *
 * Purely an orchestrator: all data comes from useDashboard (which composes
 * existing sessions/players queries plus a handful of small batched reads —
 * see that hook's own docs for exactly what's reused vs. new). No business
 * logic lives here; each section below is its own presentational component.
 */
export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dashboard = useDashboard()
  const [isCreateSessionOpen, setCreateSessionOpen] = useState(false)

  const handleResumeLive = () => {
    if (dashboard.liveSession) void navigate(`/sessions/${dashboard.liveSession.id}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('dashboard.title')}
        </h1>
        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      {dashboard.isLoading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label={t('common.loading')}
          />
        </div>
      )}

      {!dashboard.isLoading && dashboard.isError && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{t('common.error')}</p>
          <Button variant="outline" onClick={dashboard.refetch}>
            <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
            {t('common.retry')}
          </Button>
        </div>
      )}

      {!dashboard.isLoading && !dashboard.isError && (
        <>
          <TodaySummaryCard
            todaysSessions={dashboard.todaysSessions}
            liveSession={dashboard.liveSession}
            nextUpcoming={dashboard.upcomingSessions[0]}
            todaysPlayerCount={dashboard.todaysPlayerCount}
            onResumeLive={handleResumeLive}
          />

          <QuickActions
            hasLiveSession={Boolean(dashboard.liveSession)}
            onCreateSession={() => setCreateSessionOpen(true)}
            onOpenPlayers={() => void navigate('/players')}
            onResumeLive={handleResumeLive}
          />

          {dashboard.liveSession && (
            <ActiveSessionCard
              session={dashboard.liveSession}
              persisted={dashboard.liveSchedule}
              attendees={dashboard.liveAttendees}
              onResume={handleResumeLive}
            />
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <UpcomingSessionsList
              sessions={dashboard.upcomingSessions}
              attendanceCountBySession={dashboard.attendanceCountBySession}
              formatIdsBySession={dashboard.formatIdsBySession}
            />
            <RecentSessionsList
              sessions={dashboard.recentSessions}
              attendanceCountBySession={dashboard.attendanceCountBySession}
              formatIdsBySession={dashboard.formatIdsBySession}
            />
          </div>

          <PlayersOverviewCard {...dashboard.playerCounts} />

          <SystemHealthCard isDbConnected={dashboard.isDbConnected} lastSyncAt={dashboard.lastSyncAt} />
        </>
      )}

      <SessionFormDialog
        session={null}
        open={isCreateSessionOpen}
        onClose={() => setCreateSessionOpen(false)}
      />
    </div>
  )
}
