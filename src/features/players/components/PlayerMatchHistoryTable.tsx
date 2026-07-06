import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import type { PlayerMatchHistoryRow } from '../types/player-history'

interface PlayerMatchHistoryTableProps {
  matches: readonly PlayerMatchHistoryRow[]
}

function outcomeVariant(outcome: PlayerMatchHistoryRow['outcome']): 'default' | 'secondary' | 'outline' {
  if (outcome === 'W') return 'default'
  if (outcome === 'L') return 'secondary'
  return 'outline'
}

/** Section 4 — chronological (most recent first) match-by-match history across every session. Every row is a FINISHED match only. */
export function PlayerMatchHistoryTable({ matches }: PlayerMatchHistoryTableProps) {
  const { t, i18n } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('players.profile.matchHistory.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('players.profile.matchHistory.empty')}</p>
        ) : (
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
                  <span className="font-medium tabular-nums">{match.myScore} – {match.opponentScore}</span>
                  <Badge variant={outcomeVariant(match.outcome)} className="text-xs">{match.outcome}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
