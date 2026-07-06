/**
 * Generic Constraint Solver.
 *
 * Knows nothing about Americano, Mexicano, Round Robin, King of the Court,
 * or Custom — only players, courts, prior rounds, and Constraints. The
 * algorithm is intentionally small:
 *
 *   1. Generate every possible candidate round.
 *   2. Ask every registered constraint to score every candidate.
 *   3. Combine scores (weighted average).
 *   4. Sort candidates.
 *   5. Return the highest-scoring one.
 *
 * `generateRoundCandidates`/`assignCourts` below are genuinely multi-court:
 * given N courts, they enumerate every way to split players across all N
 * courts in the same call. In practice, the generator (see
 * `generators/shared/round.ts`) never calls `solve()` that way — it selects
 * a round's players once itself, partitions them into per-court groups
 * up-front (so two courts can never draw the same player), and calls
 * `solve()` once per court with `courts: [1]` and that court's 4 already-
 * selected players, using the solver only for its per-court team-split
 * ranking (never-repeat-partner/opponent, equal matches/rest). The solver's
 * own multi-court reasoning is real and correct, just not the code path in
 * use today — a future caller that wants the solver to plan a whole
 * multi-court round in one call can already do so (Sprint G1.1 Step 6).
 */

import type {
  PlayerId,
  CourtAssignment,
  PlayerAssignment,
  RoundCandidate,
  ConstraintContext,
  ConstraintResult,
  SolverInput,
  SolverOutput,
  RankedCandidate,
} from './constraint.types'
import { buildSchedulingHistory } from './history/history.index'

// ── Candidate generation — pure combinatorics, no format knowledge ──────────

const PLAYERS_PER_COURT = 4

function combinations<T>(items: readonly T[], size: number): T[][] {
  if (size === 0) return [[]]
  if (items.length < size) return []
  const [first, ...rest] = items
  const withFirst    = combinations(rest, size - 1).map(c => [first as T, ...c])
  const withoutFirst = combinations(rest, size)
  return [...withFirst, ...withoutFirst]
}

function without<T>(items: readonly T[], toRemove: readonly T[]): T[] {
  const removeSet = new Set(toRemove)
  return items.filter(i => !removeSet.has(i))
}

/** The 3 distinct ways to split 4 players into two teams of 2. */
function teamSplitsOfFour(four: readonly PlayerId[]): Array<{ teamA: [PlayerId, PlayerId]; teamB: [PlayerId, PlayerId] }> {
  const [p1, p2, p3, p4] = four as [PlayerId, PlayerId, PlayerId, PlayerId]
  return [
    { teamA: [p1, p2], teamB: [p3, p4] },
    { teamA: [p1, p3], teamB: [p2, p4] },
    { teamA: [p1, p4], teamB: [p2, p3] },
  ]
}

/**
 * All ways to fill `courtNumbers` (in order) from `pool`, 4 players per
 * court, with every court's 3 possible team splits.
 */
function assignCourts(pool: readonly PlayerId[], courtNumbers: readonly number[]): CourtAssignment[][] {
  if (courtNumbers.length === 0) return [[]]

  const [courtNumber, ...restCourts] = courtNumbers
  const results: CourtAssignment[][] = []

  for (const group of combinations(pool, PLAYERS_PER_COURT)) {
    const remainingPool = without(pool, group)
    const restAssignments = assignCourts(remainingPool, restCourts)

    for (const split of teamSplitsOfFour(group)) {
      const thisCourt: CourtAssignment = { courtNumber: courtNumber as number, ...split }
      for (const rest of restAssignments) {
        results.push([thisCourt, ...rest])
      }
    }
  }

  return results
}

function toPlayerAssignments(
  allPlayers: readonly PlayerId[],
  courts: readonly CourtAssignment[],
): PlayerAssignment[] {
  const byPlayer = new Map<PlayerId, PlayerAssignment>()
  for (const court of courts) {
    byPlayer.set(court.teamA[0], { playerId: court.teamA[0], courtNumber: court.courtNumber, team: 'A' })
    byPlayer.set(court.teamA[1], { playerId: court.teamA[1], courtNumber: court.courtNumber, team: 'A' })
    byPlayer.set(court.teamB[0], { playerId: court.teamB[0], courtNumber: court.courtNumber, team: 'B' })
    byPlayer.set(court.teamB[1], { playerId: court.teamB[1], courtNumber: court.courtNumber, team: 'B' })
  }
  return allPlayers.map(playerId => byPlayer.get(playerId) ?? { playerId, courtNumber: null, team: null })
}

/**
 * Every possible candidate round: which subset of players plays (the rest
 * rest), how they're grouped onto the available courts, and every team
 * split within each group.
 */
export function generateRoundCandidates(
  players: ReadonlyArray<PlayerId>,
  courts: ReadonlyArray<number>,
): RoundCandidate[] {
  const usableCourts = Math.min(courts.length, Math.floor(players.length / PLAYERS_PER_COURT))
  if (usableCourts === 0) return []

  const courtNumbers = courts.slice(0, usableCourts)
  const candidates: RoundCandidate[] = []
  let counter = 0

  for (const playingGroup of combinations(players, usableCourts * PLAYERS_PER_COURT)) {
    for (const courtAssignments of assignCourts(playingGroup, courtNumbers)) {
      counter += 1
      candidates.push({
        id:          `candidate-${counter}`,
        courts:      courtAssignments,
        assignments: toPlayerAssignments(players, courtAssignments),
      })
    }
  }

  return candidates
}

// ── Scoring — combine every constraint's result into one total ──────────────

function combineScores(results: ReadonlyArray<ConstraintResult>): number {
  if (results.length === 0) return 0
  const totalWeight = results.reduce((sum, r) => sum + r.score.weight, 0)
  if (totalWeight <= 0) return 0
  const weightedSum = results.reduce((sum, r) => sum + r.score.value * r.score.weight, 0)
  return weightedSum / totalWeight
}

function rankCandidate(
  candidate: RoundCandidate,
  context: ConstraintContext,
  constraints: SolverInput['constraints'],
): RankedCandidate {
  const results: ConstraintResult[] = constraints.map(constraint => {
    const violations = constraint.evaluate(candidate, context)
    return {
      score:      constraint.score(candidate, context),
      violations,
      passed:     violations.every(v => v.severity !== 'error'),
    }
  })
  return { candidate, totalScore: combineScores(results), results }
}

// ── Solver ────────────────────────────────────────────────────────────────────

/**
 * Generates every candidate round, scores each with every constraint, and
 * returns the highest-scoring one. The solver has no notion of any specific
 * tournament format — it only understands Constraints.
 *
 * `buildSchedulingHistory` runs exactly once here, since `input.currentSchedule`
 * doesn't change across candidates or constraints within one `solve()` call
 * — the resulting `history` is attached to `context` and reused by every
 * constraint's evaluate()/score(), instead of each constraint rebuilding it
 * independently (Sprint G1.1 Step 1).
 */
export function solve(input: SolverInput): SolverOutput {
  const context: ConstraintContext = {
    players:     input.players,
    courts:      input.courts,
    priorRounds: input.currentSchedule,
    history:     buildSchedulingHistory(input.currentSchedule),
  }

  const candidates = generateRoundCandidates(input.players, input.courts)
  const ranked = candidates
    .map(candidate => rankCandidate(candidate, context, input.constraints))
    .sort((a, b) => b.totalScore - a.totalScore)

  return { best: ranked[0]?.candidate ?? null, ranked }
}
