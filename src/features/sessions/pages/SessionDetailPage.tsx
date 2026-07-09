import { useState, useMemo } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  LayoutGrid,
  Pencil,
  Archive,
  RefreshCw,
  AlertCircle,
  StickyNote,
  Users,
  PlayCircle,
  CheckCircle2,
  CalendarClock,
  Radio,
  FlagOff,
  Undo2,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'
import {
  useSessionQuery,
  useStartSessionMutation,
  useFinishSessionMutation,
} from '../hooks/useSessions'
import { useSessionAttendanceQuery } from '../hooks/useAttendance'
import { useSessionMatchesQuery } from '../hooks/useMatches'
import { useSchedule } from '../hooks/useSchedule'
import { useAutoStartSession } from '../hooks/useAutoStartSession'
import { AttendancePanel } from '../components/AttendancePanel'
import { MatchCard } from '../components/MatchCard'
import { SessionFormDialog } from '../components/SessionFormDialog'
import { SessionArchiveDialog } from '../components/SessionArchiveDialog'
import { PostponeSessionDialog } from '../components/PostponeSessionDialog'
import { MatchFormDialog } from '../components/MatchFormDialog'
import { EditScoreDialog } from '../components/EditScoreDialog'
import { SessionReadyCard } from '../components/SessionReadyCard'
import { SchedulePlanningWizard } from '../components/SchedulePlanningWizard'
import { ScheduleReviewPanel } from '../components/ScheduleReviewPanel'
import { RuntimeRecoveryDialog } from '../components/RuntimeRecoveryDialog'
import { ReplacePlayerDialog } from '../components/ReplacePlayerDialog'
import { AddReplacementDialog } from '../components/AddReplacementDialog'
import { ConfirmActionDialog } from '../components/ConfirmActionDialog'
import type { Session, SessionStatus, MatchWithTeams } from '../types'
import type { TournamentPlan } from '../planner'
import { formatSessionDate, formatSessionTime, getReplacementCandidates } from '../utils'
// Cross-feature import: sessions depend on players for attendance management.
import { usePlayersQuery } from '@/features/players/hooks/usePlayers'

// ── Helper ────────────────────────────────────────────────────────────────────

function statusBadgeVariant(status: SessionStatus): 'outline' | 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'PLANNING':  return 'outline'
    case 'LIVE':      return 'default'
    case 'FINISHED':  return 'secondary'
    case 'CANCELLED': return 'destructive'
    default:          return 'outline'
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SessionDetailPage() {
  const { t, i18n } = useTranslation()
  const navigate     = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()

  // ── All hooks unconditionally at the top (Rules of Hooks) ─────────────────

  const sessionQuery    = useSessionQuery(sessionId ?? '')
  const attendanceQuery = useSessionAttendanceQuery(sessionId ?? '')
  const matchesQuery    = useSessionMatchesQuery(sessionId ?? '')
  const playersQuery    = usePlayersQuery()
  const scheduleHook    = useSchedule(sessionId ?? '')
  const startMutation   = useStartSessionMutation()
  const finishMutation  = useFinishSessionMutation()

  useAutoStartSession(sessionQuery.data, () => scheduleHook.startMatches(sessionQuery.data?.court_count))

  // ── Dialog / UI state ────────────────────────────────────────────────────

  const [editDialogSession,    setEditDialogSession]    = useState<Session | null>(null)
  const [isEditOpen,           setEditOpen]             = useState(false)
  const [archiveDialogSession, setArchiveDialogSession] = useState<Session | null>(null)
  const [isArchiveOpen,        setArchiveOpen]          = useState(false)
  const [isMatchDialogOpen,    setMatchDialogOpen]      = useState(false)
  const [rematchSource,        setRematchSource]        = useState<MatchWithTeams | null>(null)
  const [editScoreMatch,       setEditScoreMatch]       = useState<MatchWithTeams | null>(null)
  const [isEditScoreOpen,      setEditScoreOpen]        = useState(false)
  const [isGenerateDialogOpen, setGenerateDialogOpen]   = useState(false)
  const [isPostponeOpen,       setPostponeOpen]         = useState(false)
  const [recoveryReplaceTargetId, setRecoveryReplaceTargetId] = useState<string | null>(null)
  const [addReplacementTargetId, setAddReplacementTargetId]   = useState<string | null>(null)
  const [isFinishConfirmOpen, setFinishConfirmOpen]     = useState(false)

  // Stable rematch player IDs derived from the selected match.
  // Must be computed at hook level — not inside a conditional branch.
  const rematchPlayerIds = useMemo<string[] | undefined>(() => {
    if (!rematchSource) return undefined
    return [
      rematchSource.match_teams[0]?.match_team_players[0]?.player_id ?? '',
      rematchSource.match_teams[0]?.match_team_players[1]?.player_id ?? '',
      rematchSource.match_teams[1]?.match_team_players[0]?.player_id ?? '',
      rematchSource.match_teams[1]?.match_team_players[1]?.player_id ?? '',
    ]
  }, [rematchSource])

  // ── Event handlers ────────────────────────────────────────────────────────

  const openEdit    = (s: Session) => { setEditDialogSession(s); setEditOpen(true) }
  const openArchive = (s: Session) => { setArchiveDialogSession(s); setArchiveOpen(true) }
  const handleRematch   = (m: MatchWithTeams) => { setRematchSource(m); setMatchDialogOpen(true) }
  const handleEditScore = (m: MatchWithTeams) => { setEditScoreMatch(m); setEditScoreOpen(true) }

  /**
   * Organiser confirmed a TournamentPlan on the wizard's preview step.
   * Deferred by design: schedule generation runs through the existing
   * balanced generator and only reads the estimated match count out of the
   * plan — threading the rest of TournamentPlan's settings into the
   * generator is a Generator-layer change, out of scope here.
   */
  const handleBuildSchedule = (plan: TournamentPlan) => {
    setGenerateDialogOpen(false)
    void scheduleHook.create(plan.estimatedMatches)
  }

  // ── Lifecycle handlers (Sprint F22) ────────────────────────────────────────
  const handleStartSession = () => {
    if (!sessionId) return
    startMutation.mutate(sessionId)
    // Reuses the existing Start Session flow — no second entry point.
    // No-ops if no schedule has been generated yet.
    scheduleHook.startMatches(sessionQuery.data?.court_count)
  }
  const handleFinishSession = () => {
    if (!sessionId) return
    finishMutation.mutate(sessionId, { onSuccess: () => setFinishConfirmOpen(false) })
  }

  // ── Runtime recovery (Sprint RT2) ──────────────────────────────────────────
  // Shown instead of a toast when a runtime player-management action's
  // regeneration couldn't proceed (too few AVAILABLE players). Reduce
  // Courts was removed from here entirely (Sprint RT2): changing a
  // session's court count is session management, not a runtime recovery
  // action — it belongs in Session Settings with its own regeneration flow,
  // never something Runtime reaches for automatically.
  const handleRecoveryFinishSession = () => {
    handleFinishSession()
    scheduleHook.dismissRecovery()
  }

  // ── Conditional returns — only after every hook ────────────────────────────

  if (!sessionId) return <Navigate to="/sessions" replace />

  if (sessionQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw
          className="h-6 w-6 animate-spin text-muted-foreground"
          aria-label={t('common.loading')}
        />
      </div>
    )
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{t('common.error')}</p>
        <Button variant="outline" onClick={() => void sessionQuery.refetch()}>
          <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
          {t('common.retry')}
        </Button>
      </div>
    )
  }

  const session    = sessionQuery.data
  const attendees  = attendanceQuery.data ?? []
  const matches    = matchesQuery.data    ?? []
  const allPlayers = playersQuery.data    ?? []

  // Whether "Replace Player" is a valid option in the Runtime Recovery
  // Dialog right now — Sprint RT2 Section 10: never show an unavailable action.
  const canReplaceInRecovery = scheduleHook.recovery
    ? getReplacementCandidates(
        scheduleHook.recovery.playerId,
        attendees,
        scheduleHook.schedule?.playerStates ?? new Map(),
        scheduleHook.schedule?.matches ?? [],
        session.court_count,
      ).length > 0
    : false

  /**
   * Defensive fallback: if the lifecycle migration (004/005) hasn't been
   * applied to this database yet, `status` comes back undefined even though
   * the Row type declares it non-nullable. Treat that exactly like a brand
   * new session — PLANNING — so the entire planning workflow (Wizard,
   * Build Schedule, review panel, planning actions) keeps working exactly
   * as it did before the lifecycle was introduced, instead of silently
   * disappearing. Once the migration is applied this is a no-op.
   */
  const sessionStatus: SessionStatus = session.status ?? 'PLANNING'
  const isPlanning = sessionStatus === 'PLANNING'
  const isLive     = sessionStatus === 'LIVE'
  const isFinished = sessionStatus === 'FINISHED'

  const statusLabel: Record<SessionStatus, string> = {
    PLANNING:  t('sessions.lifecycle.status.planning'),
    LIVE:      t('sessions.lifecycle.status.live'),
    FINISHED:  t('sessions.lifecycle.status.finished'),
    CANCELLED: t('sessions.lifecycle.status.cancelled'),
  }

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Back navigation */}
        <Button
          variant="ghost"
          size="sm"
          className="-ms-2"
          onClick={() => void navigate('/sessions')}
        >
          <ArrowLeft className="me-1.5 h-4 w-4" aria-hidden="true" />
          {t('sessions.detail.backToSessions')}
        </Button>

        {/* Lifecycle banner — simple, no runtime yet */}
        {isLive && (
          <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary">
            <Radio className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t('sessions.lifecycle.liveBanner')}
          </div>
        )}
        {isFinished && (
          <div className="flex items-center gap-2 rounded-md border bg-muted px-4 py-2.5 text-sm font-medium text-muted-foreground">
            <FlagOff className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t('sessions.lifecycle.finishedBanner')}
          </div>
        )}

        {/* Session header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{session.name}</h1>
              <Badge variant={statusBadgeVariant(sessionStatus)}>
                {statusLabel[sessionStatus]}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                {formatSessionDate(session.scheduled_at, i18n.language)}
                {' – '}
                {formatSessionTime(session.scheduled_at, i18n.language)}
              </span>
              <span className="flex items-center gap-1.5">
                <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t('sessions.detail.courtCount', { count: session.court_count })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t('sessions.detail.bookingDuration', { count: session.booking_duration })}
              </span>
            </div>

            {session.notes && (
              <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <StickyNote className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="whitespace-pre-wrap">{session.notes}</p>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {isPlanning && (
              <>
                <Button size="sm" onClick={handleStartSession} disabled={startMutation.isPending}>
                  <PlayCircle className="me-1.5 h-4 w-4" aria-hidden="true" />
                  {t('sessions.schedule.actions.startSession')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPostponeOpen(true)}>
                  <CalendarClock className="me-1.5 h-4 w-4" aria-hidden="true" />
                  {t('sessions.lifecycle.postpone')}
                </Button>
              </>
            )}
            {isLive && (
              <Button size="sm" onClick={() => setFinishConfirmOpen(true)} disabled={finishMutation.isPending}>
                <CheckCircle2 className="me-1.5 h-4 w-4" aria-hidden="true" />
                {t('sessions.lifecycle.finishSession')}
              </Button>
            )}
            {isLive && scheduleHook.lastAction && (
              <Button variant="outline" size="sm" onClick={() => scheduleHook.undoLastAction()}>
                <Undo2 className="me-1.5 h-4 w-4" aria-hidden="true" />
                {t('sessions.runtime.undoLastAction')}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => openEdit(session)}>
              <Pencil className="me-1.5 h-4 w-4" aria-hidden="true" />
              {t('sessions.editSession')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => openArchive(session)}>
              <Archive className="me-1.5 h-4 w-4" aria-hidden="true" />
              {t('sessions.archiveSession')}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Attendance */}
        <AttendancePanel
          sessionId={sessionId}
          attendees={attendees}
          allPlayers={allPlayers}
          readonly={isFinished}
          isLive={isLive}
          playerStates={scheduleHook.schedule?.playerStates}
          matches={scheduleHook.schedule?.matches}
          courtCount={session.court_count}
          isRuntimeActionPending={scheduleHook.isLoading}
          onRestNextRound={id => scheduleHook.restNextRound(id)}
          onReturnToRotation={id => scheduleHook.returnToRotation(id)}
          onLeaveSession={id => scheduleHook.leaveSession(id)}
          onMarkAbsent={id => scheduleHook.markAbsent(id)}
          onReplacePlayer={(mode, oldId, newId, matchId) =>
            mode === 'THIS_ROUND' && matchId
              ? scheduleHook.swapPlayer(matchId, oldId, newId)
              : scheduleHook.replacePlayer(oldId, newId)
          }
        />

        <Separator />

        {/* ── Workflow section ── */}
        {scheduleHook.isInitialLoading ? (
          // Restoring a persisted schedule — never flash the "Generate" CTA
          // while this is in flight.
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t('sessions.schedule.generating')}
          </div>
        ) : scheduleHook.schedule !== null ? (
          // Schedule exists — show the review panel
          <ScheduleReviewPanel
            schedule={scheduleHook.schedule}
            session={session}
            formatId={scheduleHook.formatId}
            sessionStatus={sessionStatus}
            courtCount={session.court_count}
            attendees={attendees}
            allPlayers={allPlayers}
            isLoading={scheduleHook.isLoading}
            onOpenWizard={() => setGenerateDialogOpen(true)}
            onRegenerateAll={() => void scheduleHook.regenerateAll()}
            onAddManualMatch={(teamA, teamB) => scheduleHook.addManualMatch(teamA, teamB)}
            onLockMatch={id => scheduleHook.lockMatch(id)}
            onUnlockMatch={id => scheduleHook.unlockMatch(id)}
            onRemoveMatch={id => scheduleHook.removeMatch(id)}
            onSwapPlayer={(matchId, fromId, toId) => scheduleHook.swapPlayer(matchId, fromId, toId)}
            onStartMatch={isLive ? matchId => scheduleHook.startMatch(matchId, session.court_count) : undefined}
            onScoreChange={isLive ? (matchId, score) => scheduleHook.setLiveScore(matchId, score) : undefined}
            onFinishMatch={isLive ? matchId => scheduleHook.finishMatch(matchId, session.court_count) : undefined}
            onCancelMatch={isLive ? matchId => scheduleHook.cancelMatch(matchId, session.court_count) : undefined}
          />
        ) : !isPlanning ? null : attendees.length < 4 ? (
          // Not enough players to generate a schedule
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t('sessions.generation.waitingForPlayers')}
          </div>
        ) : (
          // Ready to generate — show the CTA card
          <SessionReadyCard
            playerCount={attendees.length}
            matchesRecorded={matches.length}
            onGenerate={() => setGenerateDialogOpen(true)}
          />
        )}

        {/* ── Match history — section always visible, with an empty state when there's nothing recorded yet ── */}
        <Separator />
        <section aria-label={t('sessions.detail.matches')}>
          <h2 className="mb-4 text-xl font-semibold">
            {t('sessions.detail.matches')}
            {matches.length > 0 && (
              <span className="ms-2 text-sm font-normal text-muted-foreground">
                {t('sessions.detail.matchCount_other', { count: matches.length })}
              </span>
            )}
          </h2>
          {matches.length > 0 ? (
            <div className="space-y-3">
              {matches.map((match, index) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  matchNumber={matches.length - index}
                  onEditScore={handleEditScore}
                  onRematch={handleRematch}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('sessions.detail.noMatches')}
            </p>
          )}
        </section>
      </div>

      {/* ── Dialogs ── */}
      <SchedulePlanningWizard
        open={isGenerateDialogOpen}
        onClose={() => setGenerateDialogOpen(false)}
        onBuildSchedule={handleBuildSchedule}
        isPending={scheduleHook.isLoading}
        playerCount={attendees.length}
        courtCount={session.court_count}
        bookingDuration={session.booking_duration}
      />
      <SessionFormDialog
        session={editDialogSession}
        open={isEditOpen}
        onClose={() => setEditOpen(false)}
      />
      <SessionArchiveDialog
        session={archiveDialogSession}
        open={isArchiveOpen}
        onClose={() => {
          setArchiveOpen(false)
          void navigate('/sessions')
        }}
      />
      <PostponeSessionDialog
        session={session}
        open={isPostponeOpen}
        onClose={() => setPostponeOpen(false)}
      />
      <MatchFormDialog
        sessionId={sessionId}
        attendees={attendees}
        open={isMatchDialogOpen}
        prefillPlayerIds={rematchPlayerIds}
        onClose={() => {
          setMatchDialogOpen(false)
          setRematchSource(null)
        }}
      />
      <EditScoreDialog
        match={editScoreMatch}
        open={isEditScoreOpen}
        onClose={() => setEditScoreOpen(false)}
      />
      <ConfirmActionDialog
        open={isFinishConfirmOpen}
        title={t('sessions.lifecycle.finishConfirm.title')}
        description={t('sessions.lifecycle.finishConfirm.description')}
        confirmLabel={t('sessions.lifecycle.finishConfirm.confirm')}
        cancelLabel={t('sessions.lifecycle.finishConfirm.cancel')}
        isPending={finishMutation.isPending}
        onConfirm={handleFinishSession}
        onClose={() => setFinishConfirmOpen(false)}
      />
      <RuntimeRecoveryDialog
        recovery={scheduleHook.recovery}
        attendees={attendees}
        canReplace={canReplaceInRecovery}
        onUndo={() => scheduleHook.undoRecovery()}
        onOpenReplace={playerId => {
          scheduleHook.dismissRecovery()
          setRecoveryReplaceTargetId(playerId)
        }}
        onOpenAddGuest={playerId => {
          scheduleHook.dismissRecovery()
          setAddReplacementTargetId(playerId)
        }}
        onFinishSession={handleRecoveryFinishSession}
        onDismiss={() => scheduleHook.dismissRecovery()}
      />
      <ReplacePlayerDialog
        outgoing={attendees.find(a => a.player_id === recoveryReplaceTargetId) ?? null}
        attendees={attendees}
        playerStates={scheduleHook.schedule?.playerStates ?? new Map()}
        matches={scheduleHook.schedule?.matches ?? []}
        courtCount={session.court_count}
        open={recoveryReplaceTargetId !== null}
        onClose={() => setRecoveryReplaceTargetId(null)}
        onConfirm={(mode, oldId, newId, matchId) =>
          mode === 'THIS_ROUND' && matchId
            ? scheduleHook.swapPlayer(matchId, oldId, newId)
            : scheduleHook.replacePlayer(oldId, newId)
        }
      />
      <AddReplacementDialog
        open={addReplacementTargetId !== null}
        sessionId={sessionId}
        attendeePlayerIds={attendees.map(a => a.player_id)}
        onClose={() => setAddReplacementTargetId(null)}
        onAdded={newPlayerId => {
          const outgoingId = addReplacementTargetId
          setAddReplacementTargetId(null)
          if (outgoingId) scheduleHook.replacePlayer(outgoingId, newPlayerId)
        }}
      />
    </>
  )
}
