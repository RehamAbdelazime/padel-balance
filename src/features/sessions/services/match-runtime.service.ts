import type { SessionSchedule, PlannedMatch, LiveMatchScore } from '../types'
import { nextSchedule, groupMatchesIntoRounds, deriveRoundStatus } from '../utils'
import { schedulePersistenceService } from './schedule-persistence.service'
import { sessionsService } from './sessions.service'
import { runtimeAuditService } from './runtime-audit.service'

/**
 * match-runtime.service — Live-phase match execution. Deliberately separate
 * from schedule.service (Planning): Planning generates/edits the schedule
 * before the session starts; this service only ever touches score entry and
 * match/round PENDING→LIVE→FINISHED/CANCELLED transitions once the session
 * is LIVE. Neither reuses the other's mutation functions, so Planning stays
 * fully immutable once the session has started — this module is the only
 * writer of runtime state (score, matchStatus) from that point on.
 *
 * Round progression is driven entirely by matchStatus (see
 * utils/schedule-rounds.ts `deriveRoundStatus`) — there is no separately
 * stored round status to keep in sync. Session completion is driven the
 * same way: once every round is terminal (FINISHED/CANCELLED), the session
 * itself is automatically finished — no organiser action required.
 *
 * Critical Runtime Review: matches no longer auto-transition to LIVE, ever
 * — not at session start (schedule.service's startMatches), and not when a
 * round completes. The organiser explicitly starts each PENDING match via
 * `startMatch`, which is the only place PENDING -> LIVE happens. This is
 * what makes "the organiser always knows which match is live, which is
 * next, which is finished" true: nothing changes state without them
 * pressing something.
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
 * Logs when the round containing `changedMatchId` has just become fully
 * terminal (every match FINISHED or CANCELLED) — purely an audit-trail
 * entry. Does NOT touch any other match's status: the next round's matches
 * stay PENDING, exactly as they already were, and immediately expose Start
 * Match (any PENDING match does — see startMatch's round-order check,
 * which is what actually gates "the next round becomes available").
 */
function logRoundCompletionIfNeeded(
  matches: readonly PlannedMatch[],
  courtCount: number,
  sessionId: string,
  changedMatchId: string,
): void {
  const rounds = groupMatchesIntoRounds(matches, courtCount)
  const round = rounds.find(r => r.slots.some(s => s.match.id === changedMatchId))
  if (!round) return

  const status = deriveRoundStatus(round)
  if (status !== 'FINISHED' && status !== 'CANCELLED') return

  logEvent(sessionId, 'ROUND_FINISHED', `Round ${round.roundNumber} finished.`, { roundNumber: round.roundNumber })
}

/**
 * Start Match (Critical Runtime Review) — the only place a match ever
 * transitions PENDING -> LIVE. Enforces every validation rule a live
 * tournament controller needs:
 *   - the match must actually be PENDING (never re-starts a LIVE/FINISHED/
 *     CANCELLED match);
 *   - every earlier round must already be fully terminal — this is what
 *     makes "the next round becomes available" mean something concrete,
 *     rather than every PENDING match everywhere being startable at once;
 *   - no other LIVE match may already be using the same court;
 *   - none of this match's 4 players may already be live in another match
 *     (can happen across courts within the same round with some formats).
 */
function startMatch(
  schedule: SessionSchedule,
  matchId: string,
  courtCount: number,
): SessionSchedule {
  const idx = schedule.matches.findIndex(m => m.id === matchId)
  if (idx === -1) throw new Error(`startMatch: match ${matchId} not found.`)
  const match = schedule.matches[idx]!
  if (match.matchStatus !== 'PENDING') {
    throw new Error(`startMatch: match ${matchId} is not Pending.`)
  }

  const rounds = groupMatchesIntoRounds(schedule.matches, courtCount)
  const matchRound = rounds.find(r => r.slots.some(s => s.match.id === matchId))
  if (matchRound) {
    const earlierRoundsTerminal = rounds
      .filter(r => r.roundNumber < matchRound.roundNumber)
      .every(r => {
        const status = deriveRoundStatus(r)
        return status === 'FINISHED' || status === 'CANCELLED'
      })
    if (!earlierRoundsTerminal) {
      throw new Error('startMatch: an earlier round has not finished yet.')
    }
  }

  if (match.courtNumber !== null) {
    const courtConflict = schedule.matches.some(
      m => m.id !== matchId && m.courtNumber === match.courtNumber && m.matchStatus === 'LIVE',
    )
    if (courtConflict) {
      throw new Error('startMatch: another match is already live on this court.')
    }
  }

  const thisMatchPlayers = [...match.teamA, ...match.teamB]
  const playerConflict = schedule.matches.some(
    m => m.id !== matchId && m.matchStatus === 'LIVE'
      && [...m.teamA, ...m.teamB].some(playerId => thisMatchPlayers.includes(playerId)),
  )
  if (playerConflict) {
    throw new Error('startMatch: a player in this match is already live in another match.')
  }

  const liveMatch: PlannedMatch = { ...match, matchStatus: 'LIVE' }
  const newMatches = schedule.matches.map((m, i) => (i === idx ? liveMatch : m))
  const updated = nextSchedule(schedule, { matches: newMatches })
  persistInBackground(schedule.sessionId, updated)

  logEvent(schedule.sessionId, 'ROUND_STARTED', `Match started${match.courtNumber !== null ? ` on Court ${match.courtNumber}` : ''}.`,
    matchRound ? { roundNumber: matchRound.roundNumber } : undefined)

  return updated
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
  const updated           = nextSchedule(schedule, { matches: withFinishedMatch })
  persistInBackground(schedule.sessionId, updated)

  logEvent(schedule.sessionId, 'MATCH_FINISHED', `Match finished: ${team1}–${team2}.`)
  logRoundCompletionIfNeeded(withFinishedMatch, courtCount, schedule.sessionId, matchId)
  finishSessionIfComplete(withFinishedMatch, courtCount, schedule.sessionId)

  return updated
}

/**
 * Cancels a match (LIVE or PENDING — a FINISHED match can never be
 * cancelled). Counts as terminal for round-completion purposes, so
 * cancelling the last open match in a round can complete it (and expose
 * the next round's Start Match) or finish the session exactly like Finish
 * Match does.
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
  const updated            = nextSchedule(schedule, { matches: withCancelledMatch })
  persistInBackground(schedule.sessionId, updated)

  logEvent(schedule.sessionId, 'MATCH_CANCELLED', 'Match cancelled.')
  logRoundCompletionIfNeeded(withCancelledMatch, courtCount, schedule.sessionId, matchId)
  finishSessionIfComplete(withCancelledMatch, courtCount, schedule.sessionId)

  return updated
}

export const matchRuntimeService = {
  startMatch,
  setLiveScore,
  finishMatch,
  cancelMatch,
} as const
