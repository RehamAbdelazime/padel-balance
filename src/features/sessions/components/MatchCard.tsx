import { useTranslation } from 'react-i18next'
import { Pencil, RotateCcw } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardFooter } from '@/shared/components/ui/card'
import type { MatchWithTeams } from '../types'

interface MatchCardProps {
  match: MatchWithTeams
  /** Chronological sequence number (1 = first match of session). */
  matchNumber: number
  onEditScore: (match: MatchWithTeams) => void
  onRematch: (match: MatchWithTeams) => void
}

export function MatchCard({ match, matchNumber, onEditScore, onRematch }: MatchCardProps) {
  const { t } = useTranslation()

  const [team1, team2] = match.match_teams

  const team1Score = team1?.score ?? 0
  const team2Score = team2?.score ?? 0
  const team1Won = team1Score > team2Score
  const team2Won = team2Score > team1Score

  const getTeamNames = (team: MatchWithTeams['match_teams'][number]): string =>
    team.match_team_players.map((p) => p.players.name).join(' & ')

  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        {/* Match number */}
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('matches.matchNumber', { number: matchNumber })}
        </p>

        {/* Score display */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Team 1 */}
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('matches.team', { number: 1 })}
            </p>
            <p className={`text-sm font-semibold ${team1Won ? 'text-primary' : ''}`}>
              {team1 ? getTeamNames(team1) : '—'}
            </p>
          </div>

          {/* Scores */}
          <div className="flex items-center gap-2 text-center">
            <span
              className={`text-2xl font-bold tabular-nums ${team1Won ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {team1Score}
            </span>
            <span className="text-sm text-muted-foreground">{t('matches.vs')}</span>
            <span
              className={`text-2xl font-bold tabular-nums ${team2Won ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {team2Score}
            </span>
          </div>

          {/* Team 2 */}
          <div className="space-y-1 text-end">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('matches.team', { number: 2 })}
            </p>
            <p className={`text-sm font-semibold ${team2Won ? 'text-primary' : ''}`}>
              {team2 ? getTeamNames(team2) : '—'}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-2 border-t px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onEditScore(match)}
        >
          <Pencil className="me-1 h-3 w-3" aria-hidden="true" />
          {t('matches.editScore')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onRematch(match)}
        >
          <RotateCcw className="me-1 h-3 w-3" aria-hidden="true" />
          {t('matches.rematch')}
        </Button>
      </CardFooter>
    </Card>
  )
}
