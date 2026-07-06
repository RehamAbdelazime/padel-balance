import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Lock, Unlock, Trash2, ArrowRightLeft, AlertTriangle, Wrench, PlayCircle, Pencil, Trophy } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'
import type { PlannedMatch, MatchRuntimeStatus } from '../types'

interface Props {
  match:                    PlannedMatch
  index:                    number
  playerName:               (id: string) => string
  /** Present only during PLANNING — editing actions are hidden once a match is completed. */
  onLock?:                  (matchId: string) => void
  onUnlock?:                (matchId: string) => void
  onRemove?:                (matchId: string) => void
  onSwapPlayer?:            (matchId: string) => void
  /** Present only once the session is LIVE and this match is Pending. */
  onStartMatch?:            (matchId: string) => void
  /** False when an earlier round isn't finished yet — the button still shows (never ambiguous why there's no action), just disabled with an explanation. */
  canStart?:                boolean
  /** True while a schedule mutation is in flight — disables every action button to prevent duplicate-click races. */
  disabled?:                boolean
}

/** Runtime status dot color — mirrors the 🟡/🟢/⚫ convention. Exported for LiveMatchCard/round badges. */
export function matchStatusDotColor(status: MatchRuntimeStatus): string {
  switch (status) {
    case 'PENDING':   return 'bg-yellow-400'
    case 'LIVE':       return 'bg-green-500'
    case 'FINISHED':   return 'bg-neutral-500'
    case 'CANCELLED':  return 'bg-red-400'
  }
}

export function matchStatusLabel(t: TFunction, status: MatchRuntimeStatus): string {
  switch (status) {
    case 'PENDING':   return t('sessions.schedule.match.status.pending')
    case 'LIVE':       return t('sessions.schedule.match.status.live')
    case 'FINISHED':   return t('sessions.schedule.match.status.finished')
    case 'CANCELLED':  return t('sessions.schedule.match.status.cancelled')
  }
}

/** 'A' | 'B' if one team has a strictly higher score, otherwise null (no score yet, or an equal score — this format never finishes a match that way). */
function winningTeam(match: PlannedMatch): 'A' | 'B' | null {
  if (!match.result) return null
  const { team1, team2 } = match.result
  if (team1 === null || team2 === null || team1 === team2) return null
  return team1 > team2 ? 'A' : 'B'
}

export function PlannedMatchCard({
  match,
  index,
  playerName,
  onLock,
  onUnlock,
  onRemove,
  onSwapPlayer,
  onStartMatch,
  canStart = true,
  disabled = false,
}: Props) {
  const { t } = useTranslation()
  const locked      = match.protection === 'LOCKED'
  const isManual    = match.origin === 'MANUAL'
  const isFinished  = match.matchStatus === 'FINISHED'
  const isCancelled = match.matchStatus === 'CANCELLED'
  const isCompleted = match.isCompleted || isCancelled
  const showActions = !isCompleted && (onLock || onUnlock || onRemove || onSwapPlayer)
  const winner      = isFinished ? winningTeam(match) : null

  const cardTone =
    isFinished  ? 'border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/40' :
    isCancelled ? 'border-destructive/30 bg-destructive/5 opacity-75' :
    locked      ? 'border-primary/30 bg-primary/5' :
    undefined

  return (
    <Card className={cardTone}>
      <CardHeader className="pb-2 pt-3">
        <div className="flex flex-wrap items-start justify-between gap-2">

          {/* Left: title + badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold">
              {t('sessions.schedule.match.title', { n: index + 1 })}
            </span>

            <Badge variant="outline" className="gap-1.5 text-xs">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${matchStatusDotColor(match.matchStatus)}`}
                aria-hidden
              />
              {matchStatusLabel(t, match.matchStatus)}
            </Badge>

            {match.courtNumber !== null && (
              <Badge variant="outline" className="text-xs">
                {t('sessions.schedule.match.court', { n: match.courtNumber })}
              </Badge>
            )}

            {isManual && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Wrench className="h-3 w-3" aria-hidden />
                {t('sessions.schedule.match.manual')}
              </Badge>
            )}

            {locked && (
              <Badge className="gap-1 text-xs">
                <Lock className="h-3 w-3" aria-hidden />
                {t('sessions.schedule.match.locked')}
              </Badge>
            )}

            {match.modified && (
              <Badge
                variant="outline"
                className="gap-1 text-xs text-muted-foreground"
                title={t('sessions.schedule.match.modifiedExplanation')}
              >
                <Pencil className="h-3 w-3" aria-hidden />
                {t('sessions.schedule.match.modified')}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Teams */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className={`space-y-0.5 rounded-md ${winner === 'A' ? 'bg-primary/5 p-1.5 -m-1.5' : ''}`}>
            <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('sessions.schedule.match.teamA')}
              {winner === 'A' && <Trophy className="h-3 w-3 shrink-0 text-amber-500" aria-hidden />}
            </p>
            <p className={`text-sm ${winner === 'A' ? 'font-bold' : 'font-medium'}`}>{playerName(match.teamA[0])}</p>
            <p className={`text-sm ${winner === 'A' ? 'font-bold' : 'font-medium'}`}>{playerName(match.teamA[1])}</p>
          </div>
          <div className={`space-y-0.5 rounded-md ${winner === 'B' ? 'bg-primary/5 p-1.5 -m-1.5' : ''}`}>
            <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('sessions.schedule.match.teamB')}
              {winner === 'B' && <Trophy className="h-3 w-3 shrink-0 text-amber-500" aria-hidden />}
            </p>
            <p className={`text-sm ${winner === 'B' ? 'font-bold' : 'font-medium'}`}>{playerName(match.teamB[0])}</p>
            <p className={`text-sm ${winner === 'B' ? 'font-bold' : 'font-medium'}`}>{playerName(match.teamB[1])}</p>
          </div>
        </div>

        {/* Final score — always visible for a Finished match */}
        {isFinished && match.result && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center justify-center gap-2 text-lg font-bold tabular-nums">
              <span className={winner === 'A' ? 'text-primary' : undefined}>{match.result.team1}</span>
              <span className="text-muted-foreground">–</span>
              <span className={winner === 'B' ? 'text-primary' : undefined}>{match.result.team2}</span>
            </div>
          </>
        )}

        {/* Warnings */}
        {match.warnings.length > 0 && (
          <div className="mt-2 flex items-start gap-1.5">
            <AlertTriangle
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-500"
              aria-hidden
            />
            <p className="text-xs text-yellow-700 dark:text-yellow-400">
              {match.warnings[0]}
            </p>
          </div>
        )}

        {/* Start Match — the only way a Pending match ever becomes Live. Always
            shown (never hidden) so it's never ambiguous why a Pending match
            has no action — when its round isn't eligible yet, the button
            stays visible but disabled, with an explanation. */}
        {onStartMatch && match.matchStatus === 'PENDING' && (
          <>
            <Separator className="my-3" />
            <Button type="button" size="sm" disabled={disabled || !canStart} onClick={() => onStartMatch(match.id)}>
              <PlayCircle className="me-1.5 h-3.5 w-3.5" aria-hidden />
              {t('sessions.schedule.actions.startMatch')}
            </Button>
            {!canStart && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t('sessions.schedule.match.waitingForEarlierRound')}
              </p>
            )}
          </>
        )}

        {/* Planning actions */}
        {showActions && (
          <>
            <Separator className="my-3" />
            <div className="flex flex-wrap gap-2">
              {onSwapPlayer && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onSwapPlayer(match.id)}
                >
                  <ArrowRightLeft className="me-1.5 h-3.5 w-3.5" aria-hidden />
                  {t('sessions.schedule.actions.swapPlayer')}
                </Button>
              )}

              {locked
                ? onUnlock && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={disabled}
                      onClick={() => onUnlock(match.id)}
                    >
                      <Unlock className="me-1.5 h-3.5 w-3.5" aria-hidden />
                      {t('sessions.schedule.actions.unlock')}
                    </Button>
                  )
                : onLock && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={disabled}
                      onClick={() => onLock(match.id)}
                    >
                      <Lock className="me-1.5 h-3.5 w-3.5" aria-hidden />
                      {t('sessions.schedule.actions.lock')}
                    </Button>
                  )}

              {onRemove && !locked && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  className="text-destructive hover:text-destructive"
                  onClick={() => onRemove(match.id)}
                >
                  <Trash2 className="me-1.5 h-3.5 w-3.5" aria-hidden />
                  {t('sessions.schedule.actions.delete')}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
