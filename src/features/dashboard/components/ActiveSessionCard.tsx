import { useTranslation } from 'react-i18next'
import { Radio } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { groupMatchesIntoRounds, deriveRoundStatus, standbyForRound } from '@/features/sessions/utils'
import { getFormat } from '@/features/sessions/formats'
import type { Session, SessionAttendee } from '@/features/sessions/types'
import type { PersistedSchedule } from '@/features/sessions/services/schedule-persistence.service'

interface ActiveSessionCardProps {
  session:   Session
  persisted: PersistedSchedule | null
  attendees: SessionAttendee[]
  onResume:  () => void
}

/**
 * Section 3 — Active Session. Rendered only by the parent page when a LIVE
 * session exists (the section "disappears" per spec by the caller simply
 * not mounting it). Reuses the same round/standby derivation utilities as
 * ScheduleReviewPanel/SessionDetailPage — no new round-shaping logic.
 */
export function ActiveSessionCard({ session, persisted, attendees, onResume }: ActiveSessionCardProps) {
  const { t } = useTranslation()

  const playerName = (id: string) => attendees.find(a => a.player_id === id)?.players.name ?? id
  const formatName = persisted ? getFormat(persisted.formatId)?.name ?? persisted.formatId : null

  const rounds = persisted ? groupMatchesIntoRounds(persisted.schedule.matches, session.court_count) : []
  const currentRound =
    rounds.find(r => r.slots.some(s => s.matchIndex === persisted?.schedule.currentMatchIndex))
    ?? rounds.find(r => { const status = deriveRoundStatus(r); return status !== 'FINISHED' && status !== 'CANCELLED' })
    ?? rounds[rounds.length - 1]

  const currentMatch =
    persisted && persisted.schedule.currentMatchIndex !== null
      ? persisted.schedule.matches[persisted.schedule.currentMatchIndex]
      : undefined

  const remainingMatches = persisted
    ? persisted.schedule.matches.filter(m => m.matchStatus === 'PENDING' || m.matchStatus === 'LIVE').length
    : 0

  const standby = currentRound && persisted
    ? standbyForRound(attendees, currentRound, persisted.schedule.playerStates)
    : []

  return (
    <Card className="border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-4 w-4 text-primary" aria-hidden="true" />
          {session.name}
        </CardTitle>
        <Button size="sm" onClick={onResume}>
          {t('dashboard.activeSession.resume')}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {formatName && (
          <div>
            <p className="text-xs text-muted-foreground">{t('dashboard.activeSession.format')}</p>
            <p className="text-sm font-medium">{formatName}</p>
          </div>
        )}
        {currentRound && (
          <div>
            <p className="text-xs text-muted-foreground">{t('dashboard.activeSession.currentRound')}</p>
            <p className="text-sm font-medium">{t('sessions.schedule.round.title', { n: currentRound.roundNumber })}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">{t('dashboard.activeSession.currentMatch')}</p>
          <p className="text-sm font-medium">
            {currentMatch
              ? `${playerName(currentMatch.teamA[0])} & ${playerName(currentMatch.teamA[1])} ${t('matches.vs')} ${playerName(currentMatch.teamB[0])} & ${playerName(currentMatch.teamB[1])}`
              : t('dashboard.activeSession.noCurrentMatch')}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('dashboard.activeSession.remainingMatches')}</p>
          <p className="text-sm font-medium">{remainingMatches}</p>
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <p className="text-xs text-muted-foreground">{t('dashboard.activeSession.standbyPlayers')}</p>
          <p className="text-sm font-medium">
            {standby.length > 0 ? standby.map(a => a.players.name).join(', ') : t('dashboard.activeSession.noStandby')}
          </p>
        </div>
        {!persisted && (
          <Badge variant="outline" className="w-fit sm:col-span-2 lg:col-span-4">
            {t('sessions.schedule.empty')}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
