import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { toast } from 'sonner'
import { RefreshCw, Shuffle, PlusCircle, FileDown, Image, FileImage } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared/components/ui/separator'
import type { Session, SessionSchedule, SessionAttendee, SessionStatus, PlannedMatch, LiveMatchScore } from '../types'
import type { Player } from '@/features/players/types'
import { PlannedMatchCard } from './PlannedMatchCard'
import { LiveMatchCard } from './LiveMatchCard'
import { SwapPlayerDialog } from './SwapPlayerDialog'
import { AddManualMatchDialog } from './AddManualMatchDialog'
import { ConfirmActionDialog } from './ConfirmActionDialog'
import { SchedulePrintout } from './SchedulePrintout'
import { groupMatchesIntoRounds, standbyForRound, deriveRoundStatus, formatSessionDate, formatSessionTime } from '../utils'
import type { RoundStatus } from '../utils'
import { exportScheduleToPdf, exportScheduleToPng, exportScheduleToJpeg } from '../utils/schedule-export'
import { getFormat } from '../formats'
import { GENERATOR } from '@/features/team-generator'

type ExportKind = 'pdf' | 'png' | 'jpeg'

/** Same green/gray/yellow convention as match status badges (see PlannedMatchCard). */
function roundStatusDotColor(status: RoundStatus): string {
  switch (status) {
    case 'PENDING':    return 'bg-yellow-400'
    case 'LIVE':        return 'bg-green-500'
    case 'FINISHED':    return 'bg-neutral-500'
    case 'CANCELLED':   return 'bg-red-400'
  }
}

function roundStatusLabel(t: TFunction, status: RoundStatus): string {
  switch (status) {
    case 'PENDING':    return t('sessions.schedule.match.status.pending')
    case 'LIVE':        return t('sessions.schedule.match.status.live')
    case 'FINISHED':    return t('sessions.schedule.match.status.finished')
    case 'CANCELLED':   return t('sessions.schedule.match.status.cancelled')
  }
}

interface Props {
  schedule:                SessionSchedule
  /** Full session row — used for the Export printout's session-information header. */
  session:                 Session
  /** TournamentFormat id the schedule was generated with (persisted alongside it), or null before the first schedule exists. */
  formatId:                string | null
  /** Persisted session lifecycle status — the actual source of truth for gating edits. */
  sessionStatus:           SessionStatus
  /** Session's configured Number of Courts — how many matches run concurrently per round. */
  courtCount:              number
  attendees:               SessionAttendee[]
  allPlayers:              Player[]
  isLoading:               boolean
  onOpenWizard:            () => void
  onRegenerateAll:         () => void
  onAddManualMatch:        (teamA: readonly [string, string], teamB: readonly [string, string]) => void
  onLockMatch:             (matchId: string) => void
  onUnlockMatch:           (matchId: string) => void
  onRemoveMatch:           (matchId: string) => void
  onSwapPlayer:            (matchId: string, fromPlayerId: string, toPlayerId: string) => void
  /** Present only once the session is LIVE — starts a Pending match. */
  onStartMatch?:           (matchId: string) => void
  /** Present only once the session is LIVE — autosaves an in-progress score for a LIVE match. */
  onScoreChange?:          (matchId: string, score: LiveMatchScore) => void
  /** Present only once the session is LIVE — finalizes a LIVE match's score. */
  onFinishMatch?:          (matchId: string) => void
  /** Present only once the session is LIVE — cancels a LIVE/PENDING match. */
  onCancelMatch?:          (matchId: string) => void
}

export function ScheduleReviewPanel({
  schedule,
  session,
  formatId,
  sessionStatus,
  courtCount,
  attendees,
  isLoading,
  onOpenWizard,
  onRegenerateAll,
  onAddManualMatch,
  onLockMatch,
  onUnlockMatch,
  onRemoveMatch,
  onSwapPlayer,
  onStartMatch,
  onScoreChange,
  onFinishMatch,
  onCancelMatch,
}: Props) {
  const { t, i18n } = useTranslation()

  const [isAddMatchOpen, setAddMatchOpen] = useState(false)
  const [swapMatch,      setSwapMatch]    = useState<PlannedMatch | null>(null)
  const [exporting,      setExporting]    = useState<ExportKind | null>(null)
  const [isRegenerateAllConfirmOpen, setRegenerateAllConfirmOpen] = useState(false)
  const [removeMatchId,  setRemoveMatchId] = useState<string | null>(null)
  const printoutRef = useRef<HTMLDivElement>(null)

  const playerIds  = [...schedule.playerStates.keys()]
  const hasMatches = schedule.matches.length > 0
  const rounds      = groupMatchesIntoRounds(schedule.matches, courtCount)

  function roundStandbyNames(round: (typeof rounds)[number]): string[] {
    return standbyForRound(attendees, round, schedule.playerStates).map(a => a.players.name)
  }

  // Sprint F26: if a round still needs generating but too few players remain
  // AVAILABLE, regeneration pauses rather than destroying existing rounds —
  // surface that here so the organiser knows to return/replace/end session.
  const allRoundsFinished  = rounds.length > 0 && rounds.every(r => deriveRoundStatus(r) === 'FINISHED')
  const availableCount     = [...schedule.playerStates.values()].filter(s => s.status === 'AVAILABLE').length
  const insufficientPlayers = sessionStatus === 'LIVE' && !allRoundsFinished && availableCount < GENERATOR.PLAYERS_PER_MATCH

  // Editing actions are only available while the SESSION (not the ephemeral
  // schedule object) is still PLANNING. No LIVE/FINISHED runtime behaviour
  // is implemented yet — this only gates which Planning actions are shown.
  const isPlanning = sessionStatus === 'PLANNING'

  const playerName = (id: string) =>
    attendees.find(a => a.player_id === id)?.players.name ?? id

  const formatName = formatId ? getFormat(formatId)?.name ?? formatId : ''

  async function handleExport(kind: ExportKind) {
    const node = printoutRef.current
    if (!node) return
    setExporting(kind)
    try {
      const filename = `${session.name}-schedule.${kind === 'jpeg' ? 'jpg' : kind}`
      if (kind === 'pdf')  await exportScheduleToPdf(node, filename)
      if (kind === 'png')  await exportScheduleToPng(node, filename)
      if (kind === 'jpeg') await exportScheduleToJpeg(node, filename)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      toast.error(t('sessions.schedule.toasts.exportError', { message }))
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6">

      {/* Schedule actions — Generate, Regenerate, Add Manual Match (Planning only) */}
      {isPlanning && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onOpenWizard}>
            <Shuffle className="me-1.5 h-4 w-4" aria-hidden />
            {hasMatches
              ? t('sessions.schedule.actions.regenerateSchedule')
              : t('sessions.schedule.actions.generateSchedule')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setRegenerateAllConfirmOpen(true)} disabled={isLoading}>
            <RefreshCw className="me-1.5 h-4 w-4" aria-hidden />
            {t('sessions.schedule.actions.regenerateAll')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setAddMatchOpen(true)}>
            <PlusCircle className="me-1.5 h-4 w-4" aria-hidden />
            {t('sessions.schedule.actions.addManual')}
          </Button>
        </div>
      )}

      {/* Insufficient available players — regeneration paused, nothing destroyed */}
      {insufficientPlayers && (
        <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 px-4 py-2.5 text-sm text-yellow-800 dark:text-yellow-300">
          {t('sessions.runtime.insufficientPlayers')}
        </div>
      )}

      {/* Export actions — clean, control-free printout only (PDF/PNG/JPEG) */}
      {hasMatches && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void handleExport('pdf')} disabled={exporting !== null}>
            <FileDown className="me-1.5 h-4 w-4" aria-hidden />
            {exporting === 'pdf' ? t('sessions.schedule.actions.exporting') : t('sessions.schedule.actions.exportPdf')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void handleExport('png')} disabled={exporting !== null}>
            <Image className="me-1.5 h-4 w-4" aria-hidden />
            {exporting === 'png' ? t('sessions.schedule.actions.exporting') : t('sessions.schedule.actions.exportPng')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void handleExport('jpeg')} disabled={exporting !== null}>
            <FileImage className="me-1.5 h-4 w-4" aria-hidden />
            {exporting === 'jpeg' ? t('sessions.schedule.actions.exporting') : t('sessions.schedule.actions.exportJpeg')}
          </Button>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span>
          <strong className="text-foreground">{playerIds.length}</strong>
          {' '}{t('sessions.schedule.summary.players')}
        </span>
        <span>
          <strong className="text-foreground">{schedule.matches.length}</strong>
          {' '}{t('sessions.schedule.summary.matches')}
        </span>
        <Badge variant="outline" className="text-xs">
          {t('sessions.schedule.summary.version', { n: schedule.version })}
        </Badge>
      </div>

      <Separator />

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
          {t('sessions.schedule.generating')}
        </div>
      )}

      {/* Match list — grouped into lightweight Round wrappers only. Every
          PlannedMatchCard below is rendered with the exact same props as
          before; only a "Round N" header and a per-round Standby line are
          inserted around the existing cards. */}
      {hasMatches ? (
        <div className="space-y-6">
          {rounds.map((round, roundIndex) => {
            // Sprint: Critical Runtime Review — a round's matches are only
            // startable once every earlier round is fully terminal. Computed
            // once per round here (not inside PlannedMatchCard) since it
            // needs the full round list, not just one match.
            const canStartThisRound = rounds.slice(0, roundIndex).every(r => {
              const status = deriveRoundStatus(r)
              return status === 'FINISHED' || status === 'CANCELLED'
            })

            return (
            <div key={round.roundNumber} className="space-y-3">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                {t('sessions.schedule.round.title', { n: round.roundNumber })}
                <Badge variant="outline" className="gap-1.5 text-xs font-normal">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${roundStatusDotColor(deriveRoundStatus(round))}`} aria-hidden />
                  {roundStatusLabel(t, deriveRoundStatus(round))}
                </Badge>
              </h3>

              {round.slots.map(slot => (
                slot.match.matchStatus === 'LIVE' && onScoreChange && onFinishMatch ? (
                  <LiveMatchCard
                    key={slot.match.id}
                    match={slot.match}
                    index={slot.matchIndex}
                    playerName={playerName}
                    onScoreChange={onScoreChange}
                    onFinishMatch={onFinishMatch}
                    onCancelMatch={onCancelMatch}
                    onSwapPlayer={() => setSwapMatch(slot.match)}
                    onLock={onLockMatch}
                    onUnlock={onUnlockMatch}
                    disabled={isLoading}
                  />
                ) : (
                  <PlannedMatchCard
                    key={slot.match.id}
                    match={slot.match}
                    index={slot.matchIndex}
                    playerName={playerName}
                    onLock={isPlanning ? onLockMatch : undefined}
                    onUnlock={isPlanning ? onUnlockMatch : undefined}
                    onRemove={isPlanning ? () => setRemoveMatchId(slot.match.id) : undefined}
                    onSwapPlayer={isPlanning ? () => setSwapMatch(slot.match) : undefined}
                    onStartMatch={onStartMatch}
                    canStart={canStartThisRound}
                    disabled={isLoading}
                  />
                )
              ))}

              {roundStandbyNames(round).length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('sessions.schedule.round.standby')}: {roundStandbyNames(round).join(', ')}
                </p>
              )}
            </div>
            )
          })}
        </div>
      ) : (
        !isLoading && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t('sessions.schedule.empty')}
          </p>
        )
      )}

      <SwapPlayerDialog
        match={swapMatch}
        attendees={attendees}
        open={swapMatch !== null}
        onClose={() => setSwapMatch(null)}
        onSwap={onSwapPlayer}
      />

      <AddManualMatchDialog
        attendees={attendees}
        open={isAddMatchOpen}
        onClose={() => setAddMatchOpen(false)}
        onSubmit={onAddManualMatch}
      />

      <ConfirmActionDialog
        open={isRegenerateAllConfirmOpen}
        title={t('sessions.schedule.regenerateAllConfirm.title')}
        description={t('sessions.schedule.regenerateAllConfirm.description')}
        confirmLabel={t('sessions.schedule.regenerateAllConfirm.confirm')}
        cancelLabel={t('sessions.schedule.regenerateAllConfirm.cancel')}
        isPending={isLoading}
        onConfirm={() => { onRegenerateAll(); setRegenerateAllConfirmOpen(false) }}
        onClose={() => setRegenerateAllConfirmOpen(false)}
      />

      <ConfirmActionDialog
        open={removeMatchId !== null}
        title={t('sessions.schedule.removeMatchConfirm.title')}
        description={t('sessions.schedule.removeMatchConfirm.description')}
        confirmLabel={t('sessions.schedule.removeMatchConfirm.confirm')}
        cancelLabel={t('sessions.schedule.removeMatchConfirm.cancel')}
        isPending={isLoading}
        onConfirm={() => {
          if (removeMatchId) onRemoveMatch(removeMatchId)
          setRemoveMatchId(null)
        }}
        onClose={() => setRemoveMatchId(null)}
      />

      {/* Off-screen printable schedule — export source of truth. Never
          visible to the organiser; rendered only so html2canvas has a real
          laid-out DOM node to rasterize. */}
      <div className="print:hidden" style={{ position: 'fixed', top: 0, left: '-10000px', pointerEvents: 'none' }} aria-hidden="true">
        <SchedulePrintout
          ref={printoutRef}
          sessionName={session.name}
          dateLabel={formatSessionDate(session.scheduled_at, i18n.language)}
          timeLabel={formatSessionTime(session.scheduled_at, i18n.language)}
          formatName={formatName}
          playerCount={playerIds.length}
          courtCount={courtCount}
          matches={schedule.matches}
          attendees={attendees}
          playerName={playerName}
          roundLabel={n => t('sessions.schedule.round.title', { n })}
          standbyLabel={t('sessions.schedule.round.standby')}
          teamALabel={t('sessions.schedule.match.teamA')}
          teamBLabel={t('sessions.schedule.match.teamB')}
          vsLabel={t('matches.vs')}
        />
      </div>
    </div>
  )
}
