import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { matchStatusDotColor, matchStatusLabel } from '@/features/sessions/components/PlannedMatchCard'
import type { RoundReportGroup, MatchReportRow } from '../types'

interface MatchResultsSectionProps {
  rounds:      readonly RoundReportGroup[]
  playerName:  (id: string) => string
}

function winnerLabel(match: MatchReportRow, t: TFunction): string | null {
  if (match.winner === null) return null
  if (match.winner === 'DRAW') return t('reports.matches.draw')
  return match.winner === 'A' ? t('reports.matches.teamAWins') : t('reports.matches.teamBWins')
}

/** Section 2 — every match, grouped by round, exactly as it was played. Read-only: no score inputs, no edit actions. */
export function MatchResultsSection({ rounds, playerName }: MatchResultsSectionProps) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('reports.matches.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {rounds.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('reports.matches.empty')}</p>
        ) : (
          rounds.map(round => (
            <div key={round.roundNumber} className="space-y-2">
              <h3 className="text-sm font-semibold">{t('sessions.schedule.round.title', { n: round.roundNumber })}</h3>
              <ul className="divide-y rounded-md border">
                {round.matches.map(match => (
                  <li key={match.matchId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {match.courtNumber !== null && (
                        <Badge variant="outline" className="text-xs">
                          {t('sessions.schedule.match.court', { n: match.courtNumber })}
                        </Badge>
                      )}
                      <span className={match.winner === 'A' ? 'font-semibold' : undefined}>
                        {playerName(match.teamA[0])} & {playerName(match.teamA[1])}
                      </span>
                      <span className="text-muted-foreground">{t('matches.vs')}</span>
                      <span className={match.winner === 'B' ? 'font-semibold' : undefined}>
                        {playerName(match.teamB[0])} & {playerName(match.teamB[1])}
                      </span>
                      {match.isManualEdit && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Wrench className="h-3 w-3" aria-hidden="true" />
                          {t('sessions.schedule.match.manual')}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium tabular-nums">
                        {match.scoreA !== null && match.scoreB !== null ? `${match.scoreA} – ${match.scoreB}` : '—'}
                      </span>
                      {winnerLabel(match, t) && (
                        <Badge variant="outline" className="text-xs">{winnerLabel(match, t)}</Badge>
                      )}
                      <Badge variant="outline" className="gap-1.5 text-xs">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${matchStatusDotColor(match.matchStatus)}`} aria-hidden />
                        {matchStatusLabel(t, match.matchStatus)}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
