import { sessionsService } from './sessions.service'
import { attendanceService } from './attendance.service'
import type { GeneratorConfig, GeneratorPlayer } from '@/features/team-generator'
import type {
  Session,
  SessionSchedule,
  PlannedMatch,
  PlannedMatchProtection,
  PlayerRuntimeStatus,
  MatchRuntimeStatus,
} from '../types'
import { matchId, isPreserved, nextSchedule } from '../utils'
import { plannerService } from '../planner'
import type { TournamentPlan } from '../planner'
import { getGenerator } from '../generators'
import type { GeneratorContext, GeneratorResult } from '../generators'
import { computeQuality } from '../generators/custom.generator'
import { schedulePersistenceService } from './schedule-persistence.service'
import type { PersistedSchedule } from './schedule-persistence.service'
import { runtimeAuditService } from './runtime-audit.service'

/**
 * schedule.service — orchestrator.
 *
 * TournamentPlan -> TournamentGenerator -> SessionSchedule
 *
 * This service no longer runs the balanced-team algorithm itself: it builds
 * the GeneratorContext (session players) and a TournamentPlan, looks up the
 * right generator via the registry, and returns whatever SessionSchedule
 * that generator produces. The actual generation behaviour (currently only
 * implemented for the "custom" and "americano" formats) lives in
 * generators/*.generator.ts. Player rating is never loaded or read here —
 * scheduling and rating are fully independent subsystems.
 *
 * The manual editing operations below (addManualMatch, removeMatch,
 * swapPlayer, lockMatch, unlockMatch, setPlayerStatus) are schedule *edits*,
 * not generation — they stay here, reusing the same quality engine the
 * generator uses.
 */

// ── Internal helpers — player loading (context building) ────────────────────

interface LoadedPlayers {
  session:   Session
  playerIds: string[]
  players:   GeneratorPlayer[]
}

async function loadPlayers(sessionId: string): Promise<LoadedPlayers> {
  const session    = await sessionsService.getById(sessionId)
  const attendees  = await attendanceService.getSessionAttendees(sessionId)
  const playerIds  = attendees.map(a => a.player_id)
  const players: GeneratorPlayer[] = playerIds.map(id => ({ id }))

  return { session, playerIds, players }
}

/**
 * Builds the generator context plus the session's configured Number of
 * Courts (persisted on the session — see Session Information), so callers
 * can size the plan correctly without a second Supabase round-trip.
 */
async function buildGeneratorContext(
  sessionId: string,
): Promise<{ context: GeneratorContext; courtCount: number }> {
  const { session, playerIds, players } = await loadPlayers(sessionId)
  return {
    context:    { sessionId, playerIds, players },
    courtCount: session.court_count,
  }
}

/**
 * Builds a minimal TournamentPlan for the "custom" format, forcing its
 * match-count setting to the requested target count. Reuses plannerService
 * rather than re-deriving the format/settings → match-count mapping here.
 */
function buildCustomPlan(playerCount: number, targetCount: number, courtCount: number): TournamentPlan {
  const base       = plannerService.createPlan({ playerCount, courtCount })
  const withFormat = plannerService.updateFormat(base, 'custom')
  return plannerService.updateSettings(withFormat, { 'match-count': targetCount })
}

function unwrapSchedule(result: GeneratorResult): SessionSchedule {
  if (result.status !== 'success') {
    throw new Error(`Schedule generation failed (${result.status}): ${result.message}`)
  }
  return result.schedule
}

function playerIdsFromSchedule(schedule: SessionSchedule): string[] {
  return [...schedule.playerStates.keys()]
}

/**
 * Fires a persistence save without blocking the caller. Used by every sync
 * mutation (lock, swap, delete, add manual, ...) so the UI updates
 * immediately while the save happens in the background. Errors are logged,
 * not thrown — a failed background save should not crash an already-applied
 * local edit; the next mutation's save attempt will simply retry with the
 * latest state.
 */
function persistInBackground(schedule: SessionSchedule): void {
  void schedulePersistenceService.saveSchedule(schedule.sessionId, schedule).catch(err => {
    console.error('[schedule.service] background save failed:', err)
  })
}

/**
 * Number of courts in simultaneous use, derived from how many distinct
 * `courtNumber` values appear on the schedule's matches. Falls back to 1 —
 * today's generators always leave `courtNumber` null (single-court,
 * sequential scheduling), so this correctly reads as "1 court" until
 * multi-court assignment exists.
 */
function distinctCourtCount(matches: readonly PlannedMatch[]): number {
  const courts = new Set(
    matches.map(m => m.courtNumber).filter((c): c is number => c !== null),
  )
  return courts.size > 0 ? courts.size : 1
}

// ── Public API — schedule loading ─────────────────────────────────────────────

/** Loads the persisted schedule for a session, or null if none exists yet. */
async function loadSchedule(sessionId: string): Promise<PersistedSchedule | null> {
  return schedulePersistenceService.loadSchedule(sessionId)
}

// ── Public API — schedule creation ────────────────────────────────────────────

async function createSchedule(
  sessionId: string,
  targetCount: number,
  // Deferred by design: organiser overrides beyond match count (e.g. custom
  // fairness weighting) aren't threaded through the generator interface —
  // no current caller passes a non-default value. Wiring TournamentPlan
  // settings all the way into GeneratorConfig is a Generator-layer change,
  // out of scope for a hardening sprint.
  _baseConfig: GeneratorConfig = {},
): Promise<SessionSchedule> {
  const generator = getGenerator('custom')
  const { context, courtCount } = await buildGeneratorContext(sessionId)
  const plan       = buildCustomPlan(context.playerIds.length, targetCount, courtCount)
  const schedule   = unwrapSchedule(await generator.generate(plan, context))
  await schedulePersistenceService.saveSchedule(sessionId, schedule, generator.formatId)
  return schedule
}

// ── Public API — manual operations (sync) ────────────────────────────────────

/**
 * Appends a MANUAL match. Team composition is entirely the organiser's
 * choice — there is no balance score to evaluate.
 */
function addManualMatch(
  schedule: SessionSchedule,
  teamA: readonly [string, string],
  teamB: readonly [string, string],
  courtNumber: number | null = null,
): SessionSchedule {
  const match: PlannedMatch = {
    id: matchId(), origin: 'MANUAL', protection: 'UNLOCKED', modified: false,
    courtNumber, teamA, teamB, explanation: [], warnings: [], isCompleted: false,
    matchStatus: 'PENDING',
  }

  const newMatches = [...schedule.matches, match]
  const playerIds  = playerIdsFromSchedule(schedule)
  const newQuality = computeQuality(newMatches, playerIds)
  const updated    = nextSchedule(schedule, { matches: newMatches, quality: newQuality })
  persistInBackground(updated)
  return updated
}

/**
 * Removes a match. Completed and LOCKED matches cannot be removed.
 * Recalculates quality.
 */
function removeMatch(schedule: SessionSchedule, id: string): SessionSchedule {
  const match = schedule.matches.find(m => m.id === id)
  if (!match)              throw new Error(`removeMatch: match ${id} not found.`)
  if (match.isCompleted)   throw new Error(`removeMatch: match ${id} is completed and cannot be removed.`)
  if (match.protection === 'LOCKED') throw new Error(`removeMatch: match ${id} is locked.`)

  const newMatches = schedule.matches.filter(m => m.id !== id)
  const playerIds  = playerIdsFromSchedule(schedule)
  const newQuality = computeQuality(newMatches, playerIds)
  const updated    = nextSchedule(schedule, { matches: newMatches, quality: newQuality })
  persistInBackground(updated)
  return updated
}

/**
 * Replaces one player in a match's team slot. Sets modified = true.
 * There is no balance score to re-evaluate — only quality is recalculated.
 */
function swapPlayer(
  schedule: SessionSchedule,
  matchId_: string,
  fromPlayerId: string,
  toPlayerId: string,
): SessionSchedule {
  const idx = schedule.matches.findIndex(m => m.id === matchId_)
  if (idx === -1)           throw new Error(`swapPlayer: match ${matchId_} not found.`)
  const match = schedule.matches[idx]!
  if (isPreserved(match))   throw new Error(`swapPlayer: match ${matchId_} is preserved.`)

  const swap = (id: string) => (id === fromPlayerId ? toPlayerId : id)
  const newTeamA: [string, string] = [swap(match.teamA[0]), swap(match.teamA[1])]
  const newTeamB: [string, string] = [swap(match.teamB[0]), swap(match.teamB[1])]

  const updatedMatch: PlannedMatch = { ...match, teamA: newTeamA, teamB: newTeamB, modified: true }
  const newMatches = schedule.matches.map((m, i) => (i === idx ? updatedMatch : m))
  const playerIds  = playerIdsFromSchedule(schedule)
  const newQuality = computeQuality(newMatches, playerIds)
  const updated    = nextSchedule(schedule, { matches: newMatches, quality: newQuality })
  persistInBackground(updated)
  return updated
}

// ── Public API — protection operations (sync) ────────────────────────────────

function lockMatch(schedule: SessionSchedule, id: string): SessionSchedule {
  return setProtection(schedule, id, 'LOCKED')
}

function unlockMatch(schedule: SessionSchedule, id: string): SessionSchedule {
  return setProtection(schedule, id, 'UNLOCKED')
}

function setProtection(
  schedule: SessionSchedule,
  id: string,
  protection: PlannedMatchProtection,
): SessionSchedule {
  const idx = schedule.matches.findIndex(m => m.id === id)
  if (idx === -1) throw new Error(`setProtection: match ${id} not found.`)
  if (schedule.matches[idx]!.isCompleted) {
    throw new Error(`setProtection: completed match ${id} cannot be modified.`)
  }
  // Protection is not content — modified is unchanged, quality is unchanged
  const newMatches = schedule.matches.map((m, i) => i === idx ? { ...m, protection } : m)
  const updated    = nextSchedule(schedule, { matches: newMatches })
  persistInBackground(updated)
  return updated
}

// ── Public API — session start (sync) ────────────────────────────────────────

/**
 * Initializes every match's runtime status when the organiser starts the
 * session (Sprint F23.1 foundation): the first N matches (N = the session's
 * configured Number of Courts) become LIVE, everything else becomes
 * PENDING. No match ever becomes FINISHED here — that is a future sprint's
 * concern. Purely additive: does not touch teams, balance, quality, or any
 * other field on the matches.
 *
 * `courtCount` should be the session's persisted Number of Courts; if
 * omitted, falls back to inferring it from the schedule's own matches (see
 * `distinctCourtCount`) for backward compatibility.
 */
function startMatches(schedule: SessionSchedule, courtCount?: number): SessionSchedule {
  const activeCourts = courtCount ?? distinctCourtCount(schedule.matches)
  const newMatches = schedule.matches.map((match, index) => {
    const matchStatus: MatchRuntimeStatus = index < activeCourts ? 'LIVE' : 'PENDING'
    return { ...match, matchStatus }
  })
  const updated = nextSchedule(schedule, { matches: newMatches })
  persistInBackground(updated)

  void runtimeAuditService.logEvent(schedule.sessionId, 'SESSION_STARTED', null, 'Session started.').catch(err => {
    console.error('[schedule.service] audit log failed:', err)
  })
  void runtimeAuditService.logEvent(schedule.sessionId, 'ROUND_STARTED', null, 'Round 1 started.', { roundNumber: 1 }).catch(err => {
    console.error('[schedule.service] audit log failed:', err)
  })

  return updated
}

// ── Public API — player runtime (sync) ───────────────────────────────────────

function setPlayerStatus(
  schedule: SessionSchedule,
  playerId: string,
  status: PlayerRuntimeStatus,
): SessionSchedule {
  if (!schedule.playerStates.has(playerId)) {
    throw new Error(`setPlayerStatus: player ${playerId} not in this session.`)
  }
  const newStates = new Map(schedule.playerStates)
  newStates.set(playerId, { playerId, status })
  const updated = nextSchedule(schedule, { playerStates: newStates })
  persistInBackground(updated)
  return updated
}

// ── Public API — regeneration operations (async) ──────────────────────────────

async function regenerateCurrentMatch(
  schedule: SessionSchedule,
  sessionId: string,
  // Deferred by design — see createSchedule's identical note above.
  _baseConfig: GeneratorConfig = {},
): Promise<SessionSchedule> {
  const generator = getGenerator('custom')
  const { context, courtCount } = await buildGeneratorContext(sessionId)
  const plan       = buildCustomPlan(context.playerIds.length, schedule.targetCount, courtCount)
  const updated    = unwrapSchedule(await generator.regenerate(schedule, plan, context, 'current'))
  await schedulePersistenceService.saveSchedule(sessionId, updated)
  return updated
}

async function regenerateRemainingMatches(
  schedule: SessionSchedule,
  sessionId: string,
  _baseConfig: GeneratorConfig = {},
): Promise<SessionSchedule> {
  const generator = getGenerator('custom')
  const { context, courtCount } = await buildGeneratorContext(sessionId)
  const plan       = buildCustomPlan(context.playerIds.length, schedule.targetCount, courtCount)
  const updated    = unwrapSchedule(await generator.regenerate(schedule, plan, context, 'remaining'))
  await schedulePersistenceService.saveSchedule(sessionId, updated)
  return updated
}

async function regenerateEntireSchedule(
  schedule: SessionSchedule,
  sessionId: string,
  _baseConfig: GeneratorConfig = {},
): Promise<SessionSchedule> {
  const generator = getGenerator('custom')
  const { context, courtCount } = await buildGeneratorContext(sessionId)
  const plan       = buildCustomPlan(context.playerIds.length, schedule.targetCount, courtCount)
  const updated    = unwrapSchedule(await generator.regenerate(schedule, plan, context, 'all'))
  await schedulePersistenceService.saveSchedule(sessionId, updated)
  return updated
}

async function recalculateBalanceOnly(
  schedule: SessionSchedule,
  sessionId: string,
): Promise<SessionSchedule> {
  const generator = getGenerator('custom')
  const { context, courtCount } = await buildGeneratorContext(sessionId)
  const plan       = buildCustomPlan(context.playerIds.length, schedule.targetCount, courtCount)
  const updated    = unwrapSchedule(await generator.regenerate(schedule, plan, context, 'recalculate-only'))
  await schedulePersistenceService.saveSchedule(sessionId, updated)
  return updated
}

// ── Export ────────────────────────────────────────────────────────────────────

export const scheduleService = {
  loadSchedule,
  createSchedule,
  regenerateCurrentMatch,
  regenerateRemainingMatches,
  regenerateEntireSchedule,
  recalculateBalanceOnly,
  addManualMatch,
  removeMatch,
  swapPlayer,
  lockMatch,
  unlockMatch,
  setPlayerStatus,
  startMatches,
} as const
