/**
 * Generic Constraint Solver — supporting types.
 *
 * Fully self-contained: no dependency on planner, generators, runtime,
 * rules, or any specific tournament format. A "round" here just means "one
 * simultaneous set of court assignments" — nothing here knows what
 * Americano, Mexicano, Round Robin, King of the Court, or Custom are.
 */

import type { Constraint } from './constraint.interface'
import type { SchedulingHistory } from './history/history.types'

export type PlayerId = string

// ── Candidates ────────────────────────────────────────────────────────────────

/** One court's proposed 2v2 assignment within a candidate round. */
export type CourtAssignment = {
  readonly courtNumber: number
  readonly teamA:       readonly [PlayerId, PlayerId]
  readonly teamB:       readonly [PlayerId, PlayerId]
}

/** One player's assignment within a candidate round. */
export type PlayerAssignment = {
  readonly playerId:    PlayerId
  /** null = this player rests during this round. */
  readonly courtNumber: number | null
  readonly team:        'A' | 'B' | null
}

/**
 * One complete proposal for "the next round": which players play on which
 * court, in which team, and who rests. The unit the solver ranks.
 */
export type RoundCandidate = {
  readonly id:          string
  readonly courts:      ReadonlyArray<CourtAssignment>
  readonly assignments: ReadonlyArray<PlayerAssignment>
}

// ── Constraint context ────────────────────────────────────────────────────────

/**
 * Everything a constraint needs to evaluate/score one candidate. Deliberately
 * generic — `priorRounds` stands in for "the current schedule so far",
 * without depending on SessionSchedule or any other feature's types.
 *
 * `history` is `buildSchedulingHistory(priorRounds)`, computed exactly once
 * by `solve()` and reused, unchanged, across every candidate and every
 * constraint's evaluate()/score() call in that solve() invocation (Sprint
 * G1.1 Step 1) — constraints must read `context.history`, never call
 * `buildSchedulingHistory` themselves.
 */
export type ConstraintContext = {
  readonly players:     ReadonlyArray<PlayerId>
  readonly courts:      ReadonlyArray<number>
  readonly priorRounds: ReadonlyArray<RoundCandidate>
  readonly history:     SchedulingHistory
}

// ── Constraint output ─────────────────────────────────────────────────────────

/** Relative importance of one constraint's score when combined with others. */
export type ConstraintWeight = number

export type ConstraintViolation = {
  readonly constraintId: string
  readonly candidateId:  string
  readonly message:      string
  readonly severity:     'error' | 'warning'
}

/** A single constraint's own 0–100 score for one candidate. Higher is better. */
export type ConstraintScore = {
  readonly constraintId: string
  readonly candidateId:  string
  readonly value:        number
  readonly weight:       ConstraintWeight
}

/**
 * Combined output of evaluate() + score() for one (candidate, constraint)
 * pair. `passed` is derived, not authored by constraints directly: false iff
 * `violations` contains an `'error'`-severity entry. Every built-in
 * constraint today only ever reports `'warning'` violations, so `passed` is
 * always `true` in current behaviour — this is a pure additive type
 * extension (Sprint G1 Step 6), not a behaviour change.
 */
export type ConstraintResult = {
  readonly score:      ConstraintScore
  readonly violations: ReadonlyArray<ConstraintViolation>
  readonly passed:     boolean
}

// ── Solver I/O ────────────────────────────────────────────────────────────────

export type SolverInput = {
  readonly players:         ReadonlyArray<PlayerId>
  readonly courts:          ReadonlyArray<number>
  readonly currentSchedule: ReadonlyArray<RoundCandidate>
  readonly constraints:     ReadonlyArray<Constraint>
}

/** One ranked candidate: its total combined score and each constraint's raw result. */
export type RankedCandidate = {
  readonly candidate:  RoundCandidate
  readonly totalScore: number
  readonly results:    ReadonlyArray<ConstraintResult>
}

export type SolverOutput = {
  readonly best:   RoundCandidate | null
  readonly ranked: ReadonlyArray<RankedCandidate>
}
