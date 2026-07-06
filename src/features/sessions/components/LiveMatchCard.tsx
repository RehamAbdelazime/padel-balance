import { useTranslation } from 'react-i18next'
import { CheckCircle2, XCircle, ArrowRightLeft, Lock, Unlock } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Separator } from '@/shared/components/ui/separator'
import type { PlannedMatch, LiveMatchScore } from '../types'
import { matchStatusDotColor, matchStatusLabel } from './PlannedMatchCard'

interface Props {
  match:          PlannedMatch
  index:          number
  playerName:     (id: string) => string
  onScoreChange:  (matchId: string, score: LiveMatchScore) => void
  onFinishMatch:  (matchId: string) => void
  onCancelMatch?: (matchId: string) => void
  onSwapPlayer?:  (matchId: string) => void
  onLock?:        (matchId: string) => void
  onUnlock?:      (matchId: string) => void
  /** True while a schedule mutation from this card (or any other) is in flight — disables every action button to prevent duplicate-click races. */
  disabled?:      boolean
}

/**
 * The LIVE-only match card: adds editable score inputs and a Finish Match
 * action on top of the same visual shell as PlannedMatchCard. Rendered
 * instead of PlannedMatchCard only while match.matchStatus === 'LIVE' — the
 * moment a match finishes, the parent re-renders it as a (read-only)
 * PlannedMatchCard again, so this component never needs to represent a
 * finished state itself.
 */
export function LiveMatchCard({
  match, index, playerName, onScoreChange, onFinishMatch,
  onCancelMatch, onSwapPlayer, onLock, onUnlock, disabled = false,
}: Props) {
  const { t } = useTranslation()

  const team1 = match.result?.team1 ?? null
  const team2 = match.result?.team2 ?? null
  const canFinish = team1 !== null && team2 !== null && team1 !== team2
  const locked = match.protection === 'LOCKED'

  function parseScoreInput(value: string): number | null {
    if (value === '') return null
    const n = Number(value)
    return Number.isInteger(n) && n >= 0 ? n : null
  }

  return (
    <Card className="border-green-500/40 bg-green-500/5">
      <CardHeader className="pb-2 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold">
            {t('sessions.schedule.match.title', { n: index + 1 })}
          </span>
          <Badge variant="outline" className="gap-1.5 text-xs">
            <span className={`h-2 w-2 shrink-0 rounded-full ${matchStatusDotColor(match.matchStatus)}`} aria-hidden />
            {matchStatusLabel(t, match.matchStatus)}
          </Badge>
          {match.courtNumber !== null && (
            <Badge variant="outline" className="text-xs">
              {t('sessions.schedule.match.court', { n: match.courtNumber })}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('sessions.schedule.match.teamA')}
            </p>
            <p className="text-sm font-medium">{playerName(match.teamA[0])}</p>
            <p className="text-sm font-medium">{playerName(match.teamA[1])}</p>
            <Label htmlFor={`score-a-${match.id}`} className="sr-only">
              {t('sessions.schedule.match.scoreTeamA')}
            </Label>
            <Input
              id={`score-a-${match.id}`}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={team1 ?? ''}
              onChange={e => onScoreChange(match.id, { team1: parseScoreInput(e.target.value), team2 })}
              className="w-24"
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('sessions.schedule.match.teamB')}
            </p>
            <p className="text-sm font-medium">{playerName(match.teamB[0])}</p>
            <p className="text-sm font-medium">{playerName(match.teamB[1])}</p>
            <Label htmlFor={`score-b-${match.id}`} className="sr-only">
              {t('sessions.schedule.match.scoreTeamB')}
            </Label>
            <Input
              id={`score-b-${match.id}`}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={team2 ?? ''}
              onChange={e => onScoreChange(match.id, { team1, team2: parseScoreInput(e.target.value) })}
              className="w-24"
            />
          </div>
        </div>

        <Separator className="my-3" />

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={!canFinish || disabled} onClick={() => onFinishMatch(match.id)}>
            <CheckCircle2 className="me-1.5 h-3.5 w-3.5" aria-hidden />
            {t('sessions.schedule.actions.finishMatch')}
          </Button>

          {onSwapPlayer && (
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onSwapPlayer(match.id)}>
              <ArrowRightLeft className="me-1.5 h-3.5 w-3.5" aria-hidden />
              {t('sessions.schedule.actions.swapPlayer')}
            </Button>
          )}

          {locked
            ? onUnlock && (
                <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onUnlock(match.id)}>
                  <Unlock className="me-1.5 h-3.5 w-3.5" aria-hidden />
                  {t('sessions.schedule.actions.unlock')}
                </Button>
              )
            : onLock && (
                <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onLock(match.id)}>
                  <Lock className="me-1.5 h-3.5 w-3.5" aria-hidden />
                  {t('sessions.schedule.actions.lock')}
                </Button>
              )}

          {onCancelMatch && (
            <Button
              type="button" variant="outline" size="sm" disabled={disabled}
              className="text-destructive hover:text-destructive"
              onClick={() => onCancelMatch(match.id)}
            >
              <XCircle className="me-1.5 h-3.5 w-3.5" aria-hidden />
              {t('sessions.schedule.actions.cancelMatch')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
