import type { SessionSchedule, PlannedMatch, LiveMatchScore, MatchRuntimeStatus } from '../types'
import { nextSchedule, groupMatchesIntoRounds, deriveRoundStatus } from '../utils'
import { schedulePersistenceService } from './schedule-persistence.service'
import { sessionsService } from './sessions.service'
import { runtimeAuditService } from './runtime-audit.service'

/**
 * match-runtime.service — Live-phase match execution. Deliberately separate
 * from schedule.service (Planning): Planning generates/edits the schedule
 * before the session starts; this service only ever touches score entry and
 * match/round LIVE↔FINISHED/CANCELLED transitions once the session is LIVE.
 * Neither reuses the other's mutation functions, so Planning stays fully
 * immutable once the session has started — this module is the only writer
 * of runtime state (score, matchStatus) from that point on.
 *
 * Round progression is driven entirely by matchStatus (see
 * utils/schedule-rounds.ts `deriveRoundStatus`) — there is no separately
 * stored round status to keep in sync. Session completion is driven the
 * same way: once every round is terminal (FINISHED/CANCELLED), the session
 * itself is automatically finished — no organiser action required.
 */

function persistInBackground(sessionId: string, schedule: SessionSchedule): void {
  void schedulePersistenceService.saveSchedule(sessionId, schedule).catch(err => {
    console.error('[match-runtime.service] background save failed:', err)
  })
}

function logEvent(
  sessionId: string,
  eventType: Parameters<typeof runtimeAuditService.logEvent>[1],
  message: string,
  options?: { roundNumber?: number },
): void {
  void runtimeAuditService.logEvent(sessionId, eventType, null, message, options).catch(err => {
    console.error('[match-runtime.service] audit log failed:', err)
  })
}

/**
 * Autosaves the organiser's in-progress score entry for a LIVE match. Either
 * side may be null (not yet typed). Never changes matchStatus or isCompleted.
 */
function setLiveScore(
  schedule: SessionSchedule,
  matchId: string,
  score: LiveMatchScore,
): SessionSchedule {
  const idx = schedule.matches.findIndex(m => m.id === matchId)
  if (idx === -1) throw new Error(`setLiveScore: match ${matchId} not found.`)
  const match = schedule.matches[idx]!
  if (match.matchStatus !== 'LIVE') {
    throw new Error(`setLiveScore: match ${matchId} is not LIVE.`)
  }

  const updatedMatch: PlannedMatch = { ...match, result: score }
  const newMatches = schedule.matches.map((m, i) => (i === idx ? updatedMatch : m))
  const updated = nextSchedule(schedule, { matches: newMatches })
  persistInBackground(schedule.sessionId, updated)
  return updated
}

/**
 * If the round containing the just-changed match has become fully terminal
 * (every match FINISHED or CANCELLED), transitions the next round's matches
 * from PENDING to LIVE. Only one round is ever LIVE at a time.
 */
function advanceRoundIfComplete(
  matches: readonly PlannedMatch[],
  courtCount: number,
  sessionId: string,
): PlannedMatch[] {
  const rounds = groupMatchesIntoRounds(matches, courtCount)
  const liveRoundIndex = rounds.findIndex(r => deriveRoundStatus(r) === 'LIVE')
  if (liveRoundIndex === -1) return [...matches]

  const liveRound = rounds[liveRoundIndex]!
  const liveRoundStatus = deriveRoundStatus(liveRound)
  if (liveRoundStatus !== 'FINISHED' && liveRoundStatus !== 'CANCELLED') return [...matches]

  logEvent(sessionId, 'ROUND_FINISHED', `Round ${liveRound.roundNumber} finished.`, { roundNumber: liveRound.roundNumber })

  const nextRound = rounds[liveRoundIndex + 1]
  if (!nextRound) return [...matches]

  logEvent(sessionId, 'ROUND_STARTED', `Round ${nextRound.roundNumber} started.`, { roundNumber: nextRound.roundNumber })

  const nextRoundMatchIds = new Set(nextRound.slots.map(s => s.match.id))
  return matches.map(m => {
    if (!nextRoundMatchIds.has(m.id)) return m
    const matchStatus: MatchRuntimeStatus = 'LIVE'
    return { ...m, matchStatus }
  })
}

/** Once every round is terminal (FINISHED/CANCELLED), the session finishes itself — no organiser action required. */
function finishSessionIfComplete(matches: readonly PlannedMatch[], courtCount: number, sessionId: string): void {
  const rounds = groupMatchesIntoRounds(matches, courtCount)
  const allTerminal = rounds.length > 0 && rounds.every(r => {
    const status = deriveRoundStatus(r)
    return status === 'FINISHED' || status === 'CANCELLED'
  })
  if (!allTerminal) return

  void sessionsService.finishSession(sessionId).catch(err => {
    console.error('[match-runtime.service] auto-finish session failed:', err)
  })
  logEvent(sessionId, 'SESSION_FINISHED', 'Session finished automatically — every round is complete.')
}

/**
 * Finalizes a LIVE match: validates the score, locks it in, marks the match
 * FINISHED, and — if that completes its round — automatically moves the
 * next round's matches to LIVE, or finishes the session if there is no next
 * round.
 *
 * @throws {Error} if either score is missing, negative, not an integer, or
 *   equal (this format does not allow draws).
 */
function finishMatch(
  schedule: SessionSchedule,
  matchId: string,
  courtCount: number,
): SessionSchedule {
  const idx = schedule.matches.findIndex(m => m.id === matchId)
  if (idx === -1) throw new Error(`finishMatch: match ${matchId} not found.`)
  const match = schedule.matches[idx]!
  if (match.matchStatus !== 'LIVE') {
    throw new Error(`finishMatch: match ${matchId} is not LIVE.`)
  }

  const { team1, team2 } = match.result ?? { team1: null, team2: null }
  if (team1 === null || team2 === null) {
    throw new Error('finishMatch: enter both scores before finishing the match.')
  }
  if (!Number.isInteger(team1) || !Number.isInteger(team2) || team1 < 0 || team2 < 0) {
    throw new Error('finishMatch: scores must be whole numbers of 0 or higher.')
  }
  if (team1 === team2) {
    throw new Error('finishMatch: scores cannot be equal — this format does not allow draws.')
  }

  const finishedMatch: PlannedMatch = {
    ...match,
    result:      { team1, team2 },
    isCompleted: true,
    matchStatus: 'FINISHED',
  }

  const withFinishedMatch = schedule.matches.map((m, i) => (i === idx ? finishedMatch : m))
  const newMatches        = advanceRoundIfComplete(withFinishedMatch, courtCount, schedule.sessionId)
  const updated           = nextSchedule(schedule, { matches: newMatches })
  persistInBackground(schedule.sessionId, updated)

  logEvent(schedule.sessionId, 'MATCH_FINISHED', `Match finished: ${team1}–${team2}.`)
  finishSessionIfComplete(newMatches, courtCount, schedule.sessionId)

  return updated
}

/**
 * Cancels a match (LIVE or PENDING — a FINISHED match can never be
 * cancelled). Counts as terminal for round-completion purposes, so
 * cancelling the last open match in a round can advance to the next round
 * or finish the session exactly like Finish Match does.
 */
function cancelMatch(
  schedule: SessionSchedule,
  matchId: string,
  courtCount: number,
): SessionSchedule {
  const idx = schedule.matches.findIndex(m => m.id === matchId)
  if (idx === -1) throw new Error(`cancelMatch: match ${matchId} not found.`)
  const match = schedule.matches[idx]!
  if (match.isCompleted || match.matchStatus === 'FINISHED') {
    throw new Error(`cancelMatch: match ${matchId} is already finished and cannot be cancelled.`)
  }

  const cancelledMatch: PlannedMatch = { ...match, matchStatus: 'CANCELLED' }
  const withCancelledMatch = schedule.matches.map((m, i) => (i === idx ? cancelledMatch : m))
  const newMatches         = advanceRoundIfComplete(withCancelledMatch, courtCount, schedule.sessionId)
  const updated            = nextSchedule(schedule, { matches: newMatches })
  persistInBackground(schedule.sessionId, updated)

  logEvent(schedule.sessionId, 'MATCH_CANCELLED', 'Match cancelled.')
  finishSessionIfComplete(newMatches, courtCount, schedule.sessionId)

  return updated
}

export const matchRuntimeService = {
  setLiveScore,
  finishMatch,
  cancelMatch,
} as const
