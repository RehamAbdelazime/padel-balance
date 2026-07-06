import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Clock, LayoutGrid, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { formatSessionDate, formatSessionTime } from '@/features/sessions/utils'
import { getFormat } from '@/features/sessions/formats'
import type { Session } from '@/features/sessions/types'

interface UpcomingSessionsListProps {
  sessions:              Session[]
  attendanceCountBySession: ReadonlyMap<string, number>
  formatIdsBySession:    ReadonlyMap<string, string>
}

/** Section 4 — next N scheduled sessions. Clicking a row opens Session Details (existing route — no new page). */
export function UpcomingSessionsList({ sessions, attendanceCountBySession, formatIdsBySession }: UpcomingSessionsListProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('dashboard.upcoming.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('dashboard.upcoming.empty')}</p>
        ) : (
          <ul className="divide-y">
            {sessions.map(session => {
              const formatId   = formatIdsBySession.get(session.id)
              const formatName = formatId ? getFormat(formatId)?.name ?? formatId : null
              const playerCount = attendanceCountBySession.get(session.id) ?? 0

              return (
                <li key={session.id}>
                  <button
                    type="button"
                    className="flex w-full flex-wrap items-center justify-between gap-2 py-3 text-start hover:bg-accent/50"
                    onClick={() => void navigate(`/sessions/${session.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{session.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
                          {formatSessionDate(session.scheduled_at, i18n.language)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                          {formatSessionTime(session.scheduled_at, i18n.language)} · {t('sessions.detail.bookingDuration', { count: session.booking_duration })}
                        </span>
                        <span className="flex items-center gap-1">
                          <LayoutGrid className="h-3 w-3 shrink-0" aria-hidden="true" />
                          {t('dashboard.upcoming.courts_other', { count: session.court_count })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 shrink-0" aria-hidden="true" />
                          {t('dashboard.upcoming.players_other', { count: playerCount })}
                        </span>
                      </div>
                    </div>
                    <Badge variant={formatName ? 'outline' : 'secondary'} className="shrink-0 text-xs">
                      {formatName ?? t('dashboard.upcoming.formatNotSet')}
                    </Badge>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
