import { useTranslation } from 'react-i18next'
import { Radio, Users } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import type { Session } from '@/features/sessions/types'

interface TodaySummaryCardProps {
  todaysSessions:    Session[]
  liveSession:       Session | undefined
  nextUpcoming:      Session | undefined
  todaysPlayerCount: number
  onResumeLive:      () => void
}

/**
 * Section 1 — Today. The organiser's first read: how many sessions today,
 * whether one is live right now (with a prominent Resume), what's next, and
 * how many players are involved today. Nothing here is fetched separately —
 * every value is derived by useDashboard from the single sessions query.
 */
export function TodaySummaryCard({
  todaysSessions,
  liveSession,
  nextUpcoming,
  todaysPlayerCount,
  onResumeLive,
}: TodaySummaryCardProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-2xl font-bold tracking-tight">
              {todaysSessions.length}
            </p>
            <p className="text-sm text-muted-foreground">
              {todaysSessions.length > 0
                ? t('dashboard.today.sessionsCount_other', { count: todaysSessions.length })
                : t('dashboard.today.noSessionsToday')}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t('dashboard.today.playersToday', { count: todaysPlayerCount })}
          </div>

          {liveSession ? (
            <Badge className="gap-1.5">
              <Radio className="h-3 w-3" aria-hidden="true" />
              {t('dashboard.today.liveNow', { name: liveSession.name })}
            </Badge>
          ) : nextUpcoming ? (
            <Badge variant="outline">
              {t('dashboard.today.nextUpcoming', { name: nextUpcoming.name })}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">{t('dashboard.today.noUpcoming')}</span>
          )}
        </div>

        {liveSession && (
          <Button onClick={onResumeLive}>
            <Radio className="me-1.5 h-4 w-4" aria-hidden="true" />
            {t('dashboard.today.resumeSession')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
