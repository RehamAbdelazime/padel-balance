import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { getFormat } from '@/features/sessions/formats'
import type { PlayerSessionHistoryRow } from '../types/player-history'

interface PlayerSessionHistoryTableProps {
  sessions: readonly PlayerSessionHistoryRow[]
}

/** Section 3 — every session attended. Clicking a row opens that session's Report (reused, not duplicated). */
export function PlayerSessionHistoryTable({ sessions }: PlayerSessionHistoryTableProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('players.profile.sessionHistory.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('players.profile.sessionHistory.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-2 py-2 text-start font-medium">{t('players.profile.sessionHistory.date')}</th>
                  <th className="px-2 py-2 text-start font-medium">{t('players.profile.sessionHistory.format')}</th>
                  <th className="px-2 py-2 font-medium">{t('players.profile.sessionHistory.players')}</th>
                  <th className="px-2 py-2 font-medium">{t('players.profile.sessionHistory.matchesPlayed')}</th>
                  <th className="px-2 py-2 font-medium">{t('players.profile.sessionHistory.result')}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => {
                  const formatName = session.formatId ? getFormat(session.formatId)?.name ?? session.formatId : '—'
                  return (
                    <tr
                      key={session.sessionId}
                      className="cursor-pointer border-b last:border-0 hover:bg-accent/50"
                      onClick={() => void navigate(`/sessions/${session.sessionId}/report`)}
                    >
                      <td className="px-2 py-2 font-medium">
                        {new Date(session.scheduledAt).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-2 py-2">{formatName}</td>
                      <td className="px-2 py-2 text-center tabular-nums">{session.totalPlayers}</td>
                      <td className="px-2 py-2 text-center tabular-nums">{session.matchesPlayed}</td>
                      <td className="px-2 py-2 text-center tabular-nums">
                        {session.wins}W–{session.losses}L{session.draws > 0 ? `–${session.draws}D` : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
