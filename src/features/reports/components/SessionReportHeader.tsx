import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { formatSessionDate, formatSessionTime } from '@/features/sessions/utils'
import { getFormat } from '@/features/sessions/formats'
import type { Session, SessionStatus } from '@/features/sessions/types'

interface SessionReportHeaderProps {
  session:                       Session
  formatId:                      string | null
  totalPlayers:                  number
  totalMatches:                  number
  totalRounds:                   number
  estimatedMatchDurationMinutes: number | null
}

/** Section 1 — the report's identity block: what session this is, and its headline shape. */
export function SessionReportHeader({
  session,
  formatId,
  totalPlayers,
  totalMatches,
  totalRounds,
  estimatedMatchDurationMinutes,
}: SessionReportHeaderProps) {
  const { t, i18n } = useTranslation()
  const formatName = formatId ? getFormat(formatId)?.name ?? formatId : null

  const statusLabel: Record<SessionStatus, string> = {
    PLANNING:  t('sessions.lifecycle.status.planning'),
    LIVE:      t('sessions.lifecycle.status.live'),
    FINISHED:  t('sessions.lifecycle.status.finished'),
    CANCELLED: t('sessions.lifecycle.status.cancelled'),
  }

  const stats = [
    { label: t('sessions.detail.courtCount_other', { count: session.court_count }), value: session.court_count },
    { label: t('reports.session.bookingDuration'), value: t('sessions.detail.bookingDuration', { count: session.booking_duration }) },
    {
      label: t('reports.session.matchDuration'),
      value: estimatedMatchDurationMinutes !== null
        ? t('reports.session.matchDurationEstimate', { count: estimatedMatchDurationMinutes })
        : t('reports.session.notTracked'),
    },
    { label: t('reports.session.totalPlayers'),  value: totalPlayers },
    { label: t('reports.session.totalMatches'),  value: totalMatches },
    { label: t('reports.session.totalRounds'),   value: totalRounds },
  ]

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{session.name}</h1>
            <p className="text-sm text-muted-foreground">
              {formatSessionDate(session.scheduled_at, i18n.language)} · {formatSessionTime(session.scheduled_at, i18n.language)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {formatName && <Badge variant="outline">{formatName}</Badge>}
            <Badge>{statusLabel[session.status]}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map(stat => (
            <div key={stat.label}>
              <p className="text-lg font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
