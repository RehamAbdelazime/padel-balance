import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { scheduleService } from '../services/schedule.service'
import { matchRuntimeService } from '../services/match-runtime.service'
import { playerRuntimeService } from '../services/player-runtime.service'
import { schedulePersistenceService } from '../services/schedule-persistence.service'
import { friendlyScheduleErrorMessage } from '../utils'
import { useCurrentGroupStore } from '@/app/store/current-group.store'
import type { SessionSchedule, PlayerRuntimeStatus, LiveMatchScore } from '../types'
import type { RuntimeActionOutcome } from '../services/player-runtime.service'

const NO_CURRENT_GROUP_ERROR = 'No current group selected'

export type RuntimeRecoveryAction = 'REST' | 'RETURN' | 'LEAVE' | 'ABSENT' | 'REPLACE'

export type RuntimeRecovery = {
  readonly action:           RuntimeRecoveryAction
  readonly playerId:         string
  readonly previousSchedule: SessionSchedule
}

/** One-level undo — the schedule exactly as it was before the last undoable action. */
export type LastRuntimeAction = {
  readonly previousSchedule: SessionSchedule
}

/**
 * Manages the persisted SessionSchedule for the planning workflow.
 *
 * On mount, loads the session's saved schedule (if any) — it is never
 * regenerated automatically. Sync operations update state immediately and
 * never set isLoading (their persistence save happens in the background,
 * inside schedule.service). Async operations set isLoading and show a toast
 * on error. Components call these methods — no business logic inside React.
 *
 * Runtime player-management actions (rest/leave/absent/replace) never
 * surface a plain error toast for "not enough players" — when regeneration
 * can't proceed, `recovery` is set instead so the UI can offer undo/replace/
 * reduce-courts/finish-session instead of a dead end.
 */
export function useSchedule(sessionId: string) {
  const { t } = useTranslation()
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)
  const [schedule, setSchedule]             = useState<SessionSchedule | null>(null)
  const [formatId, setFormatId]             = useState<string | null>(null)
  const [isLoading, setIsLoading]           = useState(false)
  const [isInitialLoading, setInitialLoading] = useState(true)
  const [error,     setError]               = useState<string | null>(null)
  const [recovery,  setRecovery]            = useState<RuntimeRecovery | null>(null)
  const [lastAction, setLastAction]         = useState<LastRuntimeAction | null>(null)

  // ── Initial load — restores the persisted schedule; never generates one ────
  useEffect(() => {
    let cancelled = false
    if (!sessionId) {
      setInitialLoading(false)
      return
    }
    setInitialLoading(true)
    scheduleService.loadSchedule(sessionId)
      .then(persisted => {
        if (cancelled) return
        setSchedule(persisted?.schedule ?? null)
        setFormatId(persisted?.formatId ?? null)
      })
      .catch(e => {
        if (cancelled) return
        const rawMsg = e instanceof Error ? e.message : String(e)
        setError(friendlyScheduleErrorMessage(rawMsg))
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false)
      })
    return () => { cancelled = true }
  }, [sessionId])

  // ── Async helper ────────────────────────────────────────────────────────────
  async function runAsync(op: () => Promise<SessionSchedule>): Promise<void> {
    if (!sessionId) return
    setIsLoading(true)
    setError(null)
    try {
      const updated = await op()
      setSchedule(updated)
    } catch (e) {
      const rawMsg = e instanceof Error ? e.message : String(e)
      const msg    = friendlyScheduleErrorMessage(rawMsg)
      setError(msg)
      toast.error(t('sessions.schedule.toasts.error', { message: msg }))
    } finally {
      setIsLoading(false)
    }
  }

  // ── Sync helper ─────────────────────────────────────────────────────────────
  function runSync(op: (s: SessionSchedule) => SessionSchedule, undoable = false): void {
    if (!schedule) return
    const previousSchedule = schedule
    try {
      setSchedule(op(schedule))
      if (undoable) setLastAction({ previousSchedule })
    } catch (e) {
      const rawMsg = e instanceof Error ? e.message : String(e)
      const msg    = friendlyScheduleErrorMessage(rawMsg)
      setError(msg)
      toast.error(t('sessions.schedule.toasts.error', { message: msg }))
    }
  }

  /**
   * Runs a player-runtime action. Never toasts "not enough players" — if
   * regeneration couldn't proceed, sets `recovery` (with the pre-action
   * schedule so Undo can restore it exactly) instead. Genuinely unexpected
   * errors still toast, same as runAsync. Every player-runtime action is
   * undoable, so `lastAction` is always recorded on success.
   */
  async function runRuntimeAction(
    action: RuntimeRecoveryAction,
    playerId: string,
    op: (current: SessionSchedule) => Promise<RuntimeActionOutcome>,
  ): Promise<void> {
    if (!schedule) return
    const previousSchedule = schedule
    setIsLoading(true)
    setError(null)
    try {
      const { schedule: updated, regenerationFailed } = await op(previousSchedule)
      setSchedule(updated)
      setLastAction({ previousSchedule })
      if (regenerationFailed) {
        setRecovery({ action, playerId, previousSchedule })
      }
    } catch (e) {
      const rawMsg = e instanceof Error ? e.message : String(e)
      const msg    = friendlyScheduleErrorMessage(rawMsg)
      setError(msg)
      toast.error(t('sessions.schedule.toasts.error', { message: msg }))
    } finally {
      setIsLoading(false)
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  return {
    schedule,
    formatId,
    isLoading,
    isInitialLoading,
    error,
    recovery,

    // ── Async operations ───────────────────────────────────────────────────────
    create: (count: number) =>
      runAsync(async () => {
        if (!currentGroupId) throw new Error(NO_CURRENT_GROUP_ERROR)
        const created = await scheduleService.createSchedule(currentGroupId, sessionId, count)
        setFormatId('custom')
        return created
      }),

    /** Regenerate the match at the given 0-based index. */
    regenerateAt: (index: number) =>
      schedule
        ? runAsync(() => {
            if (!currentGroupId) throw new Error(NO_CURRENT_GROUP_ERROR)
            return scheduleService.regenerateCurrentMatch(
              currentGroupId,
              { ...schedule, currentMatchIndex: index },
              sessionId,
            )
          })
        : void 0,

    /** Regenerate all matches after the given 0-based from-index. */
    regenerateFrom: (fromIndex: number) =>
      schedule
        ? runAsync(() => {
            if (!currentGroupId) throw new Error(NO_CURRENT_GROUP_ERROR)
            // service reads (currentMatchIndex ?? 0) + 1 as the start
            return scheduleService.regenerateRemainingMatches(
              currentGroupId,
              { ...schedule, currentMatchIndex: fromIndex - 1 },
              sessionId,
            )
          })
        : void 0,

    regenerateAll: () =>
      schedule
        ? runAsync(() => {
            if (!currentGroupId) throw new Error(NO_CURRENT_GROUP_ERROR)
            return scheduleService.regenerateEntireSchedule(currentGroupId, schedule, sessionId)
          })
        : void 0,

    recalculate: () =>
      schedule
        ? runAsync(() => {
            if (!currentGroupId) throw new Error(NO_CURRENT_GROUP_ERROR)
            return scheduleService.recalculateBalanceOnly(currentGroupId, schedule, sessionId)
          })
        : void 0,

    // ── Sync operations (persisted in the background by schedule.service) ─────
    lockMatch:   (id: string) => runSync(s => scheduleService.lockMatch(s, id)),
    unlockMatch: (id: string) => runSync(s => scheduleService.unlockMatch(s, id)),
    removeMatch: (id: string) => runSync(s => scheduleService.removeMatch(s, id)),

    addManualMatch: (
      teamA: readonly [string, string],
      teamB: readonly [string, string],
    ) => runSync(s => scheduleService.addManualMatch(s, teamA, teamB)),

    /** Also used for Replace Player → "This Round Only" mode (a same-match swap). */
    swapPlayer: (matchId: string, fromId: string, toId: string) =>
      runSync(s => scheduleService.swapPlayer(s, matchId, fromId, toId)),

    setPlayerStatus: (playerId: string, status: PlayerRuntimeStatus) =>
      runSync(s => scheduleService.setPlayerStatus(s, playerId, status)),

    /**
     * Initializes match runtime statuses (first N matches -> LIVE, rest ->
     * PENDING). `courtCount` should come from the session's configured
     * Number of Courts; falls back to inferring from the schedule's matches
     * if omitted.
     */
    startMatches: (courtCount?: number) => runSync(s => scheduleService.startMatches(s, courtCount)),

    // ── Live runtime operations ─────────────────────────────────────────────────
    /** Starts a Pending match (Critical Runtime Review) — validates round order, court conflicts, and player conflicts. */
    startMatch: (matchId: string, courtCount: number) =>
      runSync(s => matchRuntimeService.startMatch(s, matchId, courtCount), true),

    /** Autosaves an in-progress score for a LIVE match. Either side may be null. */
    setLiveScore: (matchId: string, score: LiveMatchScore) =>
      runSync(s => matchRuntimeService.setLiveScore(s, matchId, score)),

    /** Validates, locks the score, marks the match FINISHED. Does not auto-start the next round — the organiser starts each match explicitly. */
    finishMatch: (matchId: string, courtCount: number) =>
      runSync(s => matchRuntimeService.finishMatch(s, matchId, courtCount), true),

    /** Cancels a LIVE or PENDING match (never a FINISHED one) — counts as terminal for round advancement. */
    cancelMatch: (matchId: string, courtCount: number) =>
      runSync(s => matchRuntimeService.cancelMatch(s, matchId, courtCount), true),

    // ── Runtime player management ───────────────────────────────────────────────
    restNextRound: (playerId: string) =>
      void runRuntimeAction('REST', playerId, s => {
        if (!currentGroupId) return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
        return playerRuntimeService.restNextRound(currentGroupId, sessionId, s, playerId)
      }),

    returnToRotation: (playerId: string) =>
      void runRuntimeAction('RETURN', playerId, s => {
        if (!currentGroupId) return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
        return playerRuntimeService.returnToRotation(currentGroupId, sessionId, s, playerId)
      }),

    leaveSession: (playerId: string) =>
      void runRuntimeAction('LEAVE', playerId, s => {
        if (!currentGroupId) return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
        return playerRuntimeService.leaveSession(currentGroupId, sessionId, s, playerId)
      }),

    markAbsent: (playerId: string) =>
      void runRuntimeAction('ABSENT', playerId, s => {
        if (!currentGroupId) return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
        return playerRuntimeService.markAbsent(currentGroupId, sessionId, s, playerId)
      }),

    /** Replace Player → "Remaining Session" mode. */
    replacePlayer: (oldPlayerId: string, newPlayerId: string) =>
      void runRuntimeAction(
        'REPLACE', oldPlayerId,
        s => {
          if (!currentGroupId) return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
          return playerRuntimeService.replacePlayer(currentGroupId, sessionId, s, oldPlayerId, newPlayerId)
        },
      ),

    // ── Recovery (when a runtime action's regeneration couldn't proceed) ──────
    /** Reverts to the schedule exactly as it was before the failed action. */
    undoRecovery: () => {
      if (!recovery) return
      setSchedule(recovery.previousSchedule)
      void schedulePersistenceService.saveSchedule(sessionId, recovery.previousSchedule).catch(err => {
        console.error('[useSchedule] undo save failed:', err)
      })
      setRecovery(null)
    },
    dismissRecovery: () => setRecovery(null),

    // ── Undo (one level) — Finish Match, Cancel Match, Rest, Return, Leave, Absent, Replace ──
    lastAction,
    undoLastAction: () => {
      if (!lastAction) return
      setSchedule(lastAction.previousSchedule)
      void schedulePersistenceService.saveSchedule(sessionId, lastAction.previousSchedule).catch(err => {
        console.error('[useSchedule] undo save failed:', err)
      })
      setLastAction(null)
    },

    reset: () => {
      setSchedule(null)
      setFormatId(null)
      setError(null)
      setRecovery(null)
      setLastAction(null)
    },
  }
}

export type ScheduleHook = ReturnType<typeof useSchedule>
