/**
 * Round — a first-class, generator-internal domain concept (Sprint G1).
 *
 * Every real tournament rule (one player per round, standby per round,
 * court allocation per round, repair per round) is round-shaped, but the
 * pipeline used to generate one match at a time and let "round" be inferred
 * later by chunking the flat match list. That let a shrunk player pool
 * (after Rest/Leave/Absent) silently double-book a player onto two courts
 * in the same round — the fairness *sort* used for match-by-match selection
 * deprioritized already-used players, but never hard-excluded them.
 *
 * This module fixes that structurally: player selection happens once per
 * round, for the round's entire required player count, then is partitioned
 * into disjoint groups of 4 — one per court. Two different courts in the
 * same round can never draw from overlapping players, because they draw
 * from two disjoint slices of one already-deduplicated selection, not from
 * two independent selections.
 *
 * Round is NOT exposed to the database, the UI, or Runtime — it exists only
 * during generation. The output of every function here is still the flat
 * `PlannedMatch[]` the rest of the app already understands; nothing about
 * SessionSchedule, persistence, or any component changes.
 */

import { generateTeams } from '@/features/team-generator'
import type { GeneratorConfig, GeneratorPlayer, GeneratorCandidate } from '@/features/team-generator'
import { GENERATOR } from '@/features/team-generator'
import type { PlannedMatch, PlayerRuntimeState } from '../../types'
import { buildGeneratorConfig, updateContextWithPlannedMatch, matchId, isPreserved } from '../../utils'
import type { PlanningContext } from '../../utils'
import { solve } from '../../constraints'
import type { Constraint, RoundCandidate, CourtAssignment } from '../../constraints'
import type { RandomProvider } from './random'
import { defaultRandom } from './random'

// ── Round result ──────────────────────────────────────────────────────────────

/**
 * Outcome of generating one round. `insufficient-players` is returned
 * instead of ever attempting a partial or invalid round — see
 * `requiredPlayers` in Step 5 of the sprint: `availablePlayers` and
 * `courtCount` are included so the caller (Runtime) can decide to reduce
 * courts, wait, or finish the session, without the generator ever having to
 * guess at recovery policy itself.
 */
export type RoundGenerationResult =
  | { readonly status: 'success'; readonly matches: readonly PlannedMatch[] }
  | {
      readonly status:           'insufficient-players'
      readonly requiredPlayers:  number
      readonly availablePlayers: number
      readonly courtCount:       number
    }

// ── Round-level player selection ─────────────────────────────────────────────

/** Fisher-Yates shuffle — returns a new array, never mutates the input. */
function shuffled<T>(items: readonly T[], random: RandomProvider = defaultRandom): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

/**
 * Selects exactly `requiredCount` AVAILABLE players for one round, honoring
 * the same fairness heuristic as before (fewest matches played, most
 * consecutive rests, ties broken randomly) — but as a single up-front
 * selection for the WHOLE round, not once per match. The result is a flat,
 * already-deduplicated array; partitioning it into groups of 4 (see
 * `partitionIntoCourts`) can never produce overlapping players, because
 * there is only one selection, not `courtCount` independent ones.
 */
function selectPlayersForRound(
  allPlayers: readonly GeneratorPlayer[],
  ctx: PlanningContext,
  playerStates: ReadonlyMap<string, PlayerRuntimeState>,
  excludedIds: ReadonlySet<string>,
  requiredCount: number,
): GeneratorPlayer[] {
  const eligible = allPlayers.filter(p =>
    (playerStates.get(p.id)?.status ?? 'AVAILABLE') === 'AVAILABLE' && !excludedIds.has(p.id),
  )

  const sorted = shuffled(eligible).sort((a, b) => {
    const ca = ctx.players.get(a.id)
    const cb = ctx.players.get(b.id)
    const d  = (ca?.matchesPlayed ?? 0) - (cb?.matchesPlayed ?? 0)
    return d || ((cb?.consecutiveRests ?? 0) - (ca?.consecutiveRests ?? 0))
  })

  return sorted.slice(0, requiredCount)
}

/** Splits a flat, already-selected player array into disjoint groups of 4 — one per court. */
function partitionIntoCourts(selected: readonly GeneratorPlayer[]): GeneratorPlayer[][] {
  const groups: GeneratorPlayer[][] = []
  for (let i = 0; i < selected.length; i += GENERATOR.PLAYERS_PER_MATCH) {
    groups.push(selected.slice(i, i + GENERATOR.PLAYERS_PER_MATCH))
  }
  return groups
}

// ── Per-court match construction ─────────────────────────────────────────────

function toRoundCandidate(match: PlannedMatch): RoundCandidate {
  const court: CourtAssignment = {
    courtNumber: match.courtNumber ?? 0,
    teamA:       match.teamA,
    teamB:       match.teamB,
  }
  return { id: match.id, courts: [court], assignments: [] }
}

function partitionKey(teamA: readonly [string, string], teamB: readonly [string, string]): string {
  const a = [...teamA].sort().join(',')
  const b = [...teamB].sort().join(',')
  return [a, b].sort().join('|')
}

function partitionKeyForCandidate(candidate: GeneratorCandidate): string {
  return partitionKey(
    [candidate.teamA.player1.id, candidate.teamA.player2.id],
    [candidate.teamB.player1.id, candidate.teamB.player2.id],
  )
}

/**
 * Ranks a single court's 4-player candidate splits through the Constraint
 * Solver and randomly picks among the top-scoring ones — identical
 * selection behaviour to the pre-Sprint-G1 pipeline, just no longer bundled
 * with player selection.
 */
function pickCandidateForCourt(
  group: readonly GeneratorPlayer[],
  candidates: readonly GeneratorCandidate[],
  priorMatches: readonly PlannedMatch[],
  constraints: ReadonlyArray<Constraint>,
  random: RandomProvider = defaultRandom,
): GeneratorCandidate {
  const randomPick = (pool: readonly GeneratorCandidate[]): GeneratorCandidate =>
    pool[Math.floor(random.next() * pool.length)]!

  if (group.length !== GENERATOR.PLAYERS_PER_MATCH) return randomPick(candidates)

  const solverOutput = solve({
    players:         group.map(p => p.id),
    courts:          [1],
    currentSchedule: priorMatches.map(toRoundCandidate),
    constraints,
  })

  if (solverOutput.ranked.length === 0) return randomPick(candidates)

  const bestScore = solverOutput.ranked[0]!.totalScore
  const bestKeys  = new Set(
    solverOutput.ranked
      .filter(r => r.totalScore === bestScore)
      .map(r => partitionKey(r.candidate.courts[0]!.teamA, r.candidate.courts[0]!.teamB)),
  )

  const solverApproved = candidates.filter(c => bestKeys.has(partitionKeyForCandidate(c)))
  return randomPick(solverApproved.length > 0 ? solverApproved : candidates)
}

function buildMatch(candidate: GeneratorCandidate, courtNumber: number | null): PlannedMatch {
  return {
    id:          matchId(),
    origin:      'AUTO',
    protection:  'UNLOCKED',
    modified:    false,
    courtNumber,
    teamA:       [candidate.teamA.player1.id, candidate.teamA.player2.id],
    teamB:       [candidate.teamB.player1.id, candidate.teamB.player2.id],
    explanation: [],
    warnings:    [],
    isCompleted: false,
    matchStatus: 'PENDING',
  }
}

// ── Round validation (Step 4 / Step 7) ───────────────────────────────────────

export type RoundValidation = { readonly valid: boolean; readonly reasons: readonly string[] }

/**
 * Structural correctness check for one fully-assembled round. Discarding an
 * invalid round (never committing a partial result) is enforced by the
 * caller checking `.valid` before folding the round into the schedule.
 */
export function validateRound(matches: readonly PlannedMatch[], expectedCourts: number): RoundValidation {
  const reasons: string[] = []

  if (matches.length !== expectedCourts) {
    reasons.push(`Expected ${expectedCourts} match(es) in the round, found ${matches.length}.`)
  }

  const courtNumbers = matches.map(m => m.courtNumber).filter((c): c is number => c !== null)
  if (new Set(courtNumbers).size !== courtNumbers.length) {
    reasons.push('Duplicate court number within the round.')
  }

  const allPlayerIds: string[] = []
  for (const m of matches) {
    const four = [...m.teamA, ...m.teamB]
    if (new Set(four).size !== 4) {
      reasons.push(`Match ${m.id} does not have 4 distinct players.`)
    }
    allPlayerIds.push(...four)
  }
  if (new Set(allPlayerIds).size !== allPlayerIds.length) {
    reasons.push('A player appears in more than one match within the same round.')
  }

  return { valid: reasons.length === 0, reasons }
}

// ── Shared core — used by both fresh generation and regeneration ────────────

/**
 * Generates exactly `courtNumbers.length` fresh matches for one round,
 * excluding `excludedIds` (players already committed to a fixed/preserved
 * match this round) from selection. Never partial: either every court gets
 * a valid, structurally-checked match, or the whole attempt fails with
 * `insufficient-players` and nothing is returned.
 */
function generateRoundMatches(
  courtNumbers: readonly (number | null)[],
  excludedIds: ReadonlySet<string>,
  allPlayers: readonly GeneratorPlayer[],
  ctx: PlanningContext,
  playerStates: ReadonlyMap<string, PlayerRuntimeState>,
  baseConfig: GeneratorConfig,
  priorMatches: readonly PlannedMatch[],
  constraints: ReadonlyArray<Constraint>,
): RoundGenerationResult {
  const requiredCount = courtNumbers.length * GENERATOR.PLAYERS_PER_MATCH
  const selected = selectPlayersForRound(allPlayers, ctx, playerStates, excludedIds, requiredCount)

  if (selected.length < requiredCount) {
    return {
      status:            'insufficient-players',
      requiredPlayers:   requiredCount,
      availablePlayers:  selected.length,
      courtCount:        courtNumbers.length,
    }
  }

  const groups = partitionIntoCourts(selected)
  const config = buildGeneratorConfig(ctx, baseConfig)

  const matches: PlannedMatch[] = []
  let runningPriorMatches = [...priorMatches]

  for (let i = 0; i < courtNumbers.length; i++) {
    const group = groups[i]!
    const generated = generateTeams(group, config)
    const chosen    = pickCandidateForCourt(group, generated.candidates, runningPriorMatches, constraints)
    const match     = buildMatch(chosen, courtNumbers[i]!)
    matches.push(match)
    runningPriorMatches = [...runningPriorMatches, match]
  }

  const validation = validateRound(matches, courtNumbers.length)
  if (!validation.valid) {
    // Never commit a partial/invalid result — surfaced identically to an
    // availability failure so callers have exactly one failure path to handle.
    return {
      status:            'insufficient-players',
      requiredPlayers:   requiredCount,
      availablePlayers:  selected.length,
      courtCount:        courtNumbers.length,
    }
  }

  return { status: 'success', matches }
}

/** Generates a brand-new round with no pre-existing matches at all (used by `generate()`). */
export function generateFreshRound(
  courtsThisRound: number,
  allPlayers: readonly GeneratorPlayer[],
  ctx: PlanningContext,
  playerStates: ReadonlyMap<string, PlayerRuntimeState>,
  baseConfig: GeneratorConfig,
  priorMatches: readonly PlannedMatch[],
  constraints: ReadonlyArray<Constraint>,
): RoundGenerationResult {
  const courtNumbers = Array.from({ length: courtsThisRound }, (_, i) => i + 1)
  return generateRoundMatches(courtNumbers, new Set(), allPlayers, ctx, playerStates, baseConfig, priorMatches, constraints)
}

/**
 * Regenerates the non-preserved, requested slots of an EXISTING round
 * (used by `regenerate()`). `roundSlots` is every slot belonging to this
 * round in court order; `regenerateIds` marks which of those slots actually
 * need fresh generation this call. Anything else — preserved, or simply not
 * requested — is FIXED: its players are excluded from this round's
 * selection pool, exactly like a real court already taken by someone else.
 */
export function generateExistingRound(
  roundSlots: readonly PlannedMatch[],
  regenerateIds: ReadonlySet<string>,
  allPlayers: readonly GeneratorPlayer[],
  ctx: PlanningContext,
  playerStates: ReadonlyMap<string, PlayerRuntimeState>,
  baseConfig: GeneratorConfig,
  priorMatches: readonly PlannedMatch[],
  constraints: ReadonlyArray<Constraint>,
): RoundGenerationResult {
  const toGenerate = roundSlots.filter(m => regenerateIds.has(m.id) && !isPreserved(m))

  if (toGenerate.length === 0) {
    return { status: 'success', matches: roundSlots }
  }

  const fixedPlayerIds = new Set<string>()
  for (const m of roundSlots) {
    if (toGenerate.includes(m)) continue
    for (const id of [...m.teamA, ...m.teamB]) fixedPlayerIds.add(id)
  }

  const courtNumbers = toGenerate.map(m => m.courtNumber)
  const result = generateRoundMatches(
    courtNumbers, fixedPlayerIds, allPlayers, ctx, playerStates, baseConfig, priorMatches, constraints,
  )
  if (result.status !== 'success') return result

  let generatedIndex = 0
  const merged = roundSlots.map(slot =>
    toGenerate.includes(slot) ? result.matches[generatedIndex++]! : slot,
  )

  const validation = validateRound(merged, roundSlots.length)
  if (!validation.valid) {
    return {
      status:            'insufficient-players',
      requiredPlayers:   courtNumbers.length * GENERATOR.PLAYERS_PER_MATCH,
      availablePlayers:  courtNumbers.length * GENERATOR.PLAYERS_PER_MATCH,
      courtCount:        courtNumbers.length,
    }
  }

  return { status: 'success', matches: merged }
}

/** Folds every match in a committed round into the running PlanningContext, once each, order-independent (matches within a round are always player-disjoint). */
export function commitRoundToContext(
  ctx: PlanningContext,
  roundMatches: readonly PlannedMatch[],
  playerIds: readonly string[],
): PlanningContext {
  let next = ctx
  for (const m of roundMatches) {
    next = updateContextWithPlannedMatch(next, m, playerIds)
  }
  return next
}
