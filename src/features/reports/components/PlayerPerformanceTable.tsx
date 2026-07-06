import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { runtimeStatusLabel } from '@/features/sessions/components/AttendancePanel'
import type { PlayerReportStats } from '../types'

interface PlayerPerformanceTableProps {
  players: readonly PlayerReportStats[]
}

/** Section 3 — one row per attendee. Sorted by matches played, then win percentage, both descending. */
export function PlayerPerformanceTable({ players }: PlayerPerformanceTableProps) {
  const { t } = useTranslation()

  const sorted = [...players].sort((a, b) => b.matchesPlayed - a.matchesPlayed || b.winPercentage - a.winPercentage)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('reports.players.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('reports.players.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-start text-xs text-muted-foreground">
                  <th className="px-2 py-2 text-start font-medium">{t('players.form.name')}</th>
                  <th className="px-2 py-2 font-medium">{t('statistics.matchesPlayed')}</th>
                  <th className="px-2 py-2 font-medium">{t('statistics.matchesWon')}</th>
                  <th className="px-2 py-2 font-medium">{t('statistics.matchesLost')}</th>
                  <th className="px-2 py-2 font-medium">{t('reports.players.draws')}</th>
                  <th className="px-2 py-2 font-medium">{t('statistics.gamesWon')}</th>
                  <th className="px-2 py-2 font-medium">{t('statistics.gamesLost')}</th>
                  <th className="px-2 py-2 font-medium">{t('statistics.gameDifference')}</th>
                  <th className="px-2 py-2 font-medium">{t('statistics.matchWinPercentage')}</th>
                  <th className="px-2 py-2 font-medium">{t('reports.players.standby')}</th>
                  <th className="px-2 py-2 font-medium">{t('reports.players.attendance')}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(player => (
                  <tr key={player.playerId} className="border-b last:border-0">
                    <td className="px-2 py-2 font-medium">{player.name}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{player.matchesPlayed}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{player.wins}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{player.losses}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{player.draws}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{player.gamesWon}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{player.gamesLost}</td>
                    <td className="px-2 py-2 text-center tabular-nums">
                      {player.gameDifference > 0 ? `+${player.gameDifference}` : player.gameDifference}
                    </td>
                    <td className="px-2 py-2 text-center tabular-nums">{player.winPercentage}%</td>
                    <td className="px-2 py-2 text-center tabular-nums">{player.standbyCount}</td>
                    <td className="px-2 py-2 text-center">
                      <Badge variant="outline" className="text-xs">
                        {player.attendanceStatus === 'AVAILABLE'
                          ? t('sessions.schedule.playerStatus.available')
                          : runtimeStatusLabel(t, player.attendanceStatus)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
