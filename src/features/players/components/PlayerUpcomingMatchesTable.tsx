import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import type { PlayerUpcomingMatchRow } from '../types/player-history'

interface PlayerUpcomingMatchesTableProps {
  matches: readonly PlayerUpcomingMatchRow[]
}

/**
 * Pending/Live matches this player is scheduled into — deliberately a
 * separate section from Match History (bug fix: historical statistics
 * integrity). A LIVE row's score, if any, is a provisional, still-editable
 * value — shown here, never counted as a historical fact.
 */
export function PlayerUpcomingMatchesTable({ matches }: PlayerUpcomingMatchesTableProps) {
  const { t, i18n } = useTranslation()

  if (matches.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('players.profile.upcomingMatches.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {matches.map(match => (
            <li key={match.matchId} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {new Date(match.scheduledAt).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })}
                  {' · '}{t('sessions.schedule.round.title', { n: match.roundNumber })}
                  {match.courtNumber !== null && <> · {t('sessions.schedule.match.court', { n: match.courtNumber })}</>}
                </p>
                <p>
                  {t('players.profile.matchHistory.partner')}: <span className="font-medium">{match.partnerName}</span>
                  {' — '}
                  {t('players.profile.matchHistory.opponents')}: <span className="font-medium">{match.opponentNames[0]} & {match.opponentNames[1]}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {match.myScore !== null && match.opponentScore !== null && (
                  <span className="font-medium tabular-nums text-muted-foreground">{match.myScore} – {match.opponentScore}</span>
                )}
                <Badge variant={match.matchStatus === 'LIVE' ? 'default' : 'outline'} className="text-xs">
                  {match.matchStatus === 'LIVE' ? t('sessions.schedule.match.status.live') : t('sessions.schedule.match.status.pending')}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
