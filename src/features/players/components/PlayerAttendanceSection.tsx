import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import type { PlayerAttendanceStats } from '../types/player-history'

interface PlayerAttendanceSectionProps {
  attendance: PlayerAttendanceStats
}

function monthLabel(monthKey: string, locale: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year!, (month ?? 1) - 1, 1).toLocaleDateString(locale, { year: 'numeric', month: 'long' })
}

/** Section 7 — attendance facts only, no chart: a simple monthly list (Section 10: "No unnecessary charts"). */
export function PlayerAttendanceSection({ attendance }: PlayerAttendanceSectionProps) {
  const { t, i18n } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('players.profile.attendance.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center sm:max-w-sm">
          <div>
            <p className="text-lg font-semibold">{attendance.sessionsAttended}</p>
            <p className="text-xs text-muted-foreground">{t('players.profile.attendance.attended')}</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{attendance.sessionsMissed}</p>
            <p className="text-xs text-muted-foreground">{t('players.profile.attendance.missed')}</p>
          </div>
          <div>
            <p className="text-lg font-semibold">{attendance.attendancePercentage}%</p>
            <p className="text-xs text-muted-foreground">{t('players.profile.attendance.percentage')}</p>
          </div>
        </div>

        {attendance.monthly.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('players.profile.attendance.monthly')}
            </p>
            <ul className="space-y-1 text-sm">
              {attendance.monthly.map(entry => (
                <li key={entry.month} className="flex items-center justify-between">
                  <span>{monthLabel(entry.month, i18n.language)}</span>
                  <span className="tabular-nums text-muted-foreground">{entry.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
