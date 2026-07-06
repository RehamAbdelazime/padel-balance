import type { GeneratorPlayer } from '@/features/team-generator'
import { attendanceService } from './attendance.service'
import { sessionsService } from './sessions.service'
import { schedulePersistenceService } from './schedule-persistence.service'
import { runtimeAuditService } from './runtime-audit.service'
import type { RuntimeEventType } from './runtime-audit.service'
import { computeQuality } from '../generators/custom.generator'
import { getAllConstraints } from '../constraints'
import { regenerateRangeWithSolver } from '../generators/shared/generation-helpers'
import { groupMatchesIntoRounds, deriveRoundStatus, nextSchedule } from '../utils'
import type { SessionSchedule, PlayerRuntimeState } from '../types'

/**
 * player-runtime.service — Runtime Player Management: rest, return, leave,
 * mark absent, replace. Deliberately separate from both schedule.service
 * (Planning) and match-runtime.service (score entry) — this module is the
 * only writer of player *availability* once the session is LIVE.
 *
 * Regeneration boundary: every action here only ever regenerates matches
 * STARTING AFTER the current LIVE round (never the LIVE round itself, never
 * any FINISHED round — those are immutable, enforced by isPreserved() plus
 * the boundary calculation below). This reuses the same
 * regenerateRangeWithSolver the Planning-phase "Regenerate Remaining" action
 * already uses — no new generation algorithm, just a different starting
 * point and a different eligible-player set (see selectPlayersWithStatus).
 *
 * Regeneration NEVER throws. If the remaining AVAILABLE pool can't produce a
 * valid schedule, the organiser's action still takes effect (player states
 * are always applied) but the matches are left exactly as they were —
 * callers get back `{ schedule, regenerationFailed: true }` and must offer
 * recovery (undo / replace / reduce courts / finish session), never a raw
 * crash or a toast-only dead end.
 */

export type RuntimeActionOutcome = {
  readonly schedule:           SessionSchedule
  readonly regenerationFailed: boolean
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function persistInBackground(sessionId: string, schedule: SessionSchedule): void {
  void schedulePersistenceService.saveSchedule(sessionId, schedule).catch(err => {
    console.error('[player-runtime.service] background save failed:', err)
  })
}

async function loadRuntimeContext(sessionId: string) {
  const session   = await sessionsService.getById(sessionId)
  const attendees = await attendanceService.getSessionAttendees(sessionId)
  const playerIds = attendees.map(a => a.player_id)
  const players: GeneratorPlayer[] = playerIds.map(id => ({ id }))
  const nameById  = new Map(attendees.map(a => [a.player_id, a.players.name]))
  return { playerIds, players, courtCount: session.court_count, nameById }
}

/** First match index eligible for regeneration: right after the current LIVE round, or the first PENDING round if none is live. */
function regenerationBoundary(matches: SessionSchedule['matches'], courtCount: number): number {
  const rounds  = groupMatchesIntoRounds(matches, courtCount)
  const liveIdx = rounds.findIndex(r => deriveRoundStatus(r) === 'LIVE')
  if (liveIdx !== -1) {
    const liveRound = rounds[liveIdx]!
    return Math.max(...liveRound.slots.map(s => s.matchIndex)) + 1
  }
  const firstPending = rounds.find(r => deriveRoundStatus(r) === 'PENDING')
  return firstPending ? firstPending.slots[0]!.matchIndex : matches.length
}

/** The round currently LIVE, or null if none is (e.g. schedule finished, or not started). */
function currentRoundNumber(matches: SessionSchedule['matches'], courtCount: number): number | null {
  const rounds = groupMatchesIntoRounds(matches, courtCount)
  return rounds.find(r => deriveRoundStatus(r) === 'LIVE')?.roundNumber ?? null
}

/** The next round after the current LIVE one (or the first PENDING round if none is live), or null if there isn't one. */
function nextRoundBounds(
  matches: SessionSchedule['matches'],
  courtCount: number,
): { from: number; to: number } | null {
  const rounds = groupMatchesIntoRounds(matches, courtCount)
  const liveIdx = rounds.findIndex(r => deriveRoundStatus(r) === 'LIVE')
  const nextIdx = liveIdx !== -1 ? liveIdx + 1 : rounds.findIndex(r => deriveRoundStatus(r) === 'PENDING')
  const round = rounds[nextIdx]
  if (!round || round.slots.length === 0) return null
  const from = round.slots[0]!.matchIndex
  const to   = Math.max(...round.slots.map(s => s.matchIndex)) + 1
  return { from, to }
}

/** Whether a player has already appeared in a LIVE or FINISHED match — Mark Absent is only valid before this. */
function hasPlayerStarted(matches: SessionSchedule['matches'], playerId: string): boolean {
  return matches.some(
    m => m.matchStatus !== 'PENDING' && (m.teamA.includes(playerId) || m.teamB.includes(playerId)),
  )
}

function setStatus(
  schedule: SessionSchedule,
  playerId: string,
  state: PlayerRuntimeState,
): ReadonlyMap<string, PlayerRuntimeState> {
  const next = new Map(schedule.playerStates)
  next.set(playerId, state)
  return next
}

/**
 * Regenerates matches[from, to) with the given player states. Never throws:
 * on failure (not enough AVAILABLE players to fill a match), returns the
 * ORIGINAL matches in that range unchanged, with regenerationFailed: true.
 */
function tryRegenerateRange(
  schedule: SessionSchedule,
  playerStates: ReadonlyMap<string, PlayerRuntimeState>,
  players: GeneratorPlayer[],
  playerIds: string[],
  from: number,
  to: number,
  courtCount: number,
): { matches: SessionSchedule['matches']; failed: boolean } {
  if (from >= to || from >= schedule.matches.length) {
    return { matches: schedule.matches, failed: false }
  }
  try {
    const result = regenerateRangeWithSolver(
      { ...schedule, playerStates }, players, playerIds, from, to, {}, getAllConstraints(), courtCount,
    )
    return { matches: result.newMatches, failed: false }
  } catch {
    return { matches: schedule.matches, failed: true }
  }
}

/**
 * Regenerates every non-preserved match from the current boundary onward
 * with the updated player states. Never touches the LIVE round or any
 * FINISHED match. Never throws — see RuntimeActionOutcome.
 */
function regenerateRemaining(
  schedule: SessionSchedule,
  newPlayerStates: ReadonlyMap<string, PlayerRuntimeState>,
  players: GeneratorPlayer[],
  playerIds: string[],
  courtCount: number,
): RuntimeActionOutcome {
  const from = regenerationBoundary(schedule.matches, courtCount)
  const { matches, failed } = tryRegenerateRange(
    schedule, newPlayerStates, players, playerIds, from, schedule.matches.length, courtCount,
  )
  const newQuality = computeQuality(matches, playerIds)
  return {
    schedule: nextSchedule(schedule, { matches, quality: newQuality, playerStates: newPlayerStates }),
    regenerationFailed: failed,
  }
}

// ── Public actions ────────────────────────────────────────────────────────────

/**
 * Rest Next Round — excludes the player from selection for the single
 * upcoming round only. They automatically become AVAILABLE again for every
 * round after that — no manual "return" action required. The current LIVE
 * round and all finished rounds are untouched either way.
 */
async function restNextRound(sessionId: string, schedule: SessionSchedule, playerId: string): Promise<RuntimeActionOutcome> {
  const { players, playerIds, courtCount, nameById } = await loadRuntimeContext(sessionId)
  const bounds = nextRoundBounds(schedule.matches, courtCount)

  if (!bounds) {
    // No future round exists to rest from — nothing to regenerate.
    const schedule2 = nextSchedule(schedule, { playerStates: schedule.playerStates })
    return { schedule: schedule2, regenerationFailed: false }
  }

  // Phase 1: regenerate ONLY the next round with the player excluded.
  const restingStates = setStatus(schedule, playerId, { playerId, status: 'RESTING' })
  const phase1 = tryRegenerateRange(schedule, restingStates, players, playerIds, bounds.from, bounds.to, courtCount)

  // Phase 2: player automatically returns to AVAILABLE for every round after that.
  const afterPhase1     = { ...schedule, matches: phase1.matches }
  const availableStates = setStatus(afterPhase1, playerId, { playerId, status: 'AVAILABLE' })
  const phase2 = tryRegenerateRange(afterPhase1, availableStates, players, playerIds, bounds.to, schedule.matches.length, courtCount)

  const newQuality = computeQuality(phase2.matches, playerIds)
  const updated = nextSchedule(schedule, {
    matches:      phase2.matches,
    quality:      newQuality,
    playerStates: availableStates,
  })
  persistInBackground(sessionId, updated)

  const round = currentRoundNumber(schedule.matches, courtCount)
  void logEvent(sessionId, 'REST', playerId,
    `${nameById.get(playerId) ?? playerId} rested${round ? ` after Round ${round}` : ''}.`)

  return { schedule: updated, regenerationFailed: phase1.failed || phase2.failed }
}

/**
 * Return To Rotation — only valid for a RESTING player. Rarely needed now
 * that Rest Next Round auto-expires after one round, but still available
 * for the organiser to cancel a rest early.
 */
async function returnToRotation(sessionId: string, schedule: SessionSchedule, playerId: string): Promise<RuntimeActionOutcome> {
  const current = schedule.playerStates.get(playerId)
  if (current?.status !== 'RESTING') {
    throw new Error('returnToRotation: player is not currently resting.')
  }

  const { players, playerIds, courtCount, nameById } = await loadRuntimeContext(sessionId)
  const newStates = setStatus(schedule, playerId, { playerId, status: 'AVAILABLE' })
  const outcome   = regenerateRemaining(schedule, newStates, players, playerIds, courtCount)
  persistInBackground(sessionId, outcome.schedule)

  void logEvent(sessionId, 'RETURN', playerId, `${nameById.get(playerId) ?? playerId} returned to rotation.`)
  return outcome
}

/**
 * Leave Session — excluded from every future round. If the player is
 * currently in the LIVE round, that round is never touched (regeneration
 * only ever starts after it), so they simply finish it before the
 * exclusion takes effect on the next round onward.
 */
async function leaveSession(sessionId: string, schedule: SessionSchedule, playerId: string): Promise<RuntimeActionOutcome> {
  const { players, playerIds, courtCount, nameById } = await loadRuntimeContext(sessionId)
  const newStates = setStatus(schedule, playerId, { playerId, status: 'LEFT' })
  const outcome   = regenerateRemaining(schedule, newStates, players, playerIds, courtCount)
  persistInBackground(sessionId, outcome.schedule)

  const round = currentRoundNumber(schedule.matches, courtCount)
  void logEvent(sessionId, 'LEAVE', playerId,
    `${nameById.get(playerId) ?? playerId} left session${round ? ` after Round ${round}` : ''}.`)
  return outcome
}

/** Mark Absent — only valid before the player's first match (never played a LIVE/FINISHED match yet). */
async function markAbsent(sessionId: string, schedule: SessionSchedule, playerId: string): Promise<RuntimeActionOutcome> {
  if (hasPlayerStarted(schedule.matches, playerId)) {
    throw new Error('markAbsent: player has already played and can no longer be marked absent.')
  }

  const { players, playerIds, courtCount, nameById } = await loadRuntimeContext(sessionId)
  const newStates = setStatus(schedule, playerId, { playerId, status: 'ABSENT' })
  const outcome   = regenerateRemaining(schedule, newStates, players, playerIds, courtCount)
  persistInBackground(sessionId, outcome.schedule)

  void logEvent(sessionId, 'ABSENT', playerId, `${nameById.get(playerId) ?? playerId} marked absent.`)
  return outcome
}

/**
 * Replace Player — Remaining Session mode: the old player's finished-round
 * history is untouched; the new player becomes eligible from the
 * regeneration boundary onward, same as any other AVAILABLE player.
 */
async function replacePlayer(
  sessionId: string,
  schedule: SessionSchedule,
  oldPlayerId: string,
  newPlayerId: string,
): Promise<RuntimeActionOutcome> {
  const { players, playerIds, courtCount, nameById } = await loadRuntimeContext(sessionId)
  if (!playerIds.includes(newPlayerId)) {
    throw new Error('replacePlayer: replacement must already be an attendee of this session.')
  }

  let newStates = setStatus(schedule, oldPlayerId, {
    playerId: oldPlayerId,
    status:   'REPLACED',
    replacedByPlayerId: newPlayerId,
  })
  newStates = new Map(newStates).set(newPlayerId, { playerId: newPlayerId, status: 'AVAILABLE' })

  const outcome = regenerateRemaining(schedule, newStates, players, playerIds, courtCount)
  persistInBackground(sessionId, outcome.schedule)

  const round = currentRoundNumber(schedule.matches, courtCount)
  void logEvent(sessionId, 'REPLACE', newPlayerId,
    `${nameById.get(newPlayerId) ?? newPlayerId} replaced ${nameById.get(oldPlayerId) ?? oldPlayerId}` +
    `${round ? ` before Round ${round + 1}` : ''}.`,
    { relatedPlayerId: oldPlayerId })
  return outcome
}

async function logEvent(
  sessionId: string,
  eventType: RuntimeEventType,
  playerId: string,
  message: string,
  options?: { relatedPlayerId?: string },
): Promise<void> {
  try {
    await runtimeAuditService.logEvent(sessionId, eventType, playerId, message, options)
  } catch (err) {
    console.error('[player-runtime.service] audit log failed:', err)
  }
}

export const playerRuntimeService = {
  restNextRound,
  returnToRotation,
  leaveSession,
  markAbsent,
  replacePlayer,
  hasPlayerStarted,
} as const
