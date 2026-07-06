import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { formatSessionDate } from '@/features/sessions/utils'
import { getFormat } from '@/features/sessions/formats'
import type { Session } from '@/features/sessions/types'

interface RecentSessionsListProps {
  sessions:              Session[]
  attendanceCountBySession: ReadonlyMap<string, number>
  formatIdsBySession:    ReadonlyMap<string, string>
}

/**
 * Section 5 — last completed sessions. "Open Report" links to the existing
 * Session Details page (its match history), the real place this data lives —
 * there is no separate Reports page in this app yet, so a "winner" column
 * is intentionally omitted: every built-in format rotates partners match by
 * match, so a session has no single winning team/player, only per-match
 * results already visible on that session's own page.
 */
export function RecentSessionsList({ sessions, attendanceCountBySession, formatIdsBySession }: RecentSessionsListProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('dashboard.recent.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('dashboard.recent.empty')}</p>
        ) : (
          <ul className="divide-y">
            {sessions.map(session => {
              const formatId    = formatIdsBySession.get(session.id)
              const formatName  = formatId ? getFormat(formatId)?.name ?? formatId : null
              const playerCount = attendanceCountBySession.get(session.id) ?? 0

              return (
                <li key={session.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{session.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {formatSessionDate(session.scheduled_at, i18n.language)}
                      </span>
                      {formatName && <span>{formatName}</span>}
                      <span>{t('dashboard.recent.players_other', { count: playerCount })}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void navigate(`/sessions/${session.id}`)}>
                    {t('dashboard.recent.openReport')}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
